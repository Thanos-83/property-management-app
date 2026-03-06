'use client';

import React, { useState } from 'react';
import { Loader2Icon, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";



// ============================================================================
// SEPARATED COMPONENT: Delete Ical Dialog
// ============================================================================
interface DeleteIcalDialogProps {
  icalId: string;
  platform: string;
  onConfirm: (id: string) => void;
  isPendingDeleteIcal: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function DeleteIcalAlertDialog({ icalId, platform, onConfirm, isPendingDeleteIcal, isOpen, setIsOpen }: DeleteIcalDialogProps) {


  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-background z-[200]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Calendar Link?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently stop syncing bookings from this {platform} calendar link. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={() => onConfirm(icalId)}>
            {isPendingDeleteIcal ?<><Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" />
            Delete Link</>}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
