'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@radix-ui/react-dropdown-menu';
import { User } from 'lucide-react';

import { createClient } from '@/lib/utils/supabase/client';

export default function UserDropdownMenu() {
  const handleSignOut = async () => {
    const supabase = await createClient();
    const result = await supabase.auth.signOut();

    console.log('Sign out result: ', result);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='rounded-full bg-primary-accent w-10 h-10 flex items-center justify-center text-white focus:outline-primary'>
          <User />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='bg-white border rounded shadow-md p-2 min-w-[140px]'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className='my-3' />
        <DropdownMenuItem className='px-2 py-1 hover:bg-secondary rounded'>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className='px-2 py-1 hover:bg-secondary rounded'>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-1' />
        <DropdownMenuItem
          onClick={handleSignOut}
          className='px-2 py-1 hover:bg-secondary rounded'>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
