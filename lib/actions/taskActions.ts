'use server';

import { createClient } from '../utils/supabase/server';

import { taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import { revalidateTag } from 'next/cache';

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

export const addTaskAction = async (taskData: TaskSchemaType) => {
  const parsed = taskSchema.safeParse(taskData);
  if (!parsed.success) {
    return { error: parsed.error, status: 400 };
  }

  // console.log('Parsed data: ', parsed);
  try {
    const supabase = await createClient();

    const { subtasks, ...taskData } = parsed.data;

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      return { error: error.message, status: 500 };
    }

    const subtasksData = subtasks.map((subtask) => {
      return { description: subtask.description, task_id: data.id };
    });

    const { error: subtasksError } = await supabase
      .from('task_list_item')
      .insert(subtasksData);

    if (subtasksError) {
      console.error('Error adding subtasks:', error);
      return { error: subtasksError.message, status: 500 };
    }

    // Revalidate tasks tag to update UI
    revalidateTag('tasks');
    // revalidatePath('/dashboard/tasks');

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

export const deleteTaskByIdAction = async (taskIds: string[]) => {
  console.log(taskIds);
  try {
    const supabase = await createClient();

    const response = await supabase.from('tasks').delete().in('id', taskIds);
    console.log('Response server: ', response);
    revalidateTag('tasks');
    return response;
  } catch (error) {
    console.log('Error deleting tasks: ', error);
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
