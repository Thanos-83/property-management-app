'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskMemberSchema, TaskMemberSchemaType } from '@/lib/schemas/task';
// import { addTaskAction } from '@/lib/actions/taskActions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  // DialogDescription,
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
// import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { memberInvitationAction } from '@/lib/actions/taskMemberActions';
import { toast } from 'sonner';

//FIX: This must be returned from the DB, from table user_roles!!!
const memberRole = ['cleaner', 'maintenance', 'inspection', 'other'];

type AddTaskModalProps = {
  onSuccess?: () => void;
};

export default function AddTaskMemberModal({ onSuccess }: AddTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TaskMemberSchemaType>({
    resolver: zodResolver(taskMemberSchema),
    defaultValues: {
      email: '',
      member_role: '',
    },
  });

  async function onSubmit(memberData: TaskMemberSchemaType) {
    console.log('Invite member data: ', memberData);
    setIsLoading(true);

    try {
      const response = await memberInvitationAction(memberData);
      console.log('Response in Dialog: ', response);
      // Print a message based on the response
      if (!response.status) {
        toast.warning(response.message);
      } else {
        toast.success('Invitation send to the member');
      }
      onSuccess?.();
      setIsLoading(false);
      setOpen(false);
    } catch (error) {
      // Print a message of an unexpected error
      console.log('Error inviting member: ', error);
      toast.error('Unkown Error sending invitation');
      setIsLoading(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default'>Invite Team Member</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Invite New Team Member</DialogTitle>
          {/* <DialogDescription>Create new task member.</DialogDescription> */}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type='email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='member_role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select task type' />
                      </SelectTrigger>
                      <SelectContent>
                        {memberRole.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end flex-wrap gap-3'>
              <DialogClose asChild>
                <Button
                  variant='outline'
                  className='w-full max-w-[160px]'
                  type='button'
                  disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                className='w-full max-w-[160px]'
                type='submit'
                disabled={isLoading}>
                {isLoading ? 'Inviting...' : 'Invite Member'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
