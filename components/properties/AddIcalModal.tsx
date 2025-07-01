'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  propertyIcalSchema,
  PropertyIcalSchemaType,
} from '@/lib/schemas/property';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';
import { CirclePlus, Loader2Icon } from 'lucide-react';

import { addPropertyIcalAction } from '@/lib/actions/propertiesActions';
import { DialogTrigger } from '@radix-ui/react-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import Image from 'next/image';

const platformOptions = [
  { value: 'Airbnb', label: 'Airbnb', icon: '/icons/airbnb.svg' },
  { value: 'Booking', label: 'Booking.com', icon: '/icons/booking.svg' },
  { value: 'Vrbo', label: 'Vrbo', icon: '/icons/vrbo.svg' },
  { value: 'Expedia', label: 'Expedia', icon: '/icons/expedia.svg' },
];

type AddIcalModalProps = {
  propertyId: string;
  onSuccess?: () => void;
};

export default function AddIcalModal({
  propertyId,
  onSuccess,
}: AddIcalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpenDialog] = useState(false);

  const form = useForm<PropertyIcalSchemaType>({
    resolver: zodResolver(propertyIcalSchema),
    defaultValues: {
      platform: '',
      icalUrl: '',
      propertyId,
    },
  });

  async function onSubmit(data: PropertyIcalSchemaType) {
    setIsLoading(true);
    try {
      const response = await addPropertyIcalAction(
        propertyId,
        data.platform,
        data.icalUrl
      );

      if (response.status === 201) {
        setOpenDialog(false);
        toast.success('iCal URL added successfully');
        form.reset();
        onSuccess?.();
      } else {
        toast.error('Failed to add iCal URL');
      }
    } catch {
      toast.error('An error occurred while adding iCal URL');
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='p-0 flex  justify-end'>
          <CirclePlus className='text-primary-main' size={48} />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add iCal URL</DialogTitle>
          <DialogDescription>
            Add a new iCal URL and select the platform provider.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='platform'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
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
              name='icalUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>iCal URL</FormLabel>
                  <FormControl>
                    <Input
                      type='url'
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
                <Button
                  // onClick={() => dispatch(setOpenUrlModal(false))}
                  className='w-[8rem]'
                  variant='outline'
                  type='button'>
                  Close
                </Button>
              </DialogClose>
              <Button className='w-[8rem]' disabled={isLoading} type='submit'>
                <Loader2Icon
                  className={`animate-spin ${isLoading ? 'block' : 'hidden'}`}
                />
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
