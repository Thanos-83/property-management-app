'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskDetailsSheet } from '../calendar/TaskDetailsSheet'; // Adjust path if needed
import { Property } from '@/types/propertyTypes';
import {
  TaskPrioritiesOption,
  TaskStatusOption,
  CurrentUserDisplayInfo,
} from '@/types/taskTypes';

interface CreateTaskButtonProps {
  properties: Property[];
  members: { id: string; name: string }[];
  priorities: TaskPrioritiesOption[];
  statuses: TaskStatusOption[];
  currentUserId: string;
  currentUserInfo: CurrentUserDisplayInfo;
}

export function CreateTaskButton({
  properties,
  members,
  priorities,
  statuses,
  currentUserId,
  currentUserInfo,
}: CreateTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className='gap-2 shadow-sm font-bold'>
        <Plus className='w-4 h-4' />
        Create Task
      </Button>

      <TaskDetailsSheet
        task={null}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        mode='create'
        properties={properties}
        teamMembers={members}
        taskPriorities={priorities}
        taskStatus={statuses}
        currentUserId={currentUserId}
        currentUserInfo={currentUserInfo}
        currentDate={new Date()}
      />
    </>
  );
}
