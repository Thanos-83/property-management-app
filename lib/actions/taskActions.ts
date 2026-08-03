'use server';

import { createClient } from '../utils/supabase/server';

import {
  taskDetailsSchema,
  TaskDetailsSchemaType,
  // taskSchema,
  // TaskSchemaType,
} from '@/lib/schemas/task';
import { revalidatePath, revalidateTag } from 'next/cache';
import { toUTC } from '../utils/calendarUtils';
import { format, startOfDay, subDays } from 'date-fns';
import { createServiceClient } from '../utils/supabase/supabaseDB';
import { TASK_DETAILS_QUERY } from '../constants/queries';

export const fetchTasksAction = async (
  timeframe: 'upcoming' | 'past' | 'all' = 'upcoming',
) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Initialize the base query with your specific select and assigner_id filter
    let query = supabase
      .from('tasks')
      .select(TASK_DETAILS_QUERY)
      .eq('assigner_id', user?.id);

    // 2. Calculate the start of yesterday (00:00:00)
    const startOfYesterday = startOfDay(subDays(new Date(), 1)).toISOString();

    // 3. Apply the conditional date filters
    if (timeframe === 'upcoming') {
      query = query.gte('scheduled_date', startOfYesterday);
    } else if (timeframe === 'past') {
      query = query.lt('scheduled_date', startOfYesterday);
    }

    // 4. Apply ordering (ascending for upcoming/all, descending for past tasks makes sense)
    query = query.order('scheduled_date', { ascending: timeframe !== 'past' });

    // 5. Execute the query
    const { data: tasks, error } = await query;

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

export const createTaskAction = async (taskData: any) => {
  // Note: Replace `any` with your specific schema type if using Zod parsing here,
  // but be careful because `taskId` will be an empty string '' from the create form.

  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized', status: 401 };
    }
    // 1. Separate the nested arrays and the frontend-only taskId
    const {
      taskTodos,
      taskId,
      newAttachments,
      attachmentsToRemove,
      ...dbTaskData
    } = taskData;

    // 2. Insert the Parent Task
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([
        {
          ...dbTaskData,

          booking_id:
            dbTaskData.booking_id === '' ? null : dbTaskData.booking_id,
          // Ensure data types are strictly correct for Supabase
          priority: dbTaskData.priority
            ? parseInt(dbTaskData.priority, 10)
            : null,
          team_member_id:
            dbTaskData.team_member_id === 'unassigned'
              ? null
              : dbTaskData.team_member_id,
          assigner_id: user?.id,
          scheduled_date: toUTC(dbTaskData.scheduled_date)?.toISOString(),
        },
      ])
      .select()
      .single();

    // console.log('Data from adding task: ', data);

    if (error) {
      console.error('Error adding task:', error);
      return { error: error.message, status: 500 };
    }

    // 3. Insert the Checklist Items (if any exist)
    if (taskTodos && taskTodos.length > 0) {
      const todosToInsert = taskTodos.map((todo: any) => ({
        task_id: data.id,
        description: todo.description,
        is_completed: todo.is_completed || false,
        sort_order: todo.sort_order || 0, // Catch the drag-and-drop order!
        // We leave completed_by and completed_datetime null since it's a brand new task
      }));

      const { error: todosError } = await supabase
        .from('task_list_item')
        .insert(todosToInsert);

      if (todosError) {
        // FIXED: Now correctly logging todosError instead of error
        console.error('Error adding checklist items:', todosError);
        return { error: todosError.message, status: 500 };
      }
    }

    if (newAttachments && newAttachments.length > 0) {
      const attachmentsToInsert = newAttachments.map((att: any) => ({
        task_id: data.id,
        file_url: att.file_url,
        file_name: att.file_name,
        file_type: att.file_type,
        uploaded_by: user?.id,
      }));
      const { error: attachmentsError } = await supabase
        .from('task_attachments')
        .insert(attachmentsToInsert);
      if (attachmentsError) {
        console.error('Error adding attachments:', attachmentsError);
        return { error: attachmentsError.message, status: 500 };
      }
    }

    // Log Task Creation
    await supabase.from('task_activity').insert({
      task_id: data.id,
      user_id: user.id,
      activity_type: 'system_log',
      content: 'Created this task',
    });

    // 4. Revalidate cache to instantly update the UI
    revalidateTag('tasks');

    return { data, status: 201 };
  } catch (error) {
    console.error('Error adding task:', error);
    return { error: 'Error adding task', status: 500 };
  }
};

export const fetchTaskStatusDataAction = async () => {
  try {
    const supabase = await createClient();

    const { data: taskStatusData, error } = await supabase
      .from('task_status')
      .select('*')
      .order('id', { ascending: true });

    // console.log('Task status server: ', taskStatusData);
    if (error) {
      console.error('Error fetching task status:', error);
      return { error: error.message, status: 500, data: null };
    }

    return { error: null, status: 200, data: taskStatusData };
  } catch (error) {
    console.error('Error fetching task status:', error);
    return {
      error: 'Error fetching task status',
      status: 500,
      data: null,
    };
  }
};

export const updateTaskStatusAction = async (
  taskId: string,
  status: string,
) => {
  try {
    const supabase = await createClient();
    console.log('Task id server: ', taskId);
    console.log('Task status server: ', status);

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: `${status}` })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error updating task status:', error);
      return { error: error.message, status: 500, data: null };
    }

    console.log('Data updating status: ', error);

    revalidateTag('tasks');
    return { data, status: 200, error: null };
  } catch (error) {
    console.error('Error updating task status:', error);
    return { error: 'Error updating task status', status: 500, data: null };
  }
};

export const updateTaskAction = async (taskData: TaskDetailsSchemaType) => {
  const parsed = taskDetailsSchema.safeParse(taskData);
  if (!parsed.success) {
    return { error: parsed.error, status: 400 };
  }

  console.log('Task data server: ', parsed.data);
  try {
    const {
      taskTodos,
      taskId,
      newAttachments,
      attachmentsToRemove,
      ...taskData
    } = parsed.data;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Fetch the old task to compare changes for logging
    const { data: oldTask } = await supabase
      .from('tasks')
      .select(
        `
        status, 
        priority:task_priorities(
          id,
          priority
        ),
        team_member:team_members(
          first_name,
          last_name,
          id
        ),
        scheduled_date
      `,
      )
      .eq('id', taskId)
      .single();

    // The form sends 'unassigned', but the database needs 'null'
    const newTeamMemberId =
      taskData.team_member_id === 'unassigned' ? null : taskData.team_member_id;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...taskData,
        booking_id: taskData.booking_id === '' ? null : taskData.booking_id,
        team_member_id: newTeamMemberId,
        priority: parseInt(taskData.priority, 10),
        scheduled_date: toUTC(taskData.scheduled_date)?.toISOString(),
      })
      .eq('id', taskId)
      .select();

    // ADD THIS CHECK:
    if (data && data.length === 0) {
      console.warn(
        '🚨 ZERO ROWS UPDATED! Supabase RLS is silently blocking the update on the tasks table.',
      );
    }

    if (error) {
      console.error('Error updating task:', error);
      return { error: error.message, status: 500, data: null };
    }

    // 2. Prepare the Todos (CRITICAL: Add the task_id to every item!)
    const formattedTodos = taskTodos.map((todo) => ({
      id: todo.id,
      task_id: taskId,
      description: todo.description,
      is_completed: todo.is_completed,
      sort_order: todo.sort_order,
      completed_by_member: todo.completed_by_member || null,
      completed_datetime: todo.completed_datetime || null,
    }));

    // 3. Upsert the items (Updates existing ones, Inserts new ones)
    if (formattedTodos.length > 0) {
      const { error: upsertError } = await supabase
        .from('task_list_item')
        .upsert(formattedTodos);

      if (upsertError) {
        console.error('Error upserting task todos:', upsertError);
        return { error: 'Error updating task todos', status: 500, data: null };
      }
    }

    // 4. Handle Deletions (Delete any items that the user removed in the UI)
    const idsToKeep = formattedTodos.map((t) => t.id);

    if (idsToKeep.length > 0) {
      // Delete rows that belong to this task, but are NOT in our updated list
      await supabase
        .from('task_list_item')
        .delete()
        .eq('task_id', taskId)
        .not('id', 'in', `(${idsToKeep.join(',')})`);
    } else {
      // If the array is empty, it means the user deleted EVERY checklist item
      await supabase.from('task_list_item').delete().eq('task_id', taskId);
    }

    // 4. Handle Attachment Deletions (Physical Storage & Database)

    let removedCount = 0;
    if (attachmentsToRemove && attachmentsToRemove.length > 0) {
      // --- THE FIX: Fetch file paths to clean up the Storage Bucket ---
      const { data: recordsToDelete } = await supabase
        .from('task_attachments')
        .select('file_url')
        .in('id', attachmentsToRemove);

      if (recordsToDelete && recordsToDelete.length > 0) {
        // Extract the filenames/paths from the URLs
        const paths = recordsToDelete
          .map((r) => r.file_url.split('/').pop())
          .filter(Boolean) as string[];

        if (paths.length > 0) {
          // Remove physical files from Supabase Storage
          const { error: storageError } = await supabase.storage
            .from('task_attachments')
            .remove(paths);

          if (storageError)
            console.error('Error cleaning up storage bucket:', storageError);
        }
      }

      // Delete the metadata records from the database table
      const { error: deleteError } = await supabase
        .from('task_attachments')
        .delete()
        .in('id', attachmentsToRemove);
      if (!deleteError) removedCount = attachmentsToRemove.length;
      if (deleteError)
        console.error('Error removing attachment records:', deleteError);
    }

    // 5. Handle New Attachment Insertions
    let addedCount = 0;
    if (newAttachments && newAttachments.length > 0) {
      const attachmentsToInsert = newAttachments.map((att: any) => ({
        task_id: taskId,
        file_url: att.file_url,
        file_name: att.file_name,
        file_type: att.file_type,
        uploaded_by: user.id,
      }));

      const { error: insertError } = await supabase
        .from('task_attachments')
        .insert(attachmentsToInsert);
      if (!insertError) addedCount = newAttachments.length;
      if (insertError)
        console.error('Error saving new attachments:', insertError);
    }

    // 6. Generate System Activity Logs
    const activitiesToLog = [];
    // 6.1 Status Change
    if (oldTask && taskData.status && oldTask.status !== taskData.status) {
      activitiesToLog.push({
        task_id: taskId,
        user_id: user.id,
        activity_type: 'system_log',
        content: `Changed status to **${taskData.status.replace('_', ' ')}**`,
      });
    }

    const oldPriority: any = oldTask?.priority;
    const oldPriorityId: number = oldPriority?.id;
    // 6.2 Priority Change
    if (
      oldTask &&
      taskData.priority &&
      String(oldPriorityId || '') !== String(taskData.priority || '')
    ) {
      const { data: newTaskPriorityData } = await supabase
        .from('task_priorities')
        .select('priority')
        .eq('id', taskData.priority)
        .single();
      activitiesToLog.push({
        task_id: taskId,
        user_id: user.id,
        activity_type: 'system_log',
        content: `Changed priority to **${newTaskPriorityData?.priority}**`,
      });
    }

    // 6.3 Team Member Change
    // Safely extract the old ID whether Supabase returns an object or an array of objects
    const oldTeamMemberRaw = oldTask?.team_member as any;
    const oldTeamMemberId = Array.isArray(oldTeamMemberRaw)
      ? oldTeamMemberRaw[0]?.id
      : oldTeamMemberRaw?.id || null;

    // We already normalized the newTeamMemberId at the top of the file!
    if (oldTeamMemberId !== newTeamMemberId) {
      if (newTeamMemberId === null) {
        // Case A: The task was unassigned
        activitiesToLog.push({
          task_id: taskId,
          user_id: user.id,
          activity_type: 'system_log',
          content: `Changed team member to **Unassigned**`,
        });
      } else {
        // Case B: The task was assigned to someone new
        const { data: newTeamMemberData } = await supabase
          .from('team_members')
          .select('first_name, last_name')
          .eq('id', newTeamMemberId)
          .single();

        const fullName =
          `${newTeamMemberData?.first_name || ''} ${newTeamMemberData?.last_name || ''}`.trim() ||
          'Unknown Member';

        activitiesToLog.push({
          task_id: taskId,
          user_id: user.id,
          activity_type: 'system_log',
          content: `Changed team member to **${fullName}**`,
        });
      }
    }

    // 6.4 File Attachment
    if (addedCount > 0) {
      activitiesToLog.push({
        task_id: taskId,
        user_id: user.id,
        activity_type: 'system_log',
        content: `Attached ${addedCount} new file(s)`,
      });
    }

    // 6.5 File Removal
    if (removedCount > 0) {
      activitiesToLog.push({
        task_id: taskId,
        user_id: user.id,
        activity_type: 'system_log',
        content: `Removed ${removedCount} file(s)`,
      });
    }

    // 6.6 Scheduled Date Change
    if (oldTask?.scheduled_date && taskData.scheduled_date) {
      const oldDate = new Date(oldTask.scheduled_date).setHours(0, 0, 0, 0);
      const newDate = new Date(taskData.scheduled_date).setHours(0, 0, 0, 0);

      if (oldDate !== newDate) {
        const formattedOldDate = format(
          new Date(oldTask.scheduled_date),
          'MMM d, yyyy',
        );
        const formattedNewDate = format(
          new Date(taskData.scheduled_date),
          'MMM d, yyyy',
        );
        activitiesToLog.push({
          task_id: taskId,
          user_id: user.id,
          activity_type: 'system_log',
          content: `Changed scheduled date from **${formattedOldDate}** to **${formattedNewDate}**`,
        });
      }
    }

    if (activitiesToLog.length > 0) {
      await supabase.from('task_activity').insert(activitiesToLog);
    }

    revalidateTag('tasks');
    return { data, status: 200, error: null };
  } catch (error) {
    console.error('Error updating task:', error);
    return { error: 'Error updating task', status: 500, data: null };
  }
};

