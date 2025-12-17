import { getConnectedAccounts, getEmailsFromDB } from "@/lib/actions/emailActions";
import { MailListContainer } from "@/components/email/MailListContainer";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    accountId?: string;
    folder?: string;
    search?: string;
  }>;
}

export default async function EmailListPage({ searchParams }: PageProps) {
  // Await searchParams before accessing properties
  const params = await searchParams;
  const accountId = params.accountId;
  const folder = params.folder || 'inbox';
  const search = params.search;

  // If no account is specified, try to find one and redirect
  if (!accountId) {
    const { success, data: accounts } = await getConnectedAccounts();
    if (success && accounts && accounts.length > 0) {
      redirect(`/dashboard/email?accountId=${accounts[0].id}&folder=inbox`);
    } else {
        // No accounts connected state
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50 dark:bg-zinc-900 border rounded-lg m-4">
                <h2 className="text-2xl font-bold mb-2">No Email Accounts</h2>
                <p className="text-muted-foreground mb-4">Connect your Google or Microsoft account to get started.</p>
                <Link href="/dashboard/settings">
                    <Button>Connect Account</Button>
                </Link>
            </div>
        )
    }
  }

  // Fetch emails
  const { success, data: emails, error } = await getEmailsFromDB(accountId, folder, search);

  if (!success) {
      console.error('Failed to load emails:', error);
      return (
          <div className="p-8 text-center text-red-500">
              Failed to load emails. Please try refreshing.
          </div>
      )
  }

  return (
    <MailListContainer 
        initialMails={emails || []} 
        accountId={accountId} 
        folder={folder} 
    />
  );
}
