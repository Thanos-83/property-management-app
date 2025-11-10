import Stripe from 'stripe';
import { stripe } from '@/lib/utils/stripe/stripeServerClient';
import { headers } from 'next/headers';
import {
  handleStripeDeletePriceRecord,
  handleStripeDeleteProductRecord,
  handleStripePriceRecord,
  handleStripeProductRecord,
  handleSubscriptionStatusChange,
} from '@/lib/utils/stripe/stripeAdminTasks';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(request: Request) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  // initialize the event
  let event: Stripe.Event;

  try {
    const body = await request.text();
    const headersList = await headers();

    // console.log('Webhook headers list: ', headersList);

    const signature = headersList.get('stripe-signature') as string;
    // Process the webhook payload
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

      console.log('Event: ', event.type);
    } catch (error: unknown) {
      console.log(`⚠️  Webhook signature verification failed.`, error);
      return Response.json({ status: 400 });
    }
  } catch (error: unknown) {
    console.log(`Webhook error: ${error}`);
    return new Response(`Webhook error: ${error}`, {
      status: 400,
    });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          // add product to db or update product to db
          await handleStripeProductRecord(event.data.object as Stripe.Product);
          break;
        case 'price.created':
        case 'price.updated':
          // add price to db or update price to db
          await handleStripePriceRecord(event.data.object as Stripe.Price);
          break;
        case 'product.deleted':
          await handleStripeDeleteProductRecord(event.data.object.id);
          break;

        case 'price.deleted':
          await handleStripeDeletePriceRecord(event.data.object.id);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          // console.log('Subscription data: ', subscription);
          await handleSubscriptionStatusChange(
            subscription.id
            // subscription.customer as string,
            // event.type === 'customer.subscription.created'
          );
          console.log('FROM WEBHOOK🚀', subscription.status);
          break;
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          // console.log('Checkout Session Data: ', checkoutSession);
          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            await handleSubscriptionStatusChange(
              subscriptionId as string
              // checkoutSession.customer as string,
              // true
            );
          }
          break;
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error) {
      console.log(error);
      return new Response(
        'Webhook error: "Webhook handler failed. View logs."',
        { status: 400 }
      );
    }
  }

  return new Response('Success!', {
    status: 200,
  });
}
