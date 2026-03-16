'use server';

import {
  memberSignInSchema,
  MemberSigninSchemaType,
} from '../schemas/signInMemberSchema';
import { createClient } from '../utils/supabase/server';
import { createServiceClient } from '../utils/supabase/supabaseDB';
import InviteMemberEmail from '@/components/email-templates/invite-member-template';

import { revalidatePath, revalidateTag } from 'next/cache';

import { randomBytes, createHash } from 'node:crypto';
import { Resend } from 'resend';
import { CreateMemberSchemaType } from '../schemas/createMemberSchema';
import { redirect } from 'next/navigation';

// ========= Invite task member actions =================

export async function signInTeamMember(formData: MemberSigninSchemaType) {
  const supabase = await createClient();

  // create Admin client, using the SERVICE_ROLE_SECRET_KEY,  to bypass the RLS Policies
  const supabaseAdminClient = createServiceClient();

  const result = memberSignInSchema.safeParse(formData);

  if (!result.success) {
    return { success: result.success, error: result.error.issues };
  }

  try {
    const { data: profileData, error: profileError } = await supabaseAdminClient
      .from('team_members')
      .select()
      .eq('email', result.data.email)
      .single();

    if (!profileData) {
      return {
        success: false,
        error: profileError,
        message: `No User with email: "${result.data.email}". `,
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword(result.data);

    if (error) {
      return {
        success: false,
        error,
        message: 'Invalid login password. Please try again!',
      };
    }

    console.log('Data signing in member: ', data);

    if (profileError) {
      throw new Error('Supabase error finding profile data!!');
    }

    // return { success: true, error: null, message: 'Successful login!' };
  } catch (error) {
    console.error('Unexpected signin error:', error);
    return {
      success: false,
      error,
      message: `Unexpected signin error: ${error} `,
    };
  }
  redirect('/member/tasks');
}

type InvitePayload = {
  email: string;
  first_name: string;
  last_name: string;
  member_role: string;
  expiresInHours?: number;
  metadata?: Record<string, string>;
};
export const memberInvitationAction = async (payload: InvitePayload) => {
  const { email, first_name, last_name, member_role, expiresInHours = 48, metadata = {} } = payload;

  console.log('Invite member action data: ', payload);

  // Supabase admin client (using Service Role Key)
  const supabaseAdmin = createServiceClient();

  // Supabase client (using Anon Key)
  const supabase = await createClient();

  // 1) Check if email already exists in invites table

  const { data: memberInfo } = await supabaseAdmin
    .from('invites')
    .select('email, expires_at, used, click_count, max_clicks')
    .eq('email', email)
    .single();
  console.log('Member info: ', memberInfo);

  if (memberInfo && memberInfo.used) {
    return {
      status: false,
      message: 'Email have been used!',
      data: memberInfo,
    };
  }

  if (
    memberInfo &&
    !memberInfo.used &&
    memberInfo.expires_at > new Date(Date.now()).toISOString() &&
    memberInfo.click_count < memberInfo.max_clicks
  ) {
    return {
      status: false,
      message: 'There is an active invitation for this email!',
      data: memberInfo,
    };
  }

  if (
    memberInfo &&
    !memberInfo.used &&
    memberInfo.expires_at < new Date(Date.now()).toISOString()
  ) {
    return {
      status: false,
      message:
        'Invalid invitation. Token has been expired. Please send new invitation',
      data: memberInfo,
    };
  }

  if (
    memberInfo &&
    !memberInfo.used &&
    memberInfo.click_count > memberInfo.max_clicks
  ) {
    return {
      status: false,
      message: `Invalid invitation.Link have been clicked more than ${memberInfo.max_clicks} times. Please send a new invitation`,
      data: memberInfo,
    };
  }
  // 2) generate raw token (hex)
  const rawToken = randomBytes(32).toString('hex');

  // 3) compute SHA-256 hex hash
  const hash = createHash('sha256').update(rawToken).digest('hex');

  // 4) compute expiry
  const expiresAt = new Date(
    Date.now() + expiresInHours * 3600 * 1000 // 'expiresInHoures' hours (60 mins x 60 secs)
    // Date.now() + 1 * 120 * 1000 //two minutes (2 mins x 60 secs)
  ).toISOString();

  // 5) Find the user that creates the invitation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('User not exists');
  }

  // 6) Send invitation email with Resend containing the link with all necessary info
  const resend = new Resend(process.env.RESEND_API_KEY!);

  // SOS: Needs to be done work with the base URL
  // const base = process.env.NEXT_PUBLIC_URL!.replace(/\/$/, '');
  const base = `https://collaborators.myapp.site:3000`;

  const acceptUrl = `${base}/register?token=${rawToken}&email=${email}`;
  try {
    const { data, error } = await resend.emails.send({
      from: 'Welcome to Rendy.com <thanos_info@cloudplatforms.space>',
      to: email,
      subject: 'Invitation to create account!', 
      react: InviteMemberEmail({ acceptUrl, expiresAt }),
    });

    if (error) {
      return {
        message: `Error sending email invitation: ${error.message}`,
        status: false,
        data: error,
      };
    }

    // 6) If there is no Error sending email invitation, Insert invitation row using service role key (only store hash)

    const insertPayload = {
      email,
      member_role,
      invite_token_hash: hash,
      inviter_id: user?.id,
      expires_at: expiresAt,
      used: false,
      metadata: metadata,
    };

    const { error: invitationError } = await supabaseAdmin
      .from('invites')
      .insert(insertPayload)
      .select()
      .single();

    if (invitationError) {
      return {
        status: false,
        data: invitationError,
        message: `Database error`,
      };
    }

    // create  member profile in team_members table
    const teamMembersPayload = {
      inviter_id: user?.id,
      email,
      first_name,
      last_name,
      member_role,
      status: 'pending',
    };

    const { error: teamMemberError } = await supabaseAdmin
      .from('team_members')
      .insert(teamMembersPayload);

    if (teamMemberError) {
      return {
        status: false,
        message: 'Failed to create member profile!',
        data: {},
      };
    }

    // revalidateTag('members');
    revalidatePath('/dashboard/members');
    return {
      status: true,
      message: 'Invitation email send successfuly!',
      data,
    };
  } catch (error) {
    return { error, status: 500 };
  }
};

type UpdateInvitePayload = {
  token: string;
};


// Update member invitation action
export const updateMemberInvitationAction = async (
  payload: UpdateInvitePayload
) => {
  const supabase = createServiceClient();
  const { token } = payload;

  try {
    // 1) compute SHA-256 hex hash of the token
    const hashToken = createHash('sha256').update(token).digest('hex');

    const { data: invitationData, error } = await supabase
      .from('invites')
      .select()
      .eq('invite_token_hash', hashToken)
      .single();

    // GUARD 1: Token does not exist or database error
    if (error || !invitationData) {
      return { status: 5, message: 'Invalid or missing invitation token.' };
    }

    // GUARD 2: Token has already been used successfully
    if (invitationData.used) {
      return { status: 4, message: 'Token has been used' };
    }

    // GUARD 3: Token has expired
    if (new Date(invitationData.expires_at) < new Date()) {
      return { status: 3, message: 'Link has expired!' };
    }

    // GUARD 4: Max Clicks Reached (Check this BEFORE incrementing)
    if (invitationData.click_count >= invitationData.max_clicks) {
      return { 
        status: 2, 
        message: 'You have reached the maximum number of times you can use the current link!' 
      };
    }

    // --- ALL CLEAR: Increment the click count ---
    const newClickCount = (invitationData.click_count || 0) + 1;
    
    const { data, error: updateError } = await supabase
      .from('invites')
      .update({
        started: true,
        click_count: newClickCount,
        last_clicked_at: new Date().toISOString(),
      })
      .eq('id', invitationData.id) // Target by ID for safety
      .select()
      .single();

    if (updateError) {
       return { status: 5, message: 'Failed to update token tracking.' };
    }

    // SUCCESS (Status 1 indicates the UI should render the form)
    return {
      status: 1,
      message: 'Valid token',
      data: { clickCount: data.click_count, expiresAt: data.expires_at },
    };

  } catch (err) {
    console.error("Token validation error:", err);
    return { status: 5, message: 'Unexpected server error' };
  }
};

// Create Team Member Final Action
export const createMemberFinalAction = async (data: CreateMemberSchemaType & { token: string }) => {
  const { firstName, lastName, mobilePhone, password, token } = data;
  const supabaseAdmin = createServiceClient();

  // 1. SECURE VALIDATION: Hash token and get the TRUE email and inviter_id from the DB
  const hashToken = createHash('sha256').update(token).digest('hex');
  const { data: inviteData, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('*')
    .eq('invite_token_hash', hashToken)
    .single();

  if (inviteError || !inviteData) {
    return { status: 'fail', message: 'Invalid or missing invitation token.' };
  }
  if (inviteData.used) {
    return { status: 'fail', message: 'This invitation has already been used.' };
  }

  const { email, inviter_id } = inviteData;

  console.log('Invite data: ', inviteData)
  // 2. CREATE USER
  const { data: createdMemberData, error: errorCreatedMember } =
    await supabaseAdmin.auth.admin.createUser({
      email, // Using the DB email, ignoring what the client sent
      password,
      email_confirm: true,
      phone_confirm: false,
      phone: mobilePhone,
      user_metadata: {
        name: firstName + ' ' + lastName,
        full_name: firstName + ' ' + lastName,
      },
      app_metadata: {
        role: 'member',
      },
    });
  console.log('Created member data: ', createdMemberData)
  console.log('Error created member: ', errorCreatedMember)
  if (errorCreatedMember) {
    // Handle the specific case where the email already exists
    if (errorCreatedMember.message.toLowerCase().includes('already registered') || errorCreatedMember.message.toLowerCase().includes('already exists')) {
      return {
        status: 'fail',
        message: 'An account with this email already exists. Please go to the Login page to access your account.',
      };
    }
    
    // Handle the specific case where the phone number is already used
    if (errorCreatedMember.code === 'phone_exists' || errorCreatedMember.message.toLowerCase().includes('phone number already registered')) {
      return {
        status: 'fail',
        message: 'This phone number is already in use by another account. Please use a different phone number.',
      };
    }

    return { status: 'fail', message: errorCreatedMember.message };
  }

  // 3. UPDATE TEAM MEMBERS (Strictly for this specific inviter!)
  const { error: teamError } = await supabaseAdmin
    .from('team_members')
    .update({
      auth_member_id: createdMemberData.user?.id,
      first_name: firstName,
      last_name: lastName,
      phone: mobilePhone,
      has_portal_access: true,
      status: 'active',
    })
    .eq('email', email)
    .eq('inviter_id', inviter_id); // STRICT FIX: Only update this host's record

  if (teamError) {
    return { status: 'fail', message: 'Error updating team member profile' };
  }

  // 4. MARK INVITATION AS USED
  await supabaseAdmin
    .from('invites')
    .update({ used: true, accepted_at: new Date().toISOString() })
    .eq('id', inviteData.id);

  redirect('/login');
};

export const getTaskMembersAction = async () => {
  try {
    const supabase = await createClient();

    // Auth: get the user from supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Select into database
    const { data, error, status } = await supabase
      .from('team_members')
      .select()
      .eq('inviter_id', user?.id) 
      .eq('status', 'active');

    if (error) {
      return { error: error.message, status: status, result: 'fail' };
    }

    return { members: data, status: status, result: 'success' };
  } catch (error) {
    console.error('Error fetching task members:', error);
    return {
      error: 'Error fetching task members',
      status: 500,
      result: 'fail',
    };
  }
};

// Delete team member action
export const deleteTeamMemberAction = async (memberId: string) => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceClient(); // Needed to delete from invites safely

    // Auth: get the user from supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized', status: 401, result: 'fail', member: null };
    }

    // 1) First, get the member's email before we delete them, 
    // so we can also delete any pending invitations they might have.
    const { data: memberData } = await supabase
      .from('team_members')
      .select('email, status')
      .eq('id', memberId)
      .eq('inviter_id', user.id) // Security check
      .single();

    if (!memberData) {
       return { member: null, error: 'Member not found', status: 404, result: 'fail' };
    }

    // 2) Delete from team_members
    const response = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('inviter_id', user.id);

    if (response.error) {
      return { member: null, error: response.error.message, status: response.status, result: 'fail' };
    }

    // 3) If they were pending, clean up the invites table!
    if (memberData.email) {
      const responseDeleteInvite = await supabaseAdmin
        .from('invites')
        .delete()
        .eq('email', memberData.email)
        .eq('inviter_id', user.id);

        if(responseDeleteInvite.error){
            return { member: null, error: responseDeleteInvite.error.message, status: responseDeleteInvite.status, result: 'fail' };
        }
    }

    revalidatePath('/dashboard/members'); 
    
    return { status: 200, result: 'success', error: null, member: null };
  } catch (error) {
    console.error('Error deleting task member:', error);
    return {
      error: 'Error deleting task member',
      status: 500,
      result: 'fail',
      member: null
    };
  }
};
// Fetch team members
export const fetchTeamMembersAction = async () => {
  try {
    const supabase = await createClient();

    // Auth: get the user from supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Select into database
    const { data, error, status } = await supabase
      .from('team_members')
      .select('*')
      .eq('inviter_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      return {members:null, error: error.message, status: status, result: 'fail' };
    }

     // --- NEW: Fetch invite details for pending members to check expiration/clicks ---
    if (data && data.length > 0) {
      const pendingEmails = data.filter(m => m.status === 'pending').map(m => m.email);
      
      if (pendingEmails.length > 0) {
        // Use Admin client to securely bypass any RLS on the invites table
        const supabaseAdmin = createServiceClient();
        
        const { data: invites } = await supabaseAdmin
          .from('invites')
          .select('email, expires_at, click_count, max_clicks')
          .in('email', pendingEmails)
          .eq('inviter_id', user.id);

        if (invites) {
          data.forEach(member => {
            if (member.status === 'pending') {
              const inv = invites.find(i => i.email === member.email);
              if (inv) {
                // Attach the invite metadata to the member object so the UI can read it
                member.invite_details = inv;
              }
            }
          });
        }
      }
    }

    return { members: data, error:null, status: status, result: 'success' };
  } catch (error) { 
    console.error('Error fetching task members:', error);
    return {
      error: 'Error fetching task members',
      status: 500,
      result: 'fail',
      members:null
    };
  }
};

// Resend team member invitation action
export const resendInvitationAction = async (email: string) => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceClient(); // Needed to query/update invites securely

    // 1. Auth check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { status: false, message: 'Unauthorized' };
    }

    // 2. Verify the invite exists and is still pending
    const { data: memberInfo } = await supabaseAdmin
      .from('invites')
      .select('used')
      .eq('email', email)
      .eq('inviter_id', user.id)
      .single();

    if (!memberInfo) {
      return { status: false, message: 'Original invitation not found' };
    }
    if (memberInfo.used) {
      return { status: false, message: 'This user has already accepted their invitation' };
    }

    // 3. Generate a brand new token and hash
    const rawToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const expiresInHours = 48;
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    // 4. Update the invites table with fresh data
    const { error: updateError } = await supabaseAdmin
      .from('invites')
      .update({
        invite_token_hash: hash,
        expires_at: expiresAt,
        click_count: 0,
        max_clicks: 5,
        started: false,
        last_clicked_at: null
      })
      .eq('email', email)
      .eq('inviter_id', user.id);

    if (updateError) {
      return { status: false, message: 'Failed to update invitation token in database' };
    }

    // 5. Send the new email
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const base = `https://collaborators.myapp.site:3000`; // Update this dynamic base URL as needed
    const acceptUrl = `${base}/register?token=${rawToken}&email=${email}`;

    const { error: emailError } = await resend.emails.send({
      from: 'Welcome to Rendy.com <thanos_info@cloudplatforms.space>',
      to: email,
      subject: 'Reminder: Invitation to join the team!', 
      react: InviteMemberEmail({ acceptUrl, expiresAt }),
    });

    if (emailError) {
      return { status: false, message: `Error sending email: ${emailError.message}` };
    }

    return { status: true, message: 'Invitation resent successfully!' };
  } catch (error) {
    console.error('Error resending invitation:', error);
    return { status: false, message: 'Unexpected error occurred while resending' };
  }
}
