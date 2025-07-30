import { createClient } from '@/lib/utils/supabase/server';
async function MembersPage() {
  // You can modify this to pass a default or selected propertyId as needed
  const supabase = await createClient();

  const session = await supabase.auth.getSession();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();
  // console.log('User Session: ', session);
  // console.log('User Data: ', user);

  // Extract the access token for testing
  const accessToken = session.data.session?.access_token;
  console.log('Access Token: ', accessToken);
  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold mb-4'>Members</h1>
      </div>

      {/* Test Edge Function Component */}
      <div className='mt-8 p-6 border rounded-lg bg-gray-50'></div>
    </div>
  );
}

export default MembersPage;
