'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EyeIcon, EyeOffIcon, Loader } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  createMemberSchema,
  CreateMemberSchemaType,
} from '@/lib/schemas/createMemberSchema';
import { toast } from 'sonner';
import { createMemberFinalAction } from '@/lib/actions/taskMemberActions';
import { useRouter } from 'next/navigation';

export default function RegisterTeamMemberForm() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const form = useForm<CreateMemberSchemaType>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      mobilePhone: '',
      email: emailParam,
      password: '',
    },
  });

  const onSubmit = async (formData: CreateMemberSchemaType) => {
    // Append the token securely to the payload
    const response = await createMemberFinalAction({ ...formData, token });

    if (response?.status === 'fail') {
      toast.error(response.message);
    }
  };

  return (
    <div className='mx-auto w-full max-w-[32rem] py-8'>
      <div className='bg-white max-w-lg m-auto h-fit w-full overflow-hidden rounded-xl border border-border shadow-md'>
        <div className='bg-popover rounded-t-xl border-b border-border p-6 pb-8'>
          <div className='text-center mb-6'>
            <h1 className='text-2xl font-bold tracking-tight'>Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Join the team workspace</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-bold uppercase text-muted-foreground tracking-wider'>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Jane' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-bold uppercase text-muted-foreground tracking-wider'>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Doe' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold uppercase text-muted-foreground tracking-wider'>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        {...field}
                        readOnly
                        className='bg-muted/50 text-muted-foreground cursor-not-allowed focus-visible:ring-0'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='mobilePhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold uppercase text-muted-foreground tracking-wider'>Mobile Phone</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold uppercase text-muted-foreground tracking-wider'>Password</FormLabel>
                    <div className='relative'>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='Create a secure password'
                          type={isVisible ? 'text' : 'password'}
                          className="pr-10"
                        />
                      </FormControl>

                      <button
                        className='absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors'
                        type='button'
                        onClick={toggleVisibility}
                      >
                        {isVisible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={form.formState.isSubmitting}
                type='submit'
                className='w-full font-bold shadow-sm mt-4'
              >
                {form.formState.isSubmitting ? <Loader className='mr-2 h-4 w-4 animate-spin' /> : null}
                {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
        </div>

        <div className='p-4 bg-muted/30 border-t border-border flex flex-col items-center justify-center gap-2'>
          <p className='text-center text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link href='/auth/login' className='text-primary font-semibold hover:underline'>
              Sign In
            </Link>
          </p>
          <div className='text-muted-foreground text-center text-[10px] max-w-[250px] leading-tight mt-1'>
            By clicking continue, you agree to our <Link className='underline hover:text-foreground' href='#'>Terms of Service</Link> and <Link className='underline hover:text-foreground' href='#'>Privacy Policy</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}