'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface UsageMetrics {
  tier: string;
  propertiesCount: number;
  propertiesLimit: number;
  daysLeft?: number;
}

interface SidebarUsageWidgetProps {
  metrics?: UsageMetrics;
}

export function SidebarUsageWidget({ metrics }: SidebarUsageWidgetProps) {
  if (!metrics) return null;

  const limitHit = metrics.propertiesCount >= metrics.propertiesLimit;
  const progressPercent = Math.min(
    (metrics.propertiesCount / metrics.propertiesLimit) * 100,
    100,
  );
  return (
    <div className='p-3 mx-2 mb-2 space-y-4 shadow-xl rounded-lg border border-slate-400/30'>
      {/* Header section - Cleaned up and aligned */}
      <div className='flex items-center justify-between px-1'>
        <span className='text-sm font-semibold text-foreground flex items-center gap-2'>
          <Zap className='w-4 h-4 text-primary' />
          {metrics.tier === 'trial' ? (
            'Free Trial'
          ) : metrics.tier !== 'Premium Plan' ? (
            `${metrics.tier} Usage`
          ) : (
            <p className='text-primary font-bold'>
              You&apos;re on the{' '}
              <span className='text-primary font-bold'>{metrics.tier}</span>
            </p>
          )}
        </span>
        {metrics.tier === 'trial' && metrics.daysLeft !== undefined && (
          <span className='text-xs font-medium text-muted-foreground'>
            {metrics.daysLeft} days left
          </span>
        )}
      </div>

      {/* Progress section */}
      {metrics.tier !== 'Premium Plan' && (
        <div className='space-y-2 px-1'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium'>Properties</span>
            <span
              className={
                limitHit ? 'text-destructive font-bold' : 'font-medium'
              }>
              {metrics.propertiesCount} / {metrics.propertiesLimit}
            </span>
          </div>
          <div className='h-1 w-full bg-secondary rounded-full overflow-hidden'>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                limitHit ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Slimmer, more elegant button */}
      {metrics.tier !== 'Premium Plan' && (
        <Button
          asChild
          variant='default'
          size='sm'
          className='w-full h-8 text-xs font-semibold shadow-sm'>
          <Link href='/dashboard/pricing'>
            <ArrowUpCircle className='w-3.5 h-3.5 mr-1.5' />
            Upgrade Plan
          </Link>
        </Button>
      )}
    </div>
  );
}
