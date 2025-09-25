'use server';

import InviteMemberEmail from '@/components/email-templates/invite-member-template';
import { createClient } from '../utils/supabase/server';
import { createServiceClient } from '../utils/supabase/supabaseDB';

import { taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import { revalidateTag } from 'next/cache';

import { randomBytes, createHash } from 'node:crypto';
import { Resend } from 'resend';

export const fetchTasksAction = async () => {
  try {
    const supabase = await createClient();

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return { error: error.message, status: 500 };
    }

    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { error: 'Error fetching tasks', status: 500 };
  }
};

export const fetchTasksByPropertyAction = async (propertyId: string) => {
  try {
    const supabase = await createClient();

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('property_id', propertyId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return { error: error.message, status: 500 };
    }

    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { error: 'Error fetching tasks', status: 500 };
  }
};

export const addTaskAction = async (taskData: TaskSchemaType) => {
  const parsed = taskSchema.safeParse(taskData);
  if (!parsed.success) {
    return { error: parsed.error, status: 400 };
  }

  try {
    const supabase = await createClient();

    console.log('Task Data: ', parsed.data);

    const { data, error } = await supabase.from('tasks').insert([parsed.data]);

    if (error) {
      console.error('Error adding task:', error);
      return { error: error.message, status: 500 };
    }

    // Revalidate tasks tag to update UI
    revalidateTag('tasks');

    return { data, status: 201 };
  } catch (error) {
    console.error('Error adding task:', error);
    return { error: 'Error adding task', status: 500 };
  }
};

export const updateTaskStatusAction = async (
  taskId: string,
  status: string
) => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      return { error: error.message, status: 500 };
    }

    return { data, status: 200 };
  } catch (error) {
    console.error('Error updating task status:', error);
    return { error: 'Error updating task status', status: 500 };
  }
};

// ========= Invite task member actions =================

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

    if (error) {
      return {
        status: false,
        data: invitationError,
        message: `Database error`,
      };
    }

    // create  member profile in team_members table

    const teamMembersPayload = {
      user_id: user?.id,
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

export const createMemberFinalAction = async () => {};
