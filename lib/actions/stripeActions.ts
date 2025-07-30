'use server';
import { redirect } from 'next/navigation';
import { stripe } from '../utils/stripe/stripeServerClient';
import { createClient } from '../utils/supabase/server';
import Stripe from 'stripe';

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
    `
    )
    .order('id', { ascending: true });
  //   console.log('Stripe product data: ', productData);
  //   console.log('Stripe product data error: ', error);

  if (error) {
    return { error };
  }

  return {
    stripe: productData,
  };
};

export const createStripeSession = async (price: string) => {
  const supabase = await createClient();
  console.log('Iam here with price ID: ', price);
  const {
    data: { user },
    // error: error,
  } = await supabase.auth.getUser();

  const { data: supabaseCustomer, error: supabaseCustomerError } =
    await supabase.from('customers').select().eq('id', user?.id).single();

  console.log('Supabase customer: ', supabaseCustomer);
  console.log('Supabase customer error: ', supabaseCustomerError);

  if (supabaseCustomer) {
    console.log('Iam here 1');
    // supabaseCustomerID = supabaseCustomer?.stripe_customer_id as string;
    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        billing_address_collection: 'auto',
        customer: supabaseCustomer?.stripe_customer_id,
        line_items: [
          {
            price,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        allow_promotion_codes: true,
        // subscription_data: { trial_from_plan: true, metadata },
        success_url: `http://localhost:3000/dashboard/pricing/success`,
        cancel_url: `http://localhost:3000/dashboard/pricing/cancel`,
        // return_url: `http://localhost:3000/dashboard`,
      });

    console.log('Iam here 2');
    console.log('Stripe Session 1: ', session.url);

    return redirect(session.url as string);
    // return { url: `${session.url}` };
  }

  const stripeCustomer = await stripe.customers.create({
    email: user?.email,
    name: user?.user_metadata.full_name,
  });

  const { error } = await supabase
    .from('customers')
    .insert([{ id: user?.id, stripe_customer_id: stripeCustomer.id }]);

  if (error) {
    // do something with the error adding customer in supabase
    console.log('Error adding customer in supabase: ', error);
  }

  const session: Stripe.Checkout.Session =
    await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal', 'link'],
      billing_address_collection: 'auto',
      customer: stripeCustomer.id,
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      // subscription_data: { trial_from_plan: true, metadata },
      success_url: `http://localhost:3000/dashboard/pricing/success`,
      cancel_url: `http://localhost:3000/dashboard/pricing/cancel`,
      //   return_url: `http://localhost:3000/dashboard`,
    });
  console.log('Stripe Session 2: ', session.url);

  return redirect(session.url as string);
};
