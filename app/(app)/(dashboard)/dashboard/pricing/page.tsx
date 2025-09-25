import Pricing from '@/components/home/Pricing';

function Billing() {
  return (
    <div className=' flex flex-1 flex-col gap-4 p-4 pt-4'>
      <div className='bg-muted/25 min-h-[calc(100vh - 72px)] flex-1 rounded-xl'>
        <div className='pt-4 mx-auto max-w-2xl space-y-6 text-center'>
          <h1 className='text-center text-4xl font-semibold lg:text-5xl'>
            Pricing that Scales with You
          </h1>
          <h4>Choose the right plan that fits to your needs!</h4>
        </div>
        <Pricing />
      </div>
    </div>
  );
}

export default Billing;
