'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Loader2Icon, MailPlus } from 'lucide-react';
import { InviteMemberSchemaType, inviteMemberSchema } from '@/lib/schemas/createMemberSchema';
import { useRouter } from 'next/navigation';

type AddTaskModalProps = {
  onSuccess: () => void;
  taskTypes?: { id: string; name: string }[]; 
};

export default function AddTaskMemberModal({ onSuccess, taskTypes = [] }: AddTaskModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteMemberSchemaType>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      member_role: '',
    },
  });

  async function onSubmit(memberData: InviteMemberSchemaType) {
    setIsLoading(true);

    try {
      const response = await memberInvitationAction(memberData);
      
      if (!response.status) {
        // Handle duplicate invites gracefully
        // if (response.message.includes('active invitation')) {
        //    toast.warning('An invitation is already pending for this email.');
        // } else {
        //    toast.error(response.message);
        // }
           toast.error(response.message);

      } else {
        toast.success('Invitation sent successfully!');
        form.reset();
        setOpen(false);
        onSuccess();
        router.refresh();
      }
    } catch (error) {
      console.log('Error inviting member: ', error);
      toast.error('Unknown Error sending invitation');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) form.reset();
    }}>
      <DialogTrigger asChild>
        <Button variant='default' className="font-bold shadow-sm">
          <MailPlus className="w-4 h-4 mr-2" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Invite New Team Member</DialogTitle>
          <DialogDescription>
            Send a secure link for them to join your workspace. They will be required to set a password upon accepting.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 pt-2'>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">First Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Maria' className="bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Papadopoulou' className="bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='maria@example.com' className="bg-muted/20" {...field} />
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
                  <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Role <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className='w-full bg-muted/20'>
                        <SelectValue placeholder='Select their main responsibility' />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.length > 0 ? (
                          taskTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          // Fallback just in case props aren't loaded
                          <>
                            <SelectItem value="Cleaning">Cleaning</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Inspection">Inspection</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-4 border-t border-border mt-6'>
              <DialogClose asChild>
                <Button
                  variant='outline'
                  type='button'
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                className="font-bold shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <MailPlus className="mr-2 h-4 w-4" />}
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}