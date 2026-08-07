'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Fetch tasks assigned to the currently logged-in team member
export const getMyAssignedTasksAction = async () => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceClient();

    // 1. Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized', status: 401, data: null };
    }

    // 2. Find their team_member profile ID using their auth ID
    const { data: memberProfile, error: profileError } = await supabase
      .from('team_members')
      .select('id, first_name, last_name')
      .eq('auth_member_id', user.id)
      .single();

    if (profileError || !memberProfile) {
      console.error('Team member profile not found for user:', user.id);
      return {
        error: 'Team member profile not found',
        status: 404,
        data: null,
      };
    }

    // 3. Fetch their assigned tasks, including the property title
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(
        `
        id,
        type,
        status,
        scheduled_date,
        priority,
        notes,
        property_id,
        property:properties!tasks_property_id_fkey(title, location)
      `,
      )
      .eq('team_member_id', memberProfile.id)
      .neq('status', 'cancelled') // Don't show cancelled tasks
      .order('scheduled_date', { ascending: true });

    if (tasksError) {
      return { error: tasksError.message, status: 500, data: null };
    }

    return {
      data: tasks,
      member: memberProfile, // Returning the profile so we can say "Hello, Maria"
      status: 200,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return { error: 'Internal Server Error', status: 500, data: null };
  }
};

// ============================================================================
// TASK EXECUTION ACTIONS (For the Mobile Member Portal)
// ============================================================================

export const getSingleAssignedTaskAction = async (taskId: string) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user)
      return { error: 'Unauthorized', status: 401, data: null };

    // 1. Get their team member profile ID
    const { data: memberProfile } = await supabase
      .from('team_members')
      .select('id')
      .eq('auth_member_id', user.id)
      .single();

    if (!memberProfile)
      return { error: 'Profile not found', status: 404, data: null };

    // 2. Fetch the specific task using Admin client to bypass Property RLS
    const supabaseAdmin = createServiceClient();
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select(
        `
        *,
        property:properties!tasks_property_id_fkey(title, location),
        taskTodos:task_list_item(*),
        attachments:task_attachments(*),
        task_activity(*)
      `,
      )
      .eq('id', taskId)
      .eq('team_member_id', memberProfile.id) // SECURITY: Must be assigned to them!
      .single();

    if (taskError || !task)
      return {
        error: 'Task not found or unauthorized',
        status: 404,
        data: null,
      };

    // Sort checklist items
    if (task.taskTodos) {
      task.taskTodos.sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0),
      );
    }

    return { data: task, status: 200, error: null };
  } catch (error) {
    return { error: 'Internal Server Error', status: 500, data: null };
  }
};

