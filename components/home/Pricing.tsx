import { fetchStripeProducts } from '@/lib/actions/stripeActions';
import PricingCard from './PricingCard';

export default async function Pricing() {
  const response = await fetchStripeProducts();

  return (
    <section className='py-4'>
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
