import { AddPropertyDialog } from '@/components/properties/AddPropertyModal';
import { PropertyTypesApi } from '@/types/propertyTypes';
import { cookies } from 'next/headers';
import { protocol, rootDomain } from '@/lib/utils';
import ListingsClient from '@/components/properties/ListingsClient';
import { createClient } from '@/lib/utils/supabase/server';

export default async function DashboardListingsPage() {
  // Test API call with proper cookie forwarding from server component
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const baseUrl = `${protocol}://app.${rootDomain}`;
  console.log('Base URL:', baseUrl);
  const response = await fetch(`${baseUrl}/api/properties/`, {
    headers: {
      Cookie: cookieHeader,
    },
    next: {
      tags: ['properties'],
    },
    cache: 'no-store',
  });

  const { properties } = await response.json();

  console.log('Properties: ', properties);

  // NEW: Fetch the user's active task templates
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let templates: any[] = [];
  if (user) {
    const { data } = await supabase
      .from('task_templates')
      .select('id, name, task_type')
      .eq('host_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    templates = data || [];
  }
  return (
    <div className='flex-1 overflow-y-auto bg-slate-50/50 min-h-screen'>
      {/* --- HEADER --- */}
      <div className='bg-white border-b border-border shadow-sm'>
        <div className='p-6 max-w-[1600px] mx-auto flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>Property Portfolio</h1>
          <div className='space-x-6'>
            <AddPropertyDialog />
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT (GRID) --- */}
      <div className='p-6 max-w-[1600px] mx-auto pb-24'>
        <ListingsClient initialProperties={properties || []} availableTemplates={templates} />
      </div>
    </div>
  );
}