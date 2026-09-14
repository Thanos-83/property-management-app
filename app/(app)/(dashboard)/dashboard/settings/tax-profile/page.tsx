import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import { TaxProfileForm } from '@/components/settings/TaxProfileForm';

export default async function TaxProfilePage() {
  const supabase = await createClient();

  // 1. Authenticate User[cite: 7]
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // 2. Fetch Existing Tax Profile (if any)
  const { data: taxProfile } = await supabase
    .from('tax_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 3. Render Page
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-bold text-foreground'>
          Tax & AADE Profile
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Manage your legal entity, myDATA credentials, and default VAT rates
          for automated reporting.
        </p>
      </div>

      <TaxProfileForm initialData={taxProfile} />
    </div>
  );
}