export const deleteTaskByIdAction = async (taskId: string) => {
  try {
    const supabase = await createClient();

    const response = await supabase.from('tasks').delete().eq('id', taskId);
    // revalidateTag('tasks');
    return {
      data: response.data,
      status: response.status,
      error: response.error,
    };
  } catch (error) {
    console.log('Error deleting tasks: ', error);
    return { data: null, status: 500, error: 'Error deleting tasks' };
  }
};

export const fetchTaskPrioritiesAction = async () => {
  try {
    const supabase = await createClient();

    const { data: taskPriorities, error } = await supabase
      .from('task_priorities')
      .select('*')
      .order('id', { ascending: true });

    // console.log('Task priorities server: ', taskPriorities);
    if (error) {
      console.error('Error fetching tasks priorities:', error);
      return { error: error.message, status: 500, data: null };
    }

    return { error: null, status: 200, data: taskPriorities };
  } catch (error) {
    console.error('Error fetching tasks priorities:', error);
    return {
      error: 'Error fetching tasks priorities',
      status: 500,
      data: null,
    };
  }
};

export const fetchTaskTypesAction = async () => {
  try {
    const supabase = await createClient();

    const { data: taskTypes, error } = await supabase
      .from('task_types')
      .select('id, name')
      .eq('is_active', true);

    // console.log('Task types server: ', taskTypes);
    if (error) {
      console.error('Error fetching tasks types:', error);
      return { error: error.message, status: 500, data: null };
    }

    return { error: null, status: 200, data: taskTypes };
  } catch (error) {
    console.error('Error fetching tasks types:', error);
    return {
      error: 'Error fetching tasks types',
      status: 500,
      data: null,
    };
  }
};

/**
 * Add a manual comment to a task
 */
export const addTaskCommentAction = async (taskId: string, content: string) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized', status: 401 };

    const { data, error } = await supabase
      .from('task_activity')
      .insert({
        task_id: taskId,
        user_id: user.id,
        activity_type: 'user_comment',
        content: content.trim(),
      })
      .select()
      .single();

    if (error) return { error: error.message, status: 500 };

    return { data, status: 201, error: null };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { error: 'Failed to add comment', status: 500, data: null };
  } finally {
    revalidatePath('/dashboard/calendar', 'page');
    revalidatePath('/dashboard/tasks', 'page');
    revalidatePath(`/member/tasks/${taskId}`, 'page');
  }
};
