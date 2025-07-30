import Pricing from '@/components/home/Pricing';
import Link from 'next/link';
import React from 'react';
export default async function HomePage() {
  return (
    <div>
      <div className='flex flex-col place-content-center'>
        <h1 className='text-4xl font-bold text-center mt-20'>
          Καλώς ήρθες στην αρχική σελίδα!
        </h1>
        <Link href='/dashboard' className='mt-6  text-center'>
          Dashboard
        </Link>
   

        <div className='mt-8'>
          <div className='mx-auto max-w-2xl space-y-6 text-center'>
            <h1 className='text-center text-4xl font-semibold lg:text-5xl'>
              Pricing that Scales with You
            </h1>
            <p>
              Gemini is evolving to be more than just the models. It supports an
              entire to the APIs and platforms helping developers and businesses
              innovate.
            </p>
          </div>
          <Pricing />
        </div>
      </div>
    </div>
  );
}
