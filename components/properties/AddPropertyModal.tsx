'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPropertySchema, CreatePropertySchemaType } from '@/lib/schemas/property';

import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Loader2Icon, Plus } from 'lucide-react';
import { addPropertyAction } from '@/lib/actions/propertiesActions';

type AddPropertyDialogProps = {
  onSuccess?: () => void;
};

export function AddPropertyDialog({ onSuccess }: AddPropertyDialogProps) {
  const [open, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreatePropertySchemaType>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      rooms: 1,
    },
  });

  async function onSubmit(data: CreatePropertySchemaType) {
    setIsLoading(true);
    
    try {
      const response = await addPropertyAction(data);

      if (response.status === 201 || response.success) {
        form.reset();
        onSuccess?.();
        setOpenDialog(false);
        toast.success('Property added successfully');
      } else {
        toast.error('Error adding property');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpenDialog(isOpen);
      if (!isOpen) form.reset(); // Reset form if user closes without saving
    }}>
      <DialogTrigger asChild>
        <Button variant='default' className="font-bold shadow-sm" onClick={() => setOpenDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Ακινήτου
        </Button>
      </DialogTrigger>
      
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Προσθήκη Ακινήτου</DialogTitle>
          <DialogDescription>
            Συμπλήρωσε τα βασικά στοιχεία του ακινήτου. Μπορείς να προσθέσεις φωτογραφίες και συνδέσμους iCal αργότερα από τη διαχείριση.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 pt-2'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Τίτλος <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder='Π.χ. Loften στο Κέντρο' className="bg-muted/20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Τοποθεσία <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder='Π.χ. Αθήνα' className="bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='rooms'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Αριθμός Δωματίων <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        className="bg-muted/20"
                        {...field}
                        value={field.value.toString()}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Περιγραφή</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Περιγραφή (προαιρετικό)'
                      className="min-h-[100px] resize-none bg-muted/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className='flex justify-end space-x-2 pt-4 border-t border-border mt-6'>
              <DialogClose asChild>
                <Button variant='outline' type='button' disabled={isLoading}>
                  Άκυρο
                </Button>
              </DialogClose>
              <Button disabled={isLoading} type='submit' className="font-bold shadow-sm">
                {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Αποθήκευση
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}