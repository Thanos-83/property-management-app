'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';
import { createStripeSession } from '@/lib/actions/stripeActions';
import { useState } from 'react';
import { PLAN_FEATURES } from '@/lib/utils/planFeatures';

export interface StripePrice {
  id: string;
  type: string;
  active: boolean;
  currency: string;
  interval: string;
  unit_amount: number;
  interval_count: number;
  trial_period_days: number | null;
}

export interface StripeProduct {
  id: string;
  active: boolean;
  name: string;
  description: string | null;
  image: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
  prices: StripePrice[];
}

export default function DashboardPricingCard({
  productData,
  isCurrentPlan,
  currentTier,
}: {
  productData: StripeProduct;
  isCurrentPlan: boolean;
  currentTier: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isPro = productData.name.includes('Pro');
  const features =
    PLAN_FEATURES[productData.name] || PLAN_FEATURES['Default Plan'];

  // Basic logic to determine button text based on price comparison (Upgrade vs Downgrade)
  // This is a simplified example; robust logic might compare product weights or tiers
  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    if (isCurrentPlan) return 'Current Plan';
    // If the user is on a trial, everything is an upgrade
    if (currentTier === 'trial') return 'Upgrade';

    // Fallback simple logic: if it's not the current plan, we'll assume they want to change to it
    return 'Change Plan';
  };

  const handleStripeSession = async (priceId: string) => {
    setIsLoading(true);
    try {
      // NOTE: For an existing logged-in user, this server action needs to handle
      // creating a checkout session linked to their EXISTING Stripe Customer ID,
      // or redirecting them to the Stripe Customer Portal to change plans.
      const response = await createStripeSession(priceId);
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Stripe session failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`relative flex flex-col h-full shadow-sm transition-all ${
        isCurrentPlan
          ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/10'
          : isPro
            ? 'border-primary ring-1 ring-primary'
            : 'border-zinc-200'
      }`}>
      {isCurrentPlan && (
        <div className='absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold text-white tracking-widest uppercase shadow-sm'>
          Active Plan
        </div>
      )}

      <CardHeader className='pt-8 pb-4'>
        <CardTitle className='text-xl font-bold text-zinc-900'>
          {productData?.name}
        </CardTitle>
        <CardDescription className='text-sm text-zinc-500 h-10'>
          {productData?.description ||
            'Perfect for managing your growing property portfolio.'}
        </CardDescription>

        <div className='mt-4 flex items-baseline text-4xl font-black text-zinc-900'>
          €{productData?.prices[0].unit_amount / 100}
          <span className='ml-1 text-sm font-medium text-zinc-500'>
            /{productData?.prices[0].interval === 'month' ? 'mo' : 'yr'}
          </span>
        </div>

        <Button
          onClick={() => handleStripeSession(productData.prices[0].id)}
          disabled={isLoading || isCurrentPlan}
          variant={isCurrentPlan ? 'secondary' : isPro ? 'default' : 'outline'}
          className={`mt-6 w-full font-bold ${
            isCurrentPlan
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 opacity-100 cursor-default'
              : ''
          }`}>
          {getButtonText()}
        </Button>
      </CardHeader>

      <CardContent className='flex-1 pt-6'>
        <div className='h-px w-full bg-zinc-100 mb-6' />
        <ul className='space-y-3 text-sm'>
          {features.map((feature: string, index: number) => (
            <li
              key={index}
              className='flex items-start gap-3 text-zinc-600 font-medium'>
              <Check
                className={`h-4 w-4 shrink-0 ${isCurrentPlan ? 'text-emerald-500' : isPro ? 'text-primary' : 'text-zinc-400'}`}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
