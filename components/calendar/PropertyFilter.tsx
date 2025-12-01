'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

type PropertyTypes = {
  propertiesData: {
    id: string;
    title: string;
    ical_urls: {
      ical_url: string;
      platform: string;
    }[];
  }[];
  handlePropertyFilter: (value: string) => void;
  searchParamProperty: string;
};

const FormSchema = z.object({
  property: z.string({
    required_error: 'Please select booking platform to display.',
  }),
});
export function PropertyFilter({
  propertiesData,
  handlePropertyFilter,
}: PropertyTypes) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name='property'
        render={({ field }) => (
          <FormItem className='flex items-center gap-4'>
            <FormLabel>Property</FormLabel>
            <Select
              defaultValue={propertiesData[0].id}
              onValueChange={(selectedValue) => {
                handlePropertyFilter(selectedValue);
              }}
              {...field}>
              <FormControl>
                <SelectTrigger className='w-[16rem]'>
                  <SelectValue placeholder='Select property' />
                </SelectTrigger>
              </FormControl>
              <SelectContent className='w-[16rem]'>
                {propertiesData?.map((property) => {
                  return (
                    <SelectItem
                      className='w-[16rem]'
                      key={property.id}
                      value={`${property.id}`}>
                      {property.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
