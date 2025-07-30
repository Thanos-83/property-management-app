'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, EyeIcon, EyeOffIcon, Loader } from 'lucide-react';
import Link from 'next/link';
import { signInWithProvider, signUp } from '@/lib/actions/authActions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSignUpSchema, AuthSignupSchemaType } from '@/lib/schemas/auth';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

export default function RegisterForm() {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const form = useForm<AuthSignupSchemaType>({
    resolver: zodResolver(authSignUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: AuthSignupSchemaType) => {
    const response = await signUp(formData);

    console.log('Response: ', response?.error);
    if (!response?.success && typeof response?.error === 'object') {
      response?.error.map((err) => toast.error(err?.message));
    } else if (!response?.success) {
      toast.error(response?.error as string);
    }
    // form.reset();
  };

  return (
    <div className='mx-auto w-[90%] max-w-[32rem]'>
      <Link href='/' className='flex  items-center mb-4'>
        <ArrowLeft className='w-8 h-4' />
        <span>Home</span>
      </Link>
      <div className='bg-muted max-w-lg m-auto h-fit w-full overflow-hidden rounded-[calc(var(--radius)+.125rem)] border border-border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]'>
        <div className='bg-popover -m-[2px] rounded-b-[calc(var(--radius)+.5rem)] border-b border-b-border p-6'>
          <div className='text-center'>
            <Link href='/' aria-label='go home' className='mx-auto block w-fit'>
              {/* <LogoIcon /> */}
              Logo
            </Link>
            <h1 className='text-title mb-1 mt-4 text-xl font-semibold'>
              Welcome
            </h1>
            <p className='text-sm'>Create an account to get started now</p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='mt-6 space-y-6'>
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='block text-sm'>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Full Name' {...field} />
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
                      <Input type='text' placeholder='Email' {...field} />
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
          <div className='my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
            <hr className='border-dotted' />
            <span className='text-muted-foreground text-sm font-sans'>
              Or continue With
            </span>
            <hr className='border-dotted' />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <Button
              onClick={() => signInWithProvider('google')}
              type='button'
              variant='outline'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='0.98em'
                height='1em'
                viewBox='0 0 256 262'>
                <path
                  fill='#4285f4'
                  d='M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027'></path>
                <path
                  fill='#34a853'
                  d='M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1'></path>
                <path
                  fill='#fbbc05'
                  d='M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z'></path>
                <path
                  fill='#eb4335'
                  d='M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251'></path>
              </svg>
              <span>Google</span>
            </Button>
            <Button disabled type='button' variant='outline'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='1em'
                height='1em'
                viewBox='0 0 256 256'>
                <path fill='#f1511b' d='M121.666 121.666H0V0h121.666z'></path>
                <path fill='#80cc28' d='M256 121.666H134.335V0H256z'></path>
                <path
                  fill='#00adef'
                  d='M121.663 256.002H0V134.336h121.663z'></path>
                <path
                  fill='#fbbc09'
                  d='M256 256.002H134.335V134.336H256z'></path>
              </svg>
              <span>Microsoft</span>
            </Button>
          </div>
        </div>

        <div className='p-3'>
          <p className='text-accent-foreground text-center text-sm'>
            Already have an account ?
            <Button asChild variant='link' className='px-2'>
              <Link href='/login'>Sign In</Link>
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
