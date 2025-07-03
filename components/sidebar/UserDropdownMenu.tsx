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
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';

export default function UserDropdownMenu() {
  const [userAvatar, setUserAvatar] = useState('');
  const supabase = createClient();

  const handleSignOut = async () => {
    const result = await supabase.auth.signOut();

    console.log('Sign out result: ', result);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!error) {
        setUserAvatar(data.user.user_metadata.avatar_url);
      }
    };
    fetchUserInfo();
  }, [supabase.auth]);
  // console.log(object);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='ml-4 rounded-full w-8 h-8 p-0  text-white focus:outline-primary'>
          {!userAvatar ? (
            <User />
          ) : (
            <Image
              className='object-fill w-full border border-accent overflow-hidden rounded-full '
              src={userAvatar}
              width={36}
              height={36}
              alt='user avatar'
            />
          )}
        </Button>
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
