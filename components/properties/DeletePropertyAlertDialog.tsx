'use client';

import React from 'react';
import { Loader2Icon, Trash2, ArchiveX } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeletePropertyDialogProps {
  propertyName: string;
  onConfirm: () => void;
  isPendingDelete: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function DeletePropertyAlertDialog({
  propertyName,
  onConfirm,
  isPendingDelete,
  isOpen,
  setIsOpen,
}: DeletePropertyDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          className='text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold px-3'>
          <Trash2 className='w-4 h-4 mr-2' />
          Remove Property
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className='bg-background z-[200]'>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {propertyName}?</AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <p>
              This will remove the property from your active portfolio, free up
              a slot in your billing plan, and permanently stop all calendar
              syncing.
            </p>
            <p>
              <strong>Accounting Note:</strong> If this property has past
              bookings, it will be securely archived to protect your historical
              financial records. If it is empty, it will be permanently deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPendingDelete}>
            Cancel
          </AlertDialogCancel>
          <Button
            type='button'
            variant='destructive'
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPendingDelete}>
            {isPendingDelete ? (
              <>
                <Loader2Icon className='w-4 h-4 mr-2 animate-spin' />
                Removing...
              </>
            ) : (
              <>
                <ArchiveX className='w-4 h-4 mr-2' />
                Remove Property
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
