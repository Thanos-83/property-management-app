import Link from 'next/link';

export default async function HomePage() {
  return (
    <div className='flex flex-col place-content-center'>
      <h1 className='text-4xl font-bold text-center mt-20'>
        Καλώς ήρθες στην αρχική σελίδα!
      </h1>
      <Link href='/dashboard' className='mt-6  text-center'>
        Dashboard
      </Link>
    </div>
  );
}
