import { createApiClient } from '@/lib/utils/supabase/api';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabaseApi = await createApiClient(request);
  // Auth: get the user from supabase session
  const {
    data: { user },
    // error: userError,
  } = await supabaseApi.auth.getUser();
  //   console.log('User in API: ', user);
  const { data, error } = await supabaseApi
    .from('team_members')
    .select()
    .eq('user_id', user?.id);
  //   console.log('Data fetching members API: ', data);
  //   console.log('Error fetching members API: ', error);
  if (!error) {
    return NextResponse.json({ data }, { status: 200 });
  }
}
