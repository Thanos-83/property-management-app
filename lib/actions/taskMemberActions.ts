'use server';

import {
  memberSignInSchema,
  MemberSigninSchemaType,
} from '../schemas/signInMemberSchema';
import { createClient } from '../utils/supabase/server';
import { createServiceClient } from '../utils/supabase/supabaseDB';
import InviteMemberEmail from '@/components/email-templates/invite-member-template';

import { revalidateTag } from 'next/cache';

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
  member_role: string;
  expiresInHours?: number;
  metadata?: Record<string, string>;
};
export const memberInvitationAction = async (payload: InvitePayload) => {
  const { email, member_role, expiresInHours = 48, metadata = {} } = payload;

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
  const base = `http://collaborators.myapp.site:3000`;

  const acceptUrl = `${base}/register?token=${rawToken}&email=${email}`;
  try {
    const { data, error } = await resend.emails.send({
      from: 'Welcome to Rendy.com <thanos_info@thanossbonias.site>',
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
      member_role,
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

    revalidateTag('members');
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

export const updateMemberInvitationAction = async (
  payload: UpdateInvitePayload
) => {
  const supabase = createServiceClient();
  const { token } = payload;

  // 1) compute SHA-256 hex hash of the token
  const hashToken = createHash('sha256').update(token).digest('hex');

  const { data: invitationData, error } = await supabase
    .from('invites')
    .select()
    .eq('invite_token_hash', hashToken)
    .single();

  if (!error) {
    let clickCount = invitationData.click_count;
    clickCount++;

    if (invitationData.used) {
      return {
        message: 'Token has been used',
        status: 4,
        data: {},
      };
    }

    if (invitationData.started === false) {
      const { data } = await supabase
        .from('invites')
        .update({
          started: true,
          click_count: clickCount,
          last_clicked_at: new Date().toISOString(),
        })
        .eq('invite_token_hash', hashToken)
        .select()
        .single();

      return {
        data: { clickCount: data.click_count, expiresAt: data.expires_at },
        status: 1,
        message: 'You are ok!',
      };
    }
    if (
      invitationData.started === true &&
      invitationData.click_count <= invitationData.max_clicks &&
      invitationData.expires_at > new Date(Date.now()).toISOString()
    ) {
      const { data } = await supabase
        .from('invites')
        .update({
          click_count: clickCount,
          last_clicked_at: new Date().toISOString(),
        })
        .eq('invite_token_hash', hashToken)
        .select()
        .single();
      return {
        data: { clickCount: data.click_count, expiresAt: data.expires_at },
        status: 1,
        message: 'You are ok!',
      };
    }

    if (
      invitationData.started === true &&
      invitationData.click_count > invitationData.max_clicks
    ) {
      return {
        message:
          'You have reached the maximum number of times you can use the current link!',
        status: 2,
        data: {},
      };
    } else if (
      invitationData.started === true &&
      invitationData.expires_at < new Date(Date.now()).toISOString()
    ) {
      return {
        message: 'Link has expired!',
        status: 3,
        data: {},
      };
    }
  }
};

export const createMemberFinalAction = async (data: CreateMemberSchemaType) => {
  const { firstName, lastName, mobilePhone, email, password } = data;
  const supabaseAdmin = createServiceClient();

  const { data: createdMemberData, error: errorCreatedMember } =
    await supabaseAdmin.auth.admin.createUser({
      email,
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

  if (errorCreatedMember) {
    return {
      status: 'fail',
      message: 'Error creating new Team Member',
    };
  }

  const { error } = await supabaseAdmin
    .from('team_members')
    .update({
      auth_member_id: createdMemberData.user?.id,
      first_name: firstName,
      last_name: lastName,
      phone: mobilePhone,
      has_portal_access: true,
      status: 'active',
    })
    .eq('email', email);

  if (error) {
    return {
      status: 'fail',
      message: 'Error updating team member data',
    };
  }

  // You have to mark the invitation as used=TRUE
  const { error: errorUpdateInvitation } = await supabaseAdmin
    .from('invites')
    .update({ used: true, accepted_at: new Date(Date.now()).toISOString })
    .eq('email', email);

  if (errorUpdateInvitation) {
    return {
      status: 'fail',
      message: 'Error updating invitation status',
    };
  }

  redirect('/login');
};

export const getTaskMembersAction = async () => {
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
    .eq('inviter_id', user?.id);

  if (error) {
    return { error: error, status: status, result: 'fail' };
  }

  return { members: data, status: status, result: 'success' };
};
