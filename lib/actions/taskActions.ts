'use server';

import { createClient } from '../utils/supabase/server';

import { taskDetailsSchema, TaskDetailsSchemaType, taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import { revalidatePath, revalidateTag } from 'next/cache';
import { toUTC } from '../utils/calendarUtils';

export const fetchTasksAction = async () => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        team_members(
          email,
          first_name,
          last_name,
          phone
        ),
        property:properties!property_id (
          title
        )
        `
      )
      .eq('assigner_id', user?.id)
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

export const createTaskAction = async (taskData: any) => {
  // Note: Replace `any` with your specific schema type if using Zod parsing here, 
  // but be careful because `taskId` will be an empty string '' from the create form.

  try {
    const supabase = await createClient();

    const { data: {user} } = await supabase.auth.getUser();

    if(!user) {
      return { error: 'Unauthorized', status: 401 };
    }
    // 1. Separate the nested arrays and the frontend-only taskId
    const { taskTodos, taskId, ...dbTaskData } = taskData;

    // 2. Insert the Parent Task
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...dbTaskData,
        // Ensure data types are strictly correct for Supabase
        priority: dbTaskData.priority ? parseInt(dbTaskData.priority, 10) : null,
        team_member_id: dbTaskData.team_member_id === 'unassigned' ? null : dbTaskData.team_member_id,
        assigner_id: user?.id,
        scheduled_date: toUTC(dbTaskData.scheduled_date)?.toISOString(),  
      }])
      .select()
      .single();

    console.log('Data from adding task: ', data);

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

    // 4. Revalidate cache to instantly update the UI
    // Ensure you import { revalidateTag } from 'next/cache'; at the top of the file!
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
  status: string
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
  try {
    const {taskTodos, taskId, ...taskData} = parsed.data;
    const supabase = await createClient();
    console.log('Task data server: ', taskData);
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...taskData, priority: parseInt(taskData.priority, 10), scheduled_date: toUTC(taskData.scheduled_date)?.toISOString() })
      .eq('id', taskId)
      .select();

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
    const idsToKeep = formattedTodos.map(t => t.id);
    
    if (idsToKeep.length > 0) {
      // Delete rows that belong to this task, but are NOT in our updated list
      await supabase
        .from('task_list_item')
        .delete()
        .eq('task_id', taskId)
        .not('id', 'in', `(${idsToKeep.join(',')})`);
    } else {
      // If the array is empty, it means the user deleted EVERY checklist item
      await supabase
        .from('task_list_item')
        .delete()
        .eq('task_id', taskId);
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
    revalidateTag('tasks');
    return {data: response.data, status: response.status, error: response.error};
  } catch (error) {
    console.log('Error deleting tasks: ', error);
    return {data: null, status: 500, error: 'Error deleting tasks'};
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
