'use client';

import { Button } from '@/components/ui/button';
import { login, signInWithGoogle, signup } from '@/app/login/actions';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

function LoginForm() {
  return (
    <div className='max-w-xl mx-auto border rounded p-4 mt-12'>
      <form className=' flex flex-col gap-2 mx-auto'>
        <label htmlFor='email'>Email:</label>
        <Input id='email' name='email' type='email' required />
        <label htmlFor='password'>Password:</label>
        <Input id='password' name='password' type='password' required />
        <div className='mt-4 flex items-center justify-between gap-3'>
          <Button className='flex-1' variant='outline' formAction={login}>
            Log in
          </Button>
          <Button className='flex-1' variant='default' formAction={signup}>
            Sign up
          </Button>
        </div>
      </form>
      <div className='my-3'>
        <p className='text-center'>OR</p>
      </div>
      <div className='my-4'>
        <Button
          onClick={() => signInWithGoogle()}
          variant='secondary'
          className='w-full'>
          Login with Google
        </Button>
      </div>
      <div>
        <Link href='/'>Go to homepage</Link>
      </div>
    </div>
  );
}

export default LoginForm;
