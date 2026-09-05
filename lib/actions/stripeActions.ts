'use server';

import { stripe } from '../utils/stripe/stripeServerClient';
import { createClient } from '../utils/supabase/server';
// import { createServiceClient } from '../utils/supabase/supabaseDB';

export const fetchStripeProducts = async () => {
  const supabase = await createClient();
  const { data: productData, error } = await supabase
    .from('products')
    .select(
      `
    *,
    prices(
    id,
    active,
    unit_amount,
    currency,
    type,
    interval,
    interval_count,
    trial_period_days
    )
    `,
    )
    .order('id', { ascending: true });

  if (error) {
    return { error };
  }

  return {
    stripe: productData,
  };
};

export const createStripeSession = async (price: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: supabaseCustomer } = await supabase
    .from('customers')
    .select()
    .eq('id', user.id)
    .single();

  let customerId = supabaseCustomer?.stripe_customer_id;

  // Create customer if they don't exist
  if (!customerId) {
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.user_metadata?.full_name,
    });
    customerId = stripeCustomer.id;

    const { error } = await supabase
      .from('customers')
      .insert([{ id: user.id, stripe_customer_id: customerId }]);

    if (error) {
      console.error('Fatal: Could not save customer to Supabase', error);
      throw new Error('Failed to setup billing account'); // Halt execution
    }
  }

  // Define dynamic URL
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://app.myapp.site:3000';

  // Check if the user already has an active subscription
  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .limit(1);

  const hasActiveSubscription =
    activeSubscriptions && activeSubscriptions.length > 0;

  if (hasActiveSubscription) {
    // If they already have a subscription, route them to the Customer Portal to change plans
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/dashboard/settings/billing`,
    });
    return { url: portalSession.url };
  } else {
    // If they do not have a subscription (they are on a trial), create a new checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal', 'link'],
      billing_address_collection: 'auto',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${siteUrl}/dashboard/pricing/success`,
      cancel_url: `${siteUrl}/dashboard/pricing/cancel`,
    });
    return { url: session.url as string };
  }
};
