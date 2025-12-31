'use client';

import { Button } from '@/components/ui/button';
import { syncRecentEmails } from '@/lib/actions/emailActions';

function SyncEmailsButton() {
  return (
    <Button
      onClick={() => syncRecentEmails('d8a5bb04-b253-45b1-91b9-7966fbe04098')}>
      Sync Emails
    </Button>
  );
}

export default SyncEmailsButton;
