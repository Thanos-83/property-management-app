'use server';

import { createClient } from '../utils/supabase/server';
import { taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import { revalidateTag } from 'next/cache';

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
