'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, PropertySchemaType } from '@/lib/schemas/property';

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
import { Info, Loader2Icon } from 'lucide-react';
import { addPropertyAction } from '@/lib/actions/propertiesActions';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type AddPropertyDialogProps = {
  onSuccess?: () => void;
};

const platformOptions = [
  { value: 'Airbnb', label: 'Airbnb', icon: '/icons/airbnb.svg' },
  { value: 'Booking', label: 'Booking.com', icon: '/icons/booking.svg' },
  { value: 'Vrbo', label: 'Vrbo', icon: '/icons/vrbo.svg' },
  { value: 'Expedia', label: 'Expedia', icon: '/icons/expedia.svg' },
];

export function AddPropertyDialog({ onSuccess }: AddPropertyDialogProps) {
  const [open, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PropertySchemaType>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      rooms: 1,
      platform: undefined,
      ical_url: '',
    },
  });

  async function onSubmit(data: PropertySchemaType) {
    console.log('Data: ', data);

    setIsLoading(true);
    const response = await addPropertyAction(data);

    console.log('Response from adding property Action: ', response);

    if (response.status === 201) {
      setIsLoading(false);
      form.reset();

      onSuccess?.();
      setOpenDialog(false);

      toast.success('Property added successfuly', {});
    } else {
      toast.error('Error adding property', {});
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          className=''
          variant='default'
          onClick={() => setOpenDialog(true)}>
          Προσθήκη Ακινήτου
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Προσθήκη Ακινήτου</DialogTitle>
          <DialogDescription>
            Συμπλήρωσε τα στοιχεία του ακινήτου για να το προσθέσεις στην
            εφαρμογή.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Τίτλος</FormLabel>
                  <FormControl>
                    <Input placeholder='Π.χ. Loften στο Κέντρο' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Περιγραφή</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Περιγραφή (προαιρετικό)'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Τοποθεσία</FormLabel>
                  <FormControl>
                    <Input placeholder='Π.χ. Αθήνα' {...field} />
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
                  <FormLabel>Αριθμός Δωματίων</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={1}
                      {...field}
                      value={field.value.toString()}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='platform'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select a platform to add iCal URL' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platformOptions.map((option) => (
                          <SelectItem key={option.label} value={option.value}>
                            <Image
                              width={64}
                              height={24}
                              alt={option.label}
                              src={option.icon}
                              priority
                              className='h-auto'
                            />
                            {option.value}
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
              name='ical_url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    iCal URL
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={18} className='text-neutral' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          You can add additional calendar links after creation
                          in property management.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://example.com/calendar.ics'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end space-x-2'>
              <DialogClose asChild>
                <Button variant='outline' type='button'>
                  Άκυρο
                </Button>
              </DialogClose>
              <Button disabled={isLoading} type='submit'>
                <Loader2Icon
                  className={`animate-spin ${isLoading ? 'block' : 'hidden'}`}
                />
                Αποθήκευση
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
