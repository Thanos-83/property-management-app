import { fetchStripeProducts } from '@/lib/actions/stripeActions';
import DashboardPricingCard from '@/components/settings/DashboardPricingCard';
import { checkAccess } from '@/lib/utils/gatekeeper';
import { createClient } from '@/lib/utils/supabase/server';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

export default async function DashboardPricing() {
  const response = await fetchStripeProducts();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch current tier
  const accessCheck = await checkAccess('properties');
  const currentTier = accessCheck?.currentTier || 'trial';

  // 2. Fetch usage to calculate trial days
  const { data: usage } = await supabase
    .from('user_usage')
    .select('trial_start')
    .eq('user_id', user?.id)
    .single();

  let daysLeft = 0;
  if (currentTier === 'trial' && usage?.trial_start) {
    const trialStart = new Date(usage.trial_start);
    const now = new Date();
    const daysElapsed =
      (now.getTime() - trialStart.getTime()) / (1000 * 3600 * 24);
    daysLeft = Math.max(0, 14 - Math.floor(daysElapsed));
  }

  const sortedProducts = response?.stripe?.sort(
    (a, b) => a.prices[0].unit_amount - b.prices[0].unit_amount,
  );

  return (
    <div className='mx-auto max-w-5xl px-4 py-8'>
      <div className='mb-10 text-center max-w-2xl mx-auto flex flex-col items-center'>
        <h2 className='text-3xl font-bold tracking-tight text-zinc-900 mb-2'>
          Manage Your Plan
        </h2>
        <p className='text-zinc-500 mb-6'>
          You are currently on the{' '}
          <span className='font-semibold capitalize text-foreground'>
            {currentTier}
          </span>{' '}
          plan.
        </p>

        {/* THE ALERT MESSAGE (Dynamically handles active vs expired trial) */}
        {currentTier === 'trial' && (
          <div className='w-full text-left'>
            {daysLeft > 0 ? (
              <Alert className='border-amber-500/50 bg-amber-50/50 text-amber-900'>
                <Clock className='h-4 w-4 text-amber-600' />
                <AlertTitle className='font-bold text-amber-800'>
                  Free trial ends in {daysLeft} days
                </AlertTitle>
                <AlertDescription className='text-amber-700 font-medium'>
                  Select a plan below to ensure uninterrupted access to your
                  properties and settings.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant='destructive' className='bg-destructive/5'>
                <AlertTriangle className='h-4 w-4' />
                <AlertTitle className='font-bold'>Trial Expired</AlertTitle>
                <AlertDescription className='font-medium'>
                  Your free trial has ended. Please select a plan below to
                  regain access to your dashboard.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      <div className='grid gap-6 md:grid-cols-3 items-stretch'>
        {sortedProducts?.map((product) => {
          const isCurrentPlan = product.name
            .toLowerCase()
            .includes(currentTier.toLowerCase());

          return (
            <DashboardPricingCard
              productData={product}
              key={product.id}
              isCurrentPlan={isCurrentPlan}
              currentTier={currentTier}
            />
          );
        })}
      </div>
    </div>
  );
}
