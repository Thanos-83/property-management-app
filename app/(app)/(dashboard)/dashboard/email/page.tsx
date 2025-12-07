import { getConnectedAccounts, getEmailsFromDB } from '@/lib/actions/emailActions';
import { Mail } from 'lucide-react';
import { MailLayout } from '@/components/email/MailLayout';
import { WebhookManager } from '@/components/email/WebhookManager';
import { EmailEmptyState } from '@/components/email/EmailEmptyState';

export default async function EmailsPage() {
  // 1. Fetch Accounts Server-Side
  const accountsResult = await getConnectedAccounts();
  const accounts = accountsResult.success && accountsResult.data ? accountsResult.data : [];

  // If no accounts, show empty state
  if (accounts.length === 0) {
    return <EmailEmptyState />;
  }

  // 2. Fetch Initial Emails (for the first account)
  let initialMails: any[] = [];
  const mailsResult = await getEmailsFromDB(accounts[0].id, 'inbox');
  if (mailsResult.success && mailsResult.data) {
    initialMails = mailsResult.data;
  }

  const defaultLayout = undefined;
  const defaultCollapsed = undefined;

  // Transform accounts for UI
  const layoutAccounts = accounts.map((acc) => ({
    id: acc.id,
    email: acc.email_address,
    icon: <Mail className="h-4 w-4" />,
  }));

  // Webhook URL for development (use ngrok URL or production URL)
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || 
    'https://parametric-angie-semischolastically.ngrok-free.dev/api/webhooks/aurinko';

  return (
    <div className="flex flex-col gap-4 max-h-[calc(100vh-2rem)]">
      {/* Development: Webhook Registration */}
      {/* {process.env.NODE_ENV === 'development' && (
        <WebhookManager 
          accountId={accounts[0].id} 
          webhookUrl={webhookUrl}
        />
      )} */}
      
      {/* Email Hub */}
      <div className="hidden flex-col md:flex h-full">
        <MailLayout
          accounts={layoutAccounts}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
          initialMails={initialMails}
        />
      </div>
    </div>
  );
}
