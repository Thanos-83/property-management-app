import { fetchStripeProducts } from '@/lib/actions/stripeActions';
import PricingCard from './PricingCard';

export default async function Pricing() {
  const response = await fetchStripeProducts();

  return (
    <section className='py-4'>
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="text-center text-4xl font-semibold lg:text-5xl">Pricing that Scales with You</h1>
        <p>Gemini is evolving to be more than just the models. It supports an entire to the APIs and platforms helping developers and businesses innovate.</p>
      </div>
      <div className='mx-auto max-w-6xl px-6'>
        <div className=' grid gap-6 md:mt-8 md:grid-cols-3'>
          {response?.stripe?.map((product) => (
            <PricingCard productData={product} key={product.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
