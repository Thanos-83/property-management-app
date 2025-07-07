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

import { use } from 'react';
import { useQueryState } from 'nuqs';

const FormSchema = z.object({
  platform: z.string({
    required_error: 'Please select booking platform to display.',
  }),
});

export function PlatformFilter({
  propertyPlatforms,
}: {
  propertyPlatforms: Promise<Array<string>>;
}) {
  const platforms = use(propertyPlatforms);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const [platform, setPlatform] = useQueryState(
    'platform',
    // parseAsString.withDefault('')
    {
      defaultValue: '',
      history: 'push',
      shallow: false,
    }
  );

  // console.log('Platforms: ', platforms);
  // console.log('PLATFORM: ', platform);

  async function handleSelectChange(value: string) {
    setPlatform(value);
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name='platform'
        render={({ field }) => (
          <FormItem className='flex items-center gap-4'>
            <FormLabel>Platform</FormLabel>
            <Select
              defaultValue={platforms[0]}
              onValueChange={(selectedValue) => {
                handleSelectChange(selectedValue);
              }}
              {...field}>
              <FormControl>
                <SelectTrigger className='w-[16rem]'>
                  <SelectValue placeholder='Select a verified email to display' />
                </SelectTrigger>
              </FormControl>
              <SelectContent className='w-[16rem]'>
                {platforms?.map((platform, index) => {
                  return (
                    <SelectItem
                      className='w-[16rem]'
                      key={index}
                      value={`${platform}`}>
                      {platform}
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
