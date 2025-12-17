import { createClient } from "@/lib/utils/supabase/server";
import { MailDisplay } from "@/components/email/MailDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmailSummary } from "@/lib/actions/emailActions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    accountId?: string;
    folder?: string;
  }>;
}

export default async function EmailDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { accountId, folder = 'inbox' } = await searchParams;

  const supabase = await createClient();
  const { data: record, error } = await supabase
    .from('emails')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">Email not found</p>
        <Link href={`/dashboard/email?accountId=${accountId}&folder=${folder}`}>
          <Button variant="outline">Back to List</Button>
        </Link>
      </div>
    );
  }

  // Transform to EmailSummary
  const mail: EmailSummary = {
    id: record.id,
    threadId: record.thread_id,
    subject: record.subject,
    from: record.from_json,
    receivedAt: record.received_at,
    bodySnippet: record.snippet,
    sysClassifications: [],
    sysLabels: record.is_read ? ['seen'] : ['unread'],
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center p-2 border-b">
        <Link href={`/dashboard/email?accountId=${accountId}&folder=${folder}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
         <MailDisplay mail={mail} accountId={accountId || record.account_id} />
      </div>
    </div>
  );
}
