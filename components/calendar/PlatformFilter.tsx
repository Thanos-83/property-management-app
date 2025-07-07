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
import { useEffect, useState } from 'react';

const FormSchema = z.object({
  platform: z.string({
    required_error: 'Please select booking platform to display.',
  }),
});

type PropertyPlatformsTypes = {
  propertyPlatforms: { ical_url: string; platform: string }[];
  handlePlatformFilter: (value: string) => void;
  searchParamPlatform: string;
};

export function PlatformFilter({
  propertyPlatforms,
  handlePlatformFilter,
  searchParamPlatform,
}: PropertyPlatformsTypes) {
  const searchParams = useSearchParams();

  const platform = searchParams.get('platform');

  const [x, setX] = useState(searchParamPlatform);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  useEffect(() => {
    if (!platform) {
      setX(searchParamPlatform);
    }
  }, [searchParamPlatform, platform]);

  console.log('Platforms in Platform Filter 1: ', platform);
  console.log('Platforms in Platform Filter 2: ', searchParamPlatform);

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name='platform'
        render={({ field }) => (
          <FormItem className='flex items-center gap-4'>
            <FormLabel>Platform</FormLabel>
            <Select
              defaultValue={x}
              onValueChange={(selectedValue) => {
                handlePlatformFilter(selectedValue);
              }}
              {...field}>
              <FormControl>
                <SelectTrigger className='w-[16rem]'>
                  <SelectValue placeholder='Select a verified email to display' />
                </SelectTrigger>
              </FormControl>
              <SelectContent className='w-[16rem]'>
                <SelectItem className='w-[16rem]' value={`All`}>
                  All
                </SelectItem>
                {propertyPlatforms &&
                  propertyPlatforms?.map(
                    (platform: { ical_url: string; platform: string }) => {
                      return (
                        <SelectItem
                          className='w-[16rem]'
                          key={platform.ical_url}
                          value={`${platform.platform}`}>
                          {platform.platform}
                        </SelectItem>
                      );
                    }
                  )}
              </SelectContent>
            </Select>

            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
