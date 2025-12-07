'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccountSwitcherProps {
  isCollapsed: boolean;
  accounts: {
    id: string;
    email: string;
    icon: React.ReactNode;
  }[];
  selectedAccount: string;
  onAccountChange: (accountId: string) => void;
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
  selectedAccount,
  onAccountChange,
}: AccountSwitcherProps) {
  const selected = accounts.find((account) => account.id === selectedAccount);

  return (
    <Select defaultValue={selectedAccount} onValueChange={onAccountChange}>
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
          isCollapsed &&
            'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden'
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          {selected?.icon}
          <span className={cn('ml-2', isCollapsed && 'hidden')}>
            {selected?.email}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {account.icon}
              {account.email}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
