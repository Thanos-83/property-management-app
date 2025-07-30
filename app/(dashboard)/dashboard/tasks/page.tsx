'use client';

import React, { useState } from 'react';
import TaskList from '@/components/tasks/TaskList';
import AddTaskModal from '@/components/tasks/AddTaskModal';

function TasksPage() {
  // You can modify this to pass a default or selected propertyId as needed
  const defaultPropertyId = '';

  const [taskAddedCount, setTaskAddedCount] = useState(0);

  const handleTaskAdded = () => {
    setTaskAddedCount((count) => count + 1);
  };

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold mb-4'>Tasks</h1>

        <AddTaskModal onSuccess={handleTaskAdded} />
      </div>
      <TaskList
        propertyId={defaultPropertyId}
        refreshTrigger={taskAddedCount}
      />
    </div>
  );
}

export default TasksPage;
