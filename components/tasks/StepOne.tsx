import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TaskSchemaType } from '@/lib/schemas/task';
import { UseFormReturn } from 'react-hook-form';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const taskTypes = ['cleaning', 'maintenance', 'inspection', 'other'];

type Property = {
  id: string;
  title: string;
};

type TaskMember = {
  id: string;
  name: string;
};

type TaskPriority = {
  id: number;
  created_at: string;
  priority: string;
  priority_color: string;
};

interface StepOneProps {
  form: UseFormReturn<TaskSchemaType>;
  properties: Property[];
  taskMembers: TaskMember[];
  taskPriorities: TaskPriority[];
}

function StepOne({
  form,
  properties,
  taskMembers,
  taskPriorities,
}: StepOneProps) {
  return (
    <>
      <FormField
        control={form.control}
        name='property_id'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Property</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select property' />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='type'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Task Type</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select task type' />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='priority'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Task Priority</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value.toString()}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select task priority' />
                </SelectTrigger>
                <SelectContent>
                  {taskPriorities.map((priority) => (
                    <SelectItem
                      key={priority.id}
                      value={priority.id.toString()}
                      className='items-center'>
                      <Badge
                        variant='outline'
                        className={`border-none gap-2 text-md font-medium items-baseline`}>
                        <span
                          className={cn(
                            priority.id === 1 &&
                              'bg-[var(--priority-low-color)]',
                            priority.id === 2 &&
                              'bg-[var(--priority-medium-color)]',
                            priority.id === 3 &&
                              'bg-[var(--priority-high-color)]',
                            'w-2 h-2 rounded-full'
                          )}></span>
                        {priority.priority.charAt(0).toUpperCase() +
                          priority.priority.slice(1)}
                        <p
                          style={{ color: priority.priority_color }}
                          className={cn(
                            priority.priority_color &&
                              `bg-[${priority.priority_color}]`
                          )}>
                          Dynamin color from DB: {priority.priority_color}
                        </p>
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='scheduled_date'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Scheduled Date</FormLabel>
            <FormControl>
              <Input type='date' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='team_member_id'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assignee (optional - can be assigned later)</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select assignee' />
                </SelectTrigger>

                <SelectContent>
                  {taskMembers.length === 0 && (
                    <SelectItem value='no-taskMembers' disabled>
                      No task members available
                    </SelectItem>
                  )}
                  {taskMembers.map((taskMember) => (
                    <SelectItem key={taskMember.id} value={taskMember.id}>
                      {taskMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='assigner_id'
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} value={field.value} hidden />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export default StepOne;
