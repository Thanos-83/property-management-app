'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BulkSyncResponse } from '@/types/propertyTypes';

interface SyncAllButtonProps {
  propertyId: string;
  onSyncComplete?: (result: BulkSyncResponse) => void;
  disabled?: boolean;
  className?: string;
}

export default function SyncAllButton({
  propertyId,
  onSyncComplete,
  disabled,
  className,
}: SyncAllButtonProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      if (!response.ok) throw new Error('Sync failed');

      const result: BulkSyncResponse = await response.json();

      // Smart Toast Notifications
      if (result.summary.failedSyncs === 0) {
        toast.success(
          `Synced all calendars! ${result.summary.totalNewBookings} new, ${result.summary.totalUpdatedBookings} updated.`,
        );
      } else if (result.summary.successfulSyncs > 0) {
        toast.warning(
          `Partial sync: ${result.summary.successfulSyncs} succeeded, ${result.summary.failedSyncs} failed.`,
        );
      } else {
        toast.error('Sync all failed. Please check your calendar URLs.');
      }

      // Pass results back to parent to update optimistic UI
      if (onSyncComplete) {
        onSyncComplete(result);
      }

      router.refresh();
    } catch (error) {
      console.error('[SyncAllButton Error]:', error);
      toast.error('Network error. Failed to trigger bulk sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={handleSyncAll}
      disabled={disabled || isSyncing}
      className={
        className ||
        'h-7 px-3 text-xs bg-white hover:bg-muted font-semibold shadow-sm transition-all'
      }>
      <RefreshCw
        className={`w-3 h-3 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`}
      />
      {isSyncing ? 'Syncing All...' : 'Sync All'}
    </Button>
  );
}
