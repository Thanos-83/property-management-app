'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { subscribeToWebhooks, listWebhookSubscriptions } from '@/lib/actions/webhookActions';
import { toast } from 'sonner';
import { Webhook, Loader2 } from 'lucide-react';

interface WebhookManagerProps {
  accountId: string;
  webhookUrl: string;
}

export function WebhookManager({ accountId, webhookUrl }: WebhookManagerProps) {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await subscribeToWebhooks(accountId, webhookUrl);
      if (result.success) {
        toast.success('Webhook registered successfully!');
        await loadSubscriptions();
      } else {
        toast.error(result.error || 'Failed to register webhook');
      }
    } catch (error) {
      toast.error('Error registering webhook');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    const result = await listWebhookSubscriptions(accountId);
    if (result.success) {
      setSubscriptions(result.data || []);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        <Webhook className="h-4 w-4" />
        <h3 className="font-semibold">Webhook Configuration (Development)</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Register webhook to receive real-time email notifications
      </p>
      <div className="flex flex-col gap-2">
        <code className="text-xs bg-background p-2 rounded">
          {webhookUrl}
        </code>
        <div className="flex gap-2">
          <Button 
            onClick={handleSubscribe} 
            disabled={loading}
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Webhook
          </Button>
          <Button 
            onClick={loadSubscriptions} 
            variant="outline"
            size="sm"
          >
            Check Status
          </Button>
        </div>
        {subscriptions.length > 0 && (
          <div className="mt-2 text-xs">
            <p className="text-green-600">✅ {subscriptions.length} webhook(s) registered</p>
          </div>
        )}
      </div>
    </div>
  );
}