export const toggleChecklistItemAction = async (
  itemId: string,
  isCompleted: boolean,
  taskId: string,
) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Find their profile ID
    const { data: memberProfile } = await supabase
      .from('team_members')
      .select('id')
      .eq('auth_member_id', user.id)
      .single();

    if (!memberProfile) return { success: false, error: 'Profile not found' };

    // SECURE GATEKEEPER: Ensure the task is explicitly assigned to this exact user
    const supabaseAdmin = createServiceClient();
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('team_member_id', memberProfile.id)
      .single();

    if (!task) return { success: false, error: 'Unauthorized task access' };

    // Update the item via Admin client to bypass RLS blocks
    const { error } = await supabaseAdmin
      .from('task_list_item')
      .update({
        is_completed: isCompleted,
        completed_datetime: isCompleted ? new Date().toISOString() : null,
        completed_by_member: isCompleted ? user.id : null,
      })
      .eq('id', itemId)
      .eq('task_id', taskId); // Secondary security check

    if (error) throw error;

    revalidatePath(`/member/tasks/${taskId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const completeAssignedTaskAction = async (taskId: string) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Find their profile ID
    const { data: memberProfile } = await supabase
      .from('team_members')
      .select('id')
      .eq('auth_member_id', user.id)
      .single();

    if (!memberProfile) return { success: false, error: 'Profile not found' };

    const supabaseAdmin = createServiceClient();

    // SECURE GATEKEEPER: Verify ownership and update simultaneously
    const { error } = await supabaseAdmin
      .from('tasks')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('team_member_id', memberProfile.id); // Prevents them from completing other people's tasks

    if (error) throw error;

    // Log the activity
    await supabaseAdmin.from('task_activity').insert({
      task_id: taskId,
      user_id: user.id,
      activity_type: 'system_log',
      content: `Marked the task as **Completed**`,
    });

    revalidatePath('/member/tasks');
    revalidatePath(`/member/tasks/${taskId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const uploadTaskAttachmentRecordAction = async (
  taskId: string,
  fileUrl: string,
  fileName: string,
  fileType: string,
) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Find their profile ID
    const { data: memberProfile } = await supabase
      .from('team_members')
      .select('id')
      .eq('auth_member_id', user.id)
      .single();

    if (!memberProfile) return { success: false, error: 'Profile not found' };

    const supabaseAdmin = createServiceClient();

    // SECURE GATEKEEPER: Verify ownership
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('team_member_id', memberProfile.id)
      .single();

    if (!task) return { success: false, error: 'Unauthorized task access' };

    // Use Admin client to bypass any insert restrictions
    const { data, error } = await supabaseAdmin
      .from('task_attachments')
      .insert({
        task_id: taskId,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('task_activity').insert({
      task_id: taskId,
      user_id: user.id,
      activity_type: 'system_log',
      content: `Uploaded a photo: **${fileName}**`,
    });

    revalidatePath(`/member/tasks/${taskId}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const addTaskCommentAction = async (taskId: string, content: string) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Find their profile ID
    const { data: memberProfile } = await supabase
      .from('team_members')
      .select('id')
      .eq('auth_member_id', user.id)
      .single();

    if (!memberProfile) return { success: false, error: 'Profile not found' };

    const supabaseAdmin = createServiceClient();

    // SECURE GATEKEEPER: Verify ownership
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('team_member_id', memberProfile.id)
      .single();

    if (!task) return { success: false, error: 'Unauthorized task access' };

    const { error } = await supabaseAdmin.from('task_activity').insert({
      task_id: taskId,
      user_id: user.id,
      activity_type: 'user_comment',
      content: content,
    });

    if (error) throw error;

    revalidatePath(`/member/tasks/${taskId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getMemberProfileAction = async () => {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user)
      return { error: 'Unauthorized', status: 401, data: null };

    // 2. Fetch their team_member profile
    const { data: profile, error: profileError } = await supabase
      .from('team_members')
      .select('*')
      .eq('auth_member_id', user.id)
      .single();

    if (profileError || !profile) {
      return { error: 'Profile not found', status: 404, data: null };
    }

    // 3. Fetch their task stats using Admin Client (bypassing Property RLS)
    const supabaseAdmin = createServiceClient();

    const { count: completedCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('team_member_id', profile.id)
      .eq('status', 'completed');

    const { count: pendingCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('team_member_id', profile.id)
      .neq('status', 'completed')
      .neq('status', 'cancelled');

    // Combine profile with stats
    const profileWithStats = {
      ...profile,
      stats: {
        completed: completedCount || 0,
        pending: pendingCount || 0,
      },
    };

    return { data: profileWithStats, status: 200, error: null };
  } catch (error: any) {
    console.error('Error fetching member profile:', error);
    return { error: 'Internal Server Error', status: 500, data: null };
  }
};

// Update Team Member Information
export const updateMemberProfileAction = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl?: string | null;
}) => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceClient();

    // 1. Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Construct the update payload securely
    const updatePayload: any = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
    };

    // Only update the avatar if it was explicitly provided (to prevent accidental nullification)
    if (data.avatarUrl !== undefined) {
      updatePayload.avatar_url = data.avatarUrl;
    }

    // 3. Update the team_members table using the auth_member_id mapping
    const { error } = await supabaseAdmin
      .from('team_members')
      .update(updatePayload)
      .eq('auth_member_id', user.id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // 4. Refresh the UI
    revalidatePath('/member/profile');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating member profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile',
    };
  }
};

export const memberSignOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
};
