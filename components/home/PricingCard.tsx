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
import { createClient } from '@/lib/utils/supabase/client';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';

export default function PricingCard({ productData }) {
  console.log('Stripe product data from supabase: ', productData);
  const supabase = createClient();
  const [user, setUser] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('User Data: ', user);
      if (user) {
        setUser(true);
      } else {
        setUser(false);
      }
    };

    fetchUser();
  });

  console.log('user: ', user);
  const handleStripeSession = async (priceId: string) => {
    if (user) {
      const response = await createStripeSession(priceId);
      console.log('Response from server action - Stripe session: ', response);
    } else {
      return redirect(`/login?priceID=${priceId}`);
    }
  };
  return (
    <section className='py-8 md:py-16'>
      <Card className='relative h-full'>
        {productData.name === 'Pro' && (
          <span className='bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full bg-primary px-6 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5'>
            Popular
          </span>
        )}

        <CardHeader>
          <CardTitle className='font-medium'>{productData?.name}</CardTitle>

          <span className='my-3 block text-2xl font-semibold'>
            Euro {productData?.prices[0].unit_amount / 100} /{' '}
            {productData?.prices[0].interval === 'month' ? 'month' : 'year'}
          </span>

          <CardDescription className='text-sm'>Per User</CardDescription>

          <Button
            onClick={() => handleStripeSession(productData.prices[0].id)}
            className='mt-4 w-full'>
            Get Started
          </Button>
        </CardHeader>

        <CardContent className='space-y-4'>
          <hr className='border-dashed' />

          <ul className='list-outside space-y-3 text-sm'>
            {Object.values(productData.metadata).map((item, index) => (
              <li key={index} className='flex items-center gap-2'>
                <Check className='size-3' />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
