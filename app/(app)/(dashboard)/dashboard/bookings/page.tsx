import { createClient } from '@/lib/utils/supabase/server';

const fetchBookings = async () => {
  const supabase = await createClient();
  const response = await supabase.from('bookings').select('').limit(1);
  return response;
};

async function Bookings() {
  const bookings = await fetchBookings();
  console.log('Bookings: ', bookings);

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Bookings Page</h1>
    </div>
  );
}

export default Bookings;
