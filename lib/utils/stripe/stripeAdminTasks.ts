'use server';

import Stripe from 'stripe';
import { createServiceClient } from '../supabase/supabaseDB';
import { stripe } from './stripeServerClient';
// import { createClient } from '../supabase/client';
// import { createClient } from '../supabase/server';
// import { createApiClient } from '../supabase/api';

export async function handleStripeProductRecord(stripeProduct: Stripe.Product) {
  // const supabase = await createClient();
  const supabase = createServiceClient();

  const product = {
    id: stripeProduct.id,
    active: stripeProduct.active,
    name: stripeProduct.name,
    description: stripeProduct.description ?? null,
    image: stripeProduct.images[0] ?? null,
    metadata: stripeProduct.metadata,
  };

  const { data, error } = await supabase
    .from('products')
    .upsert(product, { onConflict: 'id' });

  if (error) {
    console.log('Error insrerting or updating product in Supabase: ', error);
  }
  console.log('Product inserted/updated successfuly to Supabase: ', data);
}

export async function handleStripeDeleteProductRecord(productId: string) {
  // const supabase = await createClient();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.log('Error deleting product from the supabase: ', error);
  }
  console.log(
    `Product with id: ${productId} deleted successfuly from the supabase`
  );
}

export async function handleStripePriceRecord(price: Stripe.Price) {
  // const supabase = await createClient();
  const supabase = createServiceClient();

  const priceData = {
    id: price.id,
    product_id: price.product,
    active: price.active,
    description: null,
    unit_amount: price.unit_amount,
    currency: price.currency,
    type: price.type,
    interval: price.recurring?.interval,
    interval_count: price.recurring?.interval_count,
    trial_period_days: price.recurring?.trial_period_days,
    metadata: price.metadata,
  };
  const { data, error } = await supabase
    .from('prices')
    .upsert(priceData, { onConflict: 'id' });

  // console.log('Price: ', priceData);
  if (error) {
    console.log('Error insrerting or updating price in Supabase: ', error);
  }
  console.log('Price inserted/updated successfuly to Supabase: ', data);
}

export async function handleStripeDeletePriceRecord(priceId: string) {
  // const supabase = await createClient();
  const supabase = createServiceClient();

  const { error } = await supabase.from('prices').delete().eq('id', priceId);

  if (error) {
    console.log('Error deleting price from the supabase: ', error);
  }
  console.log(
    `Price with id: ${priceId} deleted successfuly from the supabase`
  );
}

export async function handleSubscriptionStatusChange(subscriptionId: string) {
  const supabase = await createServiceClient();

  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);

  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select()
    .eq('stripe_customer_id', subscriptionData.customer)
    .single();

  console.log('Customer data in stripeActions: ', customerData);

  if (customerError) {
    console.error('Error fetching customer from database:', customerError);
    throw new Error('Customer not found in database');
  }

  const supabaseSubscriptionData = {
    id: subscriptionData.id,
    user_id: customerData.id,
    status: subscriptionData.status,
    metadata: subscriptionData.metadata,
    price_id: subscriptionData.items.data[0].price.id,
    quantity: subscriptionData.items.data[0].quantity,
    cancel_at_period_end: subscriptionData.cancel_at_period_end
      ? new Date(
          Number(subscriptionData.cancel_at_period_end) * 1000
        ).toISOString()
      : null,
    created: subscriptionData.created
      ? new Date(Number(subscriptionData.created) * 1000).toISOString()
      : null,
    current_period_start: subscriptionData.items.data[0].current_period_start
      ? new Date(
          Number(subscriptionData.items.data[0].current_period_start) * 1000
        ).toISOString()
      : null,
    current_period_end: subscriptionData.items.data[0].current_period_end
      ? new Date(
          Number(subscriptionData.items.data[0].current_period_end) * 1000
        ).toISOString()
      : null,
    ended_at: subscriptionData.ended_at
      ? new Date(Number(subscriptionData.ended_at) * 1000).toISOString()
      : null,
    canceled_at: subscriptionData.cancel_at
      ? new Date(Number(subscriptionData.cancel_at) * 1000).toISOString()
      : null,
    trial_start: subscriptionData.trial_start
      ? new Date(Number(subscriptionData.trial_start) * 1000).toISOString()
      : null,
    trial_end: subscriptionData.trial_end
      ? new Date(Number(subscriptionData.trial_end) * 1000).toISOString()
      : null,
  };

  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .upsert(supabaseSubscriptionData, { onConflict: 'id' })
    .select();

  console.log('Supabase subscription data: ', subData);
  if (subError) {
    console.error('Error inserting subscription data:', subError);
  }

  return customerData;
}
