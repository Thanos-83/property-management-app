'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
// import { toast } from 'sonner';
import { z } from 'zod';

//// Removed unused import Button
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSearchParams } from 'next/navigation';
import { CalendarData } from '@/types/bookingTypes';
import { use } from 'react';

const FormSchema = z.object({
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
});

export function PropertyFilter({
  bookingData,
}: {
  bookingData: Promise<CalendarData>;
}) {
  const data = use(bookingData);
  console.log('Booking Data Filter Property: ', data);
  const serachParams = useSearchParams();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function handleSelectChange(value: string) {
    const params = new URLSearchParams(serachParams);

    params.append('property', value);
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name='email'
        render={({ field }) => (
          <FormItem className='flex items-center gap-4'>
            <FormLabel>Property</FormLabel>
            <Select
              onValueChange={(selectedValue) => {
                field.onChange(selectedValue);
                handleSelectChange(selectedValue);
              }}
              {...field}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder='Select a verified email to display' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='m@example.com'>m@example.com</SelectItem>
                <SelectItem value='m@google.com'>m@google.com</SelectItem>
                <SelectItem value='m@support.com'>m@support.com</SelectItem>
              </SelectContent>
            </Select>

            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
