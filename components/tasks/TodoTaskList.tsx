// components/TodoList.tsx
'use client';

import React, { useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  //   arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PlusIcon, Trash2 } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TaskSchemaType, SubtaskType } from '@/lib/schemas/task';

// --- Sortable Item Component ---
const SortableItem = ({
  id,
  description,
  onDelete,
}: {
  id: string;
  description: string;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    boxShadow: isDragging ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center justify-between bg-white py-1 px-1  mb-3 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center'>
        <Button
          variant='ghost'
          type='button' // Crucial: Prevents parent form submission
          {...listeners}
          {...attributes}
          className='!cursor-grab text-gray-400 mr-2 !p-2 focus:outline-none'
          aria-label='Drag handle'>
          <GripVertical className='h-5 w-5' />
        </Button>
        <span className='text-gray-800'>{description}</span>
      </div>
      <Button
        variant='ghost'
        type='button' // Crucial: Prevents parent form submission
        onClick={() => onDelete(id)}
        className='text-gray-400 !p-2 hover:text-red-500 focus:outline-none'
        aria-label='Delete item'>
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  );
};

// --- Main Todo List Component ---
const TodoList = () => {
  const { control } = useFormContext<TaskSchemaType>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'subtasks', // The field name in your form data
  });

  const todoRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);

      // Use the RHF move function
      move(oldIndex, newIndex);
    }
  };

  const addItem = () => {
    if (!todoRef.current?.value.trim()) return;

    const newItem: SubtaskType = {
      id: Date.now().toString(), // RHF requires a stable id for useFieldArray
      description: todoRef.current.value.trim(),
    };
    // Use the RHF append function
    append(newItem);
    todoRef.current.value = '';
  };

  const deleteItem = (id: string) => {
    const index = fields.findIndex((item) => item.id === id);
    if (index > -1) {
      // Use the RHF remove function
      remove(index);
    }
  };

  return (
    <div className='mt-4'>
      {/* Add Todo Input Area (Note: not a <form> element here) */}
      <div className='mb-4'>
        <Label htmlFor='todo' className='mb-2'>
          Add To-Do Items
        </Label>
        <div className='flex items-center gap-2'>
          <Input
            ref={todoRef}
            id='todo'
            name='todo'
            type='text'
            placeholder='Add a new todo item'
            className='flex-grow p-3 border'
          />
          <Button
            variant='secondary'
            type='button' // Crucial: Prevents parent form submission
            onClick={addItem}
            className='p-3'>
            <PlusIcon />
          </Button>
        </div>
      </div>

      {/* Dnd Context and Sortable Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}>
        <SortableContext
          // dnd-kit needs an array of IDs
          items={fields.map((item) => item.id)}
          strategy={verticalListSortingStrategy}>
          <div className='space-y-3'>
            {fields.map((item) => (
              // Note: we use item.id for the key and id, which comes from RHF field object
              <SortableItem
                key={item.id}
                id={item.id}
                description={item.description}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TodoList;
