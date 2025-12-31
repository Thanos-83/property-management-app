'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AccountSwitcher } from './AccountSwitcher';
import { EmailsNav } from './EmailsNav';

interface EmailSidebarProps {
  accounts: {
    id: string;
    email_address: string;
    provider: string;
  }[];
}

export  function EmailSidebar({ accounts}: EmailSidebarProps) {
// 

  return (
    <div className={cn("w-full bg-background flex flex-col h-full")}>
      <div className="p-4 border-b border-b-border h-[60px] flex items-center">
        <AccountSwitcher 
            accounts={accounts.map(acc => ({
                id: acc.id,
                email: acc.email_address,
                icon: <span className="font-bold">{acc.provider === 'Google' ? 'G' : 'O'}</span>
            }))}
        />
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
            <EmailsNav/>
      </div>
    </div>
  );
}
