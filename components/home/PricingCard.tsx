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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PLAN_FEATURES } from '@/lib/utils/planFeatures';

export default function PricingCard({
  productData,
  isLoggedIn,
}: {
  productData: {
    id: string;
    name: string;
    description?: string | null;
    metadata?: Record<string, string> | null;
    prices: {
      id: string;
      unit_amount: number;
      interval: string;
    }[];
  };
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isPro = productData.name.includes('Pro');
  console.log('Product Data: ', productData);

  const features =
    PLAN_FEATURES[productData.name] || PLAN_FEATURES['Default Plan'];

  const handleStripeSession = async (priceId: string) => {
    setIsLoading(true);
    if (isLoggedIn) {
      try {
        const response = await createStripeSession(priceId);
        // Assuming your server action returns { url: string } for the Stripe Checkout session
        if (response?.url) {
          window.location.href = response.url;
        }
      } catch (error) {
        console.error('Stripe session failed:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push(`/auth/login?priceID=${priceId}`);
    }
  };

  return (
    <Card
      className={`relative flex flex-col h-full shadow-sm transition-all hover:shadow-md ${isPro ? 'border-primary ring-1 ring-primary shadow-primary/10' : 'border-zinc-200'}`}>
      {isPro && (
        <div className='absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground tracking-wide uppercase shadow-sm'>
          Most Popular
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

        <div className='mt-4 flex items-baseline text-5xl font-black text-zinc-900'>
          €{productData?.prices[0].unit_amount / 100}
          <span className='ml-1 text-base font-medium text-zinc-500 tracking-normal'>
            /{productData?.prices[0].interval === 'month' ? 'mo' : 'yr'}
          </span>
        </div>

        <Button
          onClick={() => handleStripeSession(productData.prices[0].id)}
          disabled={isLoading}
          variant={isPro ? 'default' : 'outline'}
          className={`mt-6 w-full h-12 font-bold text-base ${isPro ? 'shadow-md hover:shadow-lg' : 'bg-transparent border-zinc-200 hover:bg-zinc-50'}`}>
          {isLoading
            ? 'Loading...'
            : isLoggedIn
              ? 'Upgrade Now'
              : 'Get Started'}
        </Button>
      </CardHeader>

      <CardContent className='flex-1 pt-6'>
        <div className='h-px w-full bg-zinc-100 mb-6' />

        <ul className='space-y-4 text-sm'>
          {/* 3. Map over your frontend features array instead of the raw metadata */}
          {features.map((feature, index) => (
            <li
              key={index}
              className='flex items-start gap-3 text-zinc-600 font-medium'>
              <Check
                className={`h-5 w-5 shrink-0 ${isPro ? 'text-primary' : 'text-zinc-400'}`}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
