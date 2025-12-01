'use client';
import { useCallback, useId, useState } from 'react';
import { Edit3Icon, Loader, RefreshCcwIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateTaskStatusAction } from '@/lib/actions/taskActions';
import { toast } from 'sonner';

export default function UpdateTaskStatus({
  taskId,
  taskStatus,
}: {
  taskId: string;
  taskStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(taskStatus);
  const id = useId();
  //   console.log('open dialog status: ', open);

  const handleUpdateTaskStatus = useCallback(async () => {
    setLoading(true);
    const response = await updateTaskStatusAction(taskId, newStatus);
    if (!response.error) {
      setTimeout(() => {
        setOpen(false);
        setLoading(false);
        toast.success('Status updated successfully');
      }, 500);
    } else {
      toast.error('Error updating status');
      setLoading(false);
    }
  }, [newStatus, taskId]);
  return (
    <Dialog open={open} onOpenChange={() => setOpen(!open)}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='w-8 h-8'>
          <Edit3Icon className='w-8 h-8' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className='mb-2 flex flex-col gap-2'>
          <div
            className='flex size-11 shrink-0 items-center justify-center rounded-full border'
            aria-hidden='true'>
            <RefreshCcwIcon className='opacity-80' size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className='text-left'>
              Change your task status
            </DialogTitle>
            <DialogDescription className='text-left'>
              Pick one of the following statuses.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className='space-y-5'>
          <RadioGroup
            className='gap-2'
            onValueChange={(value) => setNewStatus(value)}
            defaultValue={
              taskStatus === 'pending'
                ? 'pending'
                : taskStatus === 'accepted'
                  ? 'accepted'
                  : taskStatus === 'in_progress'
                    ? 'in_progress'
                    : 'completed'
            }>
            {/* Radio card #1 */}
            <div className='relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent'>
              <RadioGroupItem
                value='pending'
                id={`${id}-pending`}
                aria-describedby={`${id}-pending-description`}
                className='order-1 after:absolute after:inset-0'
              />
              <div className='grid grow gap-1'>
                <Label htmlFor={`${id}-1`}>Pending</Label>
                <p
                  id={`${id}-1-description`}
                  className='text-xs text-muted-foreground'>
                  $4 per member/month
                </p>
              </div>
            </div>
            {/* Radio card #2 */}
            <div className='relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent'>
              <RadioGroupItem
                value='accepted'
                id={`${id}-accepted`}
                aria-describedby={`${id}-accepted-description`}
                className='order-1 after:absolute after:inset-0'
              />
              <div className='grid grow gap-1'>
                <Label htmlFor={`${id}-2`}>Accepted</Label>
                <p
                  id={`${id}-2-description`}
                  className='text-xs text-muted-foreground'>
                  $19 per member/month
                </p>
              </div>
            </div>
            {/* Radio card #3 */}
            <div className='relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent'>
              <RadioGroupItem
                value='in_progress'
                id={`${id}-in_progress`}
                aria-describedby={`${id}-in_progress-description`}
                className='order-1 after:absolute after:inset-0'
              />
              <div className='grid grow gap-1'>
                <Label htmlFor={`${id}-3`}>In Progress</Label>
                <p
                  id={`${id}-3-description`}
                  className='text-xs text-muted-foreground'>
                  $32 per member/month
                </p>
              </div>
            </div>
            {/* Radio card #4 */}
            <div className='relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent'>
              <RadioGroupItem
                value='completed'
                id={`${id}-completed`}
                aria-describedby={`${id}-completed-description`}
                className='order-1 after:absolute after:inset-0'
              />
              <div className='grid grow gap-1'>
                <Label htmlFor={`${id}-4`}>Completed</Label>
                <p
                  id={`${id}-3-description`}
                  className='text-xs text-muted-foreground'>
                  $32 per member/month
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className='grid gap-2'>
            <Button
              type='button'
              className='w-full'
              onClick={() => handleUpdateTaskStatus()}>
              {loading ? (
                <>
                  <Loader className='animate-spin' /> Chanding status{' '}
                </>
              ) : (
                'Change Status'
              )}
            </Button>
            <DialogClose asChild>
              <Button type='button' variant='ghost' className='w-full'>
                Cancel
              </Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
