import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import { addTaskAction } from '@/lib/actions/taskActions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';

const taskTypes = ['cleaning', 'maintenance', 'inspection', 'other'];

type Property = {
  id: string;
  title: string;
};

type AddTaskModalProps = {
  onSuccess?: () => void;
};

export default function AddTaskMemberModal({ onSuccess }: AddTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    async function fetchProperties() {
      const response = await getPropertiesDataAction();
      if (response.status === 200 && response.properties) {
        setProperties(response.properties);
      } else {
        toast.error('Failed to load properties');
      }
    }
    fetchProperties();

    // For assignees, no data source found, so leave empty or add dummy data if needed
    setAssignees([]);
  }, []);

  const form = useForm<TaskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      type: '',
      scheduled_date: '',
      notes: '',
      assignee_id: undefined,
      property_id: '',
      status: 'pending',
    },
  });

  async function onSubmit(data: TaskSchemaType) {
    setIsLoading(true);
    try {
      // Map camelCase keys from form to snake_case for DB
      const payload = {
        ...data,
        property_id: data.property_id,
        assignee_id: data.assignee_id,
        scheduled_date: data.scheduled_date,
        notes: data.notes,
        type: data.type,
      };

      const response = await addTaskAction(payload);

      if (response.status === 201) {
        toast.success('Task added successfully');
        form.reset();
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error('Failed to add task');
      }
    } catch (error) {
      console.log('Error adding task: ', error);
      toast.error('An error occurred while adding task');
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default'>Create Task Member</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>Create new task member.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='assignee_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee (optional)</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select assignee' />
                      </SelectTrigger>

                      <SelectContent>
                        {assignees.length === 0 && (
                          <SelectItem value='no-assignees' disabled>
                            No assignees available
                          </SelectItem>
                        )}
                        {assignees.map((assignee) => (
                          <SelectItem key={assignee.id} value={assignee.id}>
                            {assignee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end space-x-2'>
              <DialogClose asChild>
                <Button variant='outline' type='button' disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
