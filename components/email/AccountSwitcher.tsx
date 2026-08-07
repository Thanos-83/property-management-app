'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';
import { useSidebar } from '@/components/ui/sidebar';

interface AccountSwitcherProps {
  isCollapsed?: boolean;
  accounts: {
    id: string;
    email: string;
    icon: React.ReactNode;
  }[];
}

export function AccountSwitcher({ accounts }: AccountSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  const urlAccountId = searchParams.get('accountId');
  const selectedAccount = urlAccountId || accounts[0]?.id;

  const selected = accounts.find((account) => account.id === selectedAccount);

  const handleAccountChange = (accountId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (accountId) params.set('accountId', accountId);
    if (searchParams.get('folder') !== 'inbox') params.set('folder', 'inbox');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAddAccount = async () => {
    toast.loading('Starting connection...');
    try {
      // Pass the current account email as a hint if we are reconnecting
      const currentEmail = selected?.email;
      const params = currentEmail
        ? `?loginHint=${encodeURIComponent(currentEmail)}`
        : '';

      const response = await fetch(`/api/aurinko/url${params}`);
      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to initialize connection');
        console.error('Failed to get auth URL:', data.error);
      }
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      toast.error(`Connection error: ${msg}`);
      console.error('Error connecting account:', error);
    }
  };

  return (
    <Select
      value={selectedAccount}
      onValueChange={(val) => {
        if (val === 'add_new_account_action') {
          handleAddAccount();
        } else {
          handleAccountChange(val);
        }
      }}>
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
          isCollapsed &&
            'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden',
        )}
        aria-label='Select account'>
        <SelectValue placeholder='Select an account'>
          {selected?.icon}
          <span className={cn('ml-2', isCollapsed && 'hidden')}>
            {selected?.email}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className='flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground'>
              {account.icon}
              {account.email}
            </div>
          </SelectItem>
        ))}
        <SelectItem
          value='add_new_account_action'
          className='text-muted-foreground font-medium border-t mt-1 pt-2 cursor-pointer focus:text-foreground'>
          <div className='flex items-center gap-2'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'>
              <circle cx='12' cy='12' r='10' />
              <path d='M8 12h8' />
              <path d='M12 8v8' />
            </svg>
            Add / Reconnect Account
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
