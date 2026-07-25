'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Trash2Icon } from 'lucide-react';

interface DeleteTaskAlertProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteTaskAlert({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteTaskAlertProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          className='text-destructive hover:bg-destructive/10 hover:text-destructive px-3 font-semibold'>
          <Trash2 className='w-4 h-4 mr-2' />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className='items-center'>
          <Trash2Icon className='bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-sm p-2 w-12 h-12' />
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className='text-center'>
            This action cannot be undone. This will permanently delete the task
            and remove all associated data from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='items-center !justify-center'>
          <AlertDialogCancel disabled={isDeleting} className='w-1/3'>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className='bg-destructive hover:bg-destructive/80 gap-1 w-1/3 text-white'>
            {isDeleting ? (
              <Loader2 className='w-4 h-4 mr-1 animate-spin' />
            ) : (
              <Trash2 className='w-4 h-4 mr-1' />
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
