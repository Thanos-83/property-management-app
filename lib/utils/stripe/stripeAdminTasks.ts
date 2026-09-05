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
    `Product with id: ${productId} deleted successfuly from the supabase`,
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
    `Price with id: ${priceId} deleted successfuly from the supabase`,
  );
}

export async function handleSubscriptionStatusChange(subscriptionId: string) {
  const supabase = createServiceClient();

  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });

  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select()
    .eq('stripe_customer_id', subscriptionData.customer)
    .single();

  console.log('Customer data in stripeActions: ', customerData);
  console.log('Subscription data in stripeActions: ', subscriptionData);

  if (customerError) {
    console.error('Error fetching customer from database:', customerError);
    throw new Error('Customer not found in database');
  }

  const supabaseSubscriptionData = {
    id: subscriptionData.id,
    user_id: customerData.id,
    status: subscriptionData.status,
    metadata: subscriptionData.metadata,
    price_id: subscriptionData.items.data[0]?.price.id,
    quantity: subscriptionData.items.data[0]?.quantity,
    cancel_at_period_end: subscriptionData.cancel_at_period_end,

    created: subscriptionData.created
      ? new Date(subscriptionData.created * 1000).toISOString()
      : undefined,

    // Reverted to your original logic: fetching dates from items.data[0]
    current_period_start: subscriptionData.items.data[0]?.current_period_start
      ? new Date(
          subscriptionData.items.data[0].current_period_start * 1000,
        ).toISOString()
      : undefined,

    current_period_end: subscriptionData.items.data[0]?.current_period_end
      ? new Date(
          subscriptionData.items.data[0].current_period_end * 1000,
        ).toISOString()
      : undefined,

    // These properties still remain on the root subscription object
    ended_at: subscriptionData.ended_at
      ? new Date(subscriptionData.ended_at * 1000).toISOString()
      : undefined,
    cancel_at: subscriptionData.cancel_at
      ? new Date(subscriptionData.cancel_at * 1000).toISOString()
      : undefined,
    canceled_at: subscriptionData.canceled_at
      ? new Date(subscriptionData.canceled_at * 1000).toISOString()
      : undefined,
    trial_start: subscriptionData.trial_start
      ? new Date(subscriptionData.trial_start * 1000).toISOString()
      : undefined,
    trial_end: subscriptionData.trial_end
      ? new Date(subscriptionData.trial_end * 1000).toISOString()
      : undefined,
  };

  // Strip explicit undefined values to ensure Supabase falls back to Postgres defaults
  Object.keys(supabaseSubscriptionData).forEach((key) => {
    if (
      supabaseSubscriptionData[key as keyof typeof supabaseSubscriptionData] ===
      undefined
    ) {
      delete supabaseSubscriptionData[
        key as keyof typeof supabaseSubscriptionData
      ];
    }
  });

  // Strip explicit undefined values to ensure Supabase falls back to Postgres defaults
  Object.keys(supabaseSubscriptionData).forEach((key) => {
    if (
      supabaseSubscriptionData[key as keyof typeof supabaseSubscriptionData] ===
      undefined
    ) {
      delete supabaseSubscriptionData[
        key as keyof typeof supabaseSubscriptionData
      ];
    }
  });

  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .upsert(supabaseSubscriptionData, { onConflict: 'id' })
    .select();

  console.log('Supabase subscription data: ', subData);
  if (subError) {
    console.error('Error inserting subscription data:', subError);
  }

  // --- BEGIN DOWNGRADE/UPGRADE ENFORCER ---

  // 1. Extract the new limit directly from the expanded Stripe product metadata
  const price = subscriptionData.items.data[0]?.price;
  const product = price?.product as Stripe.Product | undefined;

  // Fallback to 2 (Trial limit) if metadata is missing
  const newPropertyLimit = parseInt(product?.metadata?.limit_properties || '2');

  console.log(
    `Enforcing new property limit: ${newPropertyLimit} for user: ${customerData.id}`,
  );

  // 2. Fetch all properties for this user, ordered oldest to newest
  const { data: userProperties, error: propsError } = await supabase
    .from('properties')
    .select('id, status')
    .eq('owner_id', customerData.id)
    .order('created_at', { ascending: true }); // Oldest (most important) properties first

  if (!propsError && userProperties) {
    // 3. Split properties into two groups based on the new limit
    const propertiesToKeepActive = userProperties.slice(0, newPropertyLimit);
    const propertiesToLock = userProperties.slice(newPropertyLimit);

    // 4. Activate properties that are within the limit (This handles UPGRADES!)
    const activateIds = propertiesToKeepActive.map((p) => p.id);
    if (activateIds.length > 0) {
      await supabase
        .from('properties')
        .update({ status: 'active' })
        .in('id', activateIds)
        .eq('status', 'inactive'); // Only update the ones that need it
    }

    // 5. Deactivate properties that exceed the limit (This handles DOWNGRADES!)
    const lockIds = propertiesToLock.map((p) => p.id);
    if (lockIds.length > 0) {
      await supabase
        .from('properties')
        .update({ status: 'inactive' })
        .in('id', lockIds)
        .eq('status', 'active'); // Only update the ones that need it
    }

    console.log(
      `Locked ${lockIds.length} properties and activated ${activateIds.length} properties.`,
    );
  } else {
    console.error(
      'Error fetching properties for limit enforcement:',
      propsError,
    );
  }
  // --- END DOWNGRADE/UPGRADE ENFORCER ---

  return customerData;
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabaseAdmin = createServiceClient();
  const stripeCustomerId = invoice.customer as string;

  // 1. Find the Supabase user_id associated with this Stripe Customer ID
  const { data: customerData, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id') // The Supabase user_id
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (customerError || !customerData) {
    console.error(
      'Webhook Error: Could not find Supabase customer for Stripe ID:',
      stripeCustomerId,
    );
    return;
  }

  const userId = customerData.id;

  // 2. Reset the AI Parses counter for the new billing month
  const { error: usageError } = await supabaseAdmin
    .from('user_usage')
    .update({ ai_parses_count: 0 })
    .eq('user_id', userId);

  if (usageError) {
    console.error(
      `Webhook Error: Failed to reset usage for user ${userId}`,
      usageError,
    );
  } else {
    console.log(
      `✅ Successfully reset AI Parses for user ${userId} (Invoice Paid)`,
    );
  }
}
