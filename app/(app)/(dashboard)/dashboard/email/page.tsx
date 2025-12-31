import { getConnectedAccounts, getEmailsFromDB } from "@/lib/actions/emailActions";
import { MailListContainer } from "@/components/email/MailListContainer";
import { redirect } from "next/navigation";
import { EmailEmptyState } from "@/components/email/EmailEmptyState";
import { Suspense } from "react";
import { MailListSkeleton } from "@/components/email/MailListSkeleton";

interface PageProps {
  searchParams: Promise<{
    accountId?: string ;
    folder?: string;
    search?: string;
  }>;
}

export default async function EmailListPage({ searchParams }: PageProps) {
  // Await searchParams before accessing properties
  const params = await searchParams;
  
  let accountId = params.accountId;
  let folder = params.folder || 'inbox';
  const search = params.search;

  // If no account is specified, try to find one
  if (!accountId) {
    const { success, data: accounts } = await getConnectedAccounts();
    if (success && accounts && accounts.length > 0 && accountId) {
        accountId = accounts[0].id; // Use first account
    }
    else if (success && accounts && accounts.length >0 ) {
        // Account found but no accountId and folder in searchParams
        return redirect( `/dashboard/email?folder=${folder}&accountId=${accounts[0].id}`);
    }
    else {
        // No accounts connected state
        return <EmailEmptyState />
    }
  }

  // Fetch emails
  const fetchEmails = getEmailsFromDB(accountId!, folder, search);


  return (
    <Suspense fallback={<MailListSkeleton />} key={`${accountId}-${folder}-${search}`}> 
      <MailListContainer 
          initialMails={fetchEmails}
          accountId={accountId} 
          folder={folder} 
      />
    </Suspense>
  );
}
