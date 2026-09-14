'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import { Loader2, Landmark, KeySquare, Receipt } from 'lucide-react';
import { upsertSoloHostTaxProfileAction } from '@/lib/actions/taxProfileActions';

const taxProfileSchema = z.object({
  entity_name: z.string().min(2, 'Legal name is required'),
  afm: z
    .string()
    .length(9, 'AFM must be exactly 9 digits')
    .regex(/^\d+$/, 'AFM must contain only numbers'),
  doy: z.string().min(2, 'Tax office (ΔΟΥ) is required'),
  aade_username: z.string().min(1, 'myDATA Username is required'),
  aade_subscription_key: z.string().min(1, 'Subscription Key is required'),
  vat_rate: z.coerce.number(),
});

type TaxProfileFormValues = z.infer<typeof taxProfileSchema>;

interface TaxProfileFormProps {
  initialData: Partial<TaxProfileFormValues> | null;
}

export function TaxProfileForm({ initialData }: TaxProfileFormProps) {
  const form = useForm<TaxProfileFormValues>({
    resolver: zodResolver(taxProfileSchema),
    defaultValues: {
      entity_name: initialData?.entity_name || '',
      afm: initialData?.afm || '',
      doy: initialData?.doy || '',
      aade_username: initialData?.aade_username || '',
      aade_subscription_key: initialData?.aade_subscription_key || '',
      vat_rate: initialData?.vat_rate ?? 0,
    },
  });

  const onSubmit = async (data: TaxProfileFormValues) => {
    try {
      const result = await upsertSoloHostTaxProfileAction(data);
      if (result.success) {
        toast.success('Tax profile saved successfully');
      } else {
        toast.error(result.error || 'Failed to save tax profile');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* SECTION 1: Legal Identity */}
        <div className='p-6 bg-white border border-border rounded-xl shadow-sm space-y-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Landmark className='w-5 h-5 text-primary' />
            <h3 className='font-bold text-foreground text-lg'>
              Legal Identity
            </h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField
              control={form.control}
              name='entity_name'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Legal Entity Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. John Doe or MySTR LLC'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='afm'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AFM (Tax ID)</FormLabel>
                  <FormControl>
                    <Input placeholder='123456789' maxLength={9} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='doy'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Office (ΔΟΥ)</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. A ATHINON' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 2: AADE Credentials */}
        <div className='p-6 bg-white border border-border rounded-xl shadow-sm space-y-6'>
          <div className='flex items-center gap-2 mb-4'>
            <KeySquare className='w-5 h-5 text-primary' />
            <h3 className='font-bold text-foreground text-lg'>
              myDATA API Credentials
            </h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField
              control={form.control}
              name='aade_username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Username</FormLabel>
                  <FormControl>
                    <Input placeholder='your-aade-username' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='aade_subscription_key'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Key</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Ocp-Apim-Subscription-Key'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 3: Tax Settings */}
        <div className='p-6 bg-white border border-border rounded-xl shadow-sm space-y-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Receipt className='w-5 h-5 text-primary' />
            <h3 className='font-bold text-foreground text-lg'>Tax Rates</h3>
          </div>

          <FormField
            control={form.control}
            name='vat_rate'
            render={({ field }) => (
              <FormItem className='max-w-xs'>
                <FormLabel>Default VAT Rate (ΦΠΑ)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select VAT rate' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='0'>
                      0% (Individuals / Tax Exempt)
                    </SelectItem>
                    <SelectItem value='13'>
                      13% (Standard Accommodation)
                    </SelectItem>
                    <SelectItem value='24'>24% (Standard Services)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={form.formState.isSubmitting}
            className='font-bold shadow-sm px-8'>
            {form.formState.isSubmitting && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            {form.formState.isSubmitting ? 'Saving...' : 'Save Tax Profile'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
