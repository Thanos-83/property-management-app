'use client';

import React, { useEffect, useState } from 'react';
import { Task, TaskStatus } from '@/types/taskTypes';
import {
  fetchTasksAction,
  updateTaskStatusAction,
} from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';

type TaskListProps = {
  propertyId: string;
  refreshTrigger?: number;
};

export default function TaskList({
  propertyId,
  refreshTrigger,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      const fetchedTasks = await fetchTasksAction();
      console.log('Tasks: ', fetchedTasks);
      if (!('error' in fetchedTasks)) {
        setTasks(fetchedTasks);
      }
      setLoading(false);
    }
    loadTasks();
  }, [propertyId, refreshTrigger]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const result = await updateTaskStatusAction(taskId, newStatus);
    if (!('error' in result)) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    }
  };

  return (
    <div className='space-y-4'>
      {tasks.length === 0 && <div>No tasks found for this property.</div>}
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`${
            loading && 'animate-pulse'
          } border rounded p-4 bg-white shadow-sm flex justify-between items-center`}>
          <div>
            <div>
              <strong>Type:</strong> {task.type}
            </div>
            <div>
              <strong>Scheduled Date:</strong>{' '}
              {new Date(task.scheduledDate).toLocaleDateString()}
            </div>
            <div>
              <strong>Status:</strong> {task.status}
            </div>
            {task.notes && (
              <div>
                <strong>Notes:</strong> {task.notes}
              </div>
            )}
          </div>
          <div className='space-x-2'>
            {task.status !== 'completed' && (
              <>
                {task.status !== 'accepted' && (
                  <Button
                    size='sm'
                    onClick={() => handleStatusChange(task.id, 'accepted')}>
                    Accept
                  </Button>
                )}
                {task.status !== 'in_progress' && (
                  <Button
                    size='sm'
                    onClick={() => handleStatusChange(task.id, 'in_progress')}>
                    Start
                  </Button>
                )}
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleStatusChange(task.id, 'completed')}>
                  Complete
                </Button>
              </>
            )}
            {task.status === 'completed' && (
              <span className='text-green-600 font-semibold'>Completed</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
