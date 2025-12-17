import { getConnectedAccounts, getFolderCounts } from "@/lib/actions/emailActions";
import { EmailShell } from "@/components/email/EmailShell";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { success, data: accounts } = await getConnectedAccounts();

  if (!success || !accounts || accounts.length === 0) {
    // If no accounts, maybe we should still render the shell but empty?
    // Or just let Shell handle empty accounts.
  }

  // Pre-fetch counts for the first account (default view)
  // If user switches account via URL, the client helper will re-fetch
  let initialCounts = undefined;
  if (accounts && accounts.length > 0) {
      initialCounts = await getFolderCounts(accounts[0].id);
  }

  const layout = (await cookies()).get("react-resizable-panels:layout");
  const collapsed = (await cookies()).get("react-resizable-panels:collapsed");

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  return (
    <EmailShell
      accounts={(accounts || []).map(acc => ({
        id: acc.id,
        email: acc.email_address,
        icon: <span className="font-bold">{acc.provider === 'Google' ? 'G' : 'O'}</span>
      }))}
      initialFolderCounts={initialCounts}
      defaultLayout={defaultLayout}
      defaultCollapsed={defaultCollapsed}
      navCollapsedSize={4}
    >
      {children}
    </EmailShell>
  );
}
