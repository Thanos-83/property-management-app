'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EyeIcon, EyeOffIcon, Loader } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import {
  memberSignInSchema,
  MemberSigninSchemaType,
} from '@/lib/schemas/signInMemberSchema';
import { signInTeamMember } from '@/lib/actions/taskMemberActions';

export default function LoginTeamMemberForm() {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const form = useForm<MemberSigninSchemaType>({
    resolver: zodResolver(memberSignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: MemberSigninSchemaType) => {
    const response = await signInTeamMember(formData);
    console.log('Response : ', response);
    if (response && !response?.success) {
      toast.error(response?.message);
      return;
    } else {
      form.reset();
    }
  };

  return (
    <div className='mx-auto w-[90%] max-w-[32rem]'>
      <div className='bg-muted max-w-lg m-auto h-fit w-full overflow-hidden rounded-[calc(var(--radius)+.125rem)] border border-border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]'>
        <div className='bg-popover -m-[2px] rounded-b-[calc(var(--radius)+.125rem)] border-b border-b-border p-6'>
          <div className='text-center'>
            <h1 className='text-title mb-1 mt-4 text-xl font-semibold'>
              Login to your Rendy.com collaborators Account
            </h1>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='mt-6 space-y-6'>
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
                    <div className='flex items-center justify-between'>
                      <FormLabel>Password</FormLabel>
                      <Link
                        href='/forgot-password'
                        className='ml-auto text-xs underline-offset-4 hover:underline'>
                        Forgot your password?
                      </Link>
                    </div>
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
                Sign In
              </Button>
            </form>
          </Form>
        </div>

        <div className='p-3'>
          <p className='text-accent-foreground text-center text-sm'>
            Don&apos;t have an account ?
            <Button asChild variant='link' className='px-2'>
              <Link href='/register'>Sign Up</Link>
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
