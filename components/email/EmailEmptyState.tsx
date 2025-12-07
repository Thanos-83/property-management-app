'use client';

import { Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAurinkoAuthUrl } from '@/lib/actions/emailActions';
import { useState } from 'react';

export function EmailEmptyState() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectAccount = async () => {
    setIsConnecting(true);
    try {
      const result = await getAurinkoAuthUrl();
      if (result.success && result.data) {
        // Redirect to Aurinko OAuth
        window.location.href = result.data;
      } else {
        console.error('Failed to get auth URL:', result.error);
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] px-4">
      <div className="max-w-md text-center space-y-6">
        {/* Illustration */}
        <div className="relative mx-auto w-48 h-48 mb-8">
          {/* Envelope Base */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Main Envelope */}
              <div className="w-40 h-28 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg shadow-lg border-2 border-blue-300 dark:border-blue-700">
                {/* Envelope Flap */}
                <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700 rounded-t-lg border-b-2 border-blue-300 dark:border-blue-600 transform -translate-y-1"></div>
                
                {/* Email Icon in Center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Mail className="w-12 h-12 text-blue-600 dark:text-blue-300" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Sparkle Effects */}
              <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-yellow-500 animate-pulse" />
              <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-purple-500 animate-pulse delay-75" />
              <Sparkles className="absolute top-1/2 -right-6 w-5 h-5 text-pink-500 animate-pulse delay-150" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome to Your Email Hub
          </h2>
          <p className="text-muted-foreground text-sm">
            Connect your first email account to get started. Manage Gmail, Outlook, and more all in one place with real-time sync.
          </p>
        </div>

        {/* Connect Button */}
        <Button
          onClick={handleConnectAccount}
          disabled={isConnecting}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isConnecting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              Connecting...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Connect Your First Account
            </>
          )}
        </Button>

        {/* Benefits List */}
        <div className="pt-6 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Real-time sync</span> - Emails appear instantly as they arrive
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Multiple accounts</span> - Manage all your inboxes in one place
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Secure & private</span> - Your data stays encrypted and safe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
