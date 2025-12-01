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
// import { toast } from 'sonner';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  createMemberSchema,
  CreateMemberSchemaType,
} from '@/lib/schemas/createMemberSchema';
import { toast } from 'sonner';
import { createMemberFinalAction } from '@/lib/actions/taskMemberActions';

export default function RegisterTeamMemberForm() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const searchParams = useSearchParams();

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const form = useForm<CreateMemberSchemaType>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      mobilePhone: '',
      email: searchParams.get('email') ?? '',
      password: '',
    },
  });

  const onSubmit = async (formData: CreateMemberSchemaType) => {
    console.log('Form Data: ', formData);
    const response = await createMemberFinalAction(formData);

    if (response.status === 'fail') {
      toast.error(response.message);
    }
  };

  return (
    <div className='mx-auto w-[90%] max-w-[32rem]'>
      <div className='bg-muted max-w-lg m-auto h-fit w-full overflow-hidden rounded-[calc(var(--radius)+.125rem)] border border-border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]'>
        <div className='bg-popover -m-[2px] rounded-b-[calc(var(--radius)+.5rem)] border-b border-b-border p-6'>
          <div className='text-center'>
            <h1 className='text-lg'>Create your account</h1>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='mt-6 space-y-6'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='block text-sm'>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder='First Name' {...field} />
                    </FormControl>
                    <FormMessage className='text-red-600' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='block text-sm'>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Last Name' {...field} />
                    </FormControl>
                    <FormMessage className='text-red-600' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Email'
                        {...field}
                        readOnly
                        className='text-gray-400'
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
                    <FormLabel>Mobile Phone Number</FormLabel>
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
                    <FormLabel>Password</FormLabel>
                    <div className='relative'>
                      <FormControl>
                        <Input
                          {...field}
                          // className='pe-9 input sz-md variant-mixed'
                          placeholder='Password'
                          type={isVisible ? 'text' : 'password'}
                        />
                      </FormControl>

                      <button
                        className='text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
                        type='button'
                        onClick={toggleVisibility}
                        aria-label={
                          isVisible ? 'Hide password' : 'Show password'
                        }
                        aria-pressed={isVisible}
                        aria-controls='password'>
                        {isVisible ? (
                          <EyeOffIcon size={16} aria-hidden='true' />
                        ) : (
                          <EyeIcon size={16} aria-hidden='true' />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                disabled={form.formState.isSubmitting}
                type='submit'
                className='w-full'>
                <Loader
                  className={`${
                    form.formState.isSubmitting
                      ? 'inline-block animate-spin'
                      : 'hidden'
                  }`}
                />
                Sign Up
              </Button>
            </form>
          </Form>
        </div>

        <div className='p-3'>
          <p className='text-accent-foreground text-center text-sm'>
            Already have an account ?
            <Button
              disabled={!searchParams.has('token')}
              asChild
              variant='link'
              className='px-2'>
              <Link href='/auth/login'>Sign In</Link>
            </Button>
          </p>
        </div>
      </div>
      <div className='p-3 text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4'>
        <p> By clicking continue, you agree to our </p>{' '}
        <Link className='underline' href='#'>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link className='underline' href='#'>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
