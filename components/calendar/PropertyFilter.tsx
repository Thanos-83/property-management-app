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

// import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { use, useMemo, useTransition } from 'react';
import { parseAsString, useQueryState } from 'nuqs';

const FormSchema = z.object({
  propertyId: z.string({
    required_error: 'Please select property to display.',
  }),
});

type PropertyData = {
  propertyId: string;
  propertyName: string;
};

export function PropertyFilter({
  propertyData,
}: {
  propertyData: Promise<Array<PropertyData>>;
}) {
  const properties = use(propertyData);

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const [property, setProperty] = useQueryState(
    'property',
    parseAsString.withDefault('').withOptions({
      history: 'push',
      shallow: false,
      startTransition,
    })
  );

  const x = useMemo(() => {
    setProperty(properties[0].propertyId);
  }, []);
  console.log('Unique Properties: ', properties);
  console.log('Property: ', property);
  console.log('Is Pending: ', isPending);
  // console.log('UseMemo return: ', x);
  // console.log('Search Params Platform: ', platform);

  async function handleSelectProperty(value: string) {
    setProperty(value);
    console.log('Value: ', value);
    form.reset();
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name='propertyId'
        render={({ field }) => (
          <FormItem className='flex items-center gap-4'>
            <FormLabel>Property</FormLabel>
            <Select
              defaultValue={properties[0].propertyId}
              onValueChange={(selectedValue) => {
                handleSelectProperty(selectedValue);
              }}
              {...field}>
              <FormControl>
                <SelectTrigger className='w-[16rem]'>
                  <SelectValue placeholder='Select property' />
                </SelectTrigger>
              </FormControl>
              <SelectContent className='w-[16rem]'>
                {properties?.map(
                  (property: { propertyId: string; propertyName: string }) => {
                    return (
                      <SelectItem
                        className='w-[16rem]'
                        key={property.propertyId}
                        value={`${property.propertyId}`}>
                        {property.propertyName}
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
