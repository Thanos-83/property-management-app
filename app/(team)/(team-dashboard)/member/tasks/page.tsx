'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/utils/supabase/client';
import { useRouter } from 'next/navigation';

function TeamDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    console.log('Error signing out: ', error);
    router.refresh();
  }
  return (
    <div className='bg-indigo-400 h-screen text-white p-6'>
      Team members tasks page
      <Button onClick={() => signOut()}>Log Out</Button>
    </div>
  );
}

export default TeamDashboardPage;
