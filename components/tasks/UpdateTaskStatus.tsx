'use client';

import { useEffect, useState } from 'react';
import { Edit3Icon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateTaskStatusAction } from '@/lib/actions/taskActions';
import { capitalizeFirstLetter } from '@/lib/heplers';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { TaskStatusOption } from '@/types/taskTypes';

export default function UpdateTaskStatus({
  taskId,
  taskStatus,
  taskStatuses,
}: {
  taskId: string;
  taskStatus: string;
  taskStatuses: TaskStatusOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(taskStatus);
  const router = useRouter();
  useEffect(() => {
    setNewStatus(taskStatus);
  }, [taskStatus]);

  const handleUpdateTaskStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newStatus === taskStatus) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await updateTaskStatusAction(taskId, newStatus);
      if (!response?.error) {
        toast.success('Status updated successfully');
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Error updating status');
      }
    } catch (error) {
      console.error('Error updating status', error);
      toast.error('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='w-7 h-7 ml-1 text-muted-foreground hover:text-foreground'>
          <Edit3Icon className='w-3.5 h-3.5' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[350px]'>
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
        </DialogHeader>

        <div className='py-4'>
          <RadioGroup
            value={newStatus}
            onValueChange={setNewStatus}
            className='gap-4'>
            {taskStatuses?.map((status) => (
              <div key={status.id} className='flex items-center space-x-3'>
                <RadioGroupItem
                  value={status.status.trim()}
                  id={`status-${status.id}`}
                />
                <Label
                  htmlFor={`status-${status.id}`}
                  className='flex items-center gap-2 font-medium cursor-pointer'>
                  {/* Color Dot Indicator */}
                  <span
                    className='w-2.5 h-2.5 rounded-full'
                    style={{ backgroundColor: status.status_color || '#ccc' }}
                  />
                  {capitalizeFirstLetter(status.status.replace('_', ' '))}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleUpdateTaskStatus}
            disabled={loading || newStatus === taskStatus}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
