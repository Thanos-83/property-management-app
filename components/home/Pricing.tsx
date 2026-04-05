import { fetchStripeProducts } from '@/lib/actions/stripeActions';
import PricingCard from './PricingCard';
import { createClient } from '@/lib/utils/supabase/server';
import { TextEffect } from '@/components/ui/text-effect';

export default async function Pricing() {
  const response = await fetchStripeProducts();

  // Fetch user ONCE on the server
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Sort products by price (optional, but good practice if Stripe returns them out of order)
  const sortedProducts = response?.stripe?.sort(
    (a, b) => a.prices[0].unit_amount - b.prices[0].unit_amount,
  );

  return (
    <section id='pricing' className='py-24 bg-zinc-50 border-t border-zinc-100'>
      <div className='mx-auto max-w-3xl space-y-4 text-center mb-16 px-6'>
        <TextEffect
          as='h2'
          preset='fade-in-blur'
          className='text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl'>
          Pricing that scales with your portfolio.
        </TextEffect>
        <TextEffect
          as='p'
          preset='fade-in-blur'
          className='text-lg text-zinc-500 font-medium leading-relaxed'>
          Simple, transparent plans designed for modern hosts. Pay only for what
          you need, and upgrade anytime as your business grows.
        </TextEffect>
      </div>

      <div className='mx-auto max-w-6xl px-6'>
        <div className='grid gap-8 md:grid-cols-3 items-stretch'>
          {sortedProducts?.map((product) => (
            <PricingCard
              productData={product}
              key={product.id}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
