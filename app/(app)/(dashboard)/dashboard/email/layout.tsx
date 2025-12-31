import * as React from 'react';
import { getConnectedAccounts, getFolderCounts } from '@/lib/actions/emailActions';
import { EmailSidebar } from '@/components/email/EmailSidebar';
import { EmailHeader } from '@/components/email/EmailHeader';
import { EmailEmptyState } from '@/components/email/EmailEmptyState';
import { WebhookManager } from '@/components/email/WebhookManager';


export default async function MailLayout({ children }: { children: React.ReactNode }) {
  // 1. Fetch Accounts
  const { data: accounts } = await getConnectedAccounts();
  const defaultAccount = accounts?.[0];
  // console.log('accounts in layout', accounts);
  // 2. Fetch Counts
  let initialCounts: Record<string, number> = {};
  if (defaultAccount?.id) {
      initialCounts = await getFolderCounts(null, defaultAccount.id);
  }
  return (
   accounts?.length !==0 ? 
    <div className="flex w-full h-screen overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile, valid for desktop */}
      <aside className="h-full flex-col max-w-[400px] border-r-2 border-border">
         <EmailSidebar 
            accounts={accounts || []} 
         />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <div className="p-4">
        <WebhookManager 
          accountId={defaultAccount?.id} 
          webhookUrl={process.env.NEXT_PUBLIC_WEBHOOK_URL || 'https://parametric-angie-semischolastically.ngrok-free.dev/api/webhooks/aurinko'}
        />
        </div>
        <EmailHeader 
            accountId={defaultAccount?.id} 
            emailAddress={defaultAccount?.email_address} 
        />
        <main className="flex-1 overflow-hidden relative">
            {children}
        </main>
      </div>
    </div>
   : <EmailEmptyState/>
  );
}
