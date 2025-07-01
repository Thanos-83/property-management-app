import { AddPropertyDialog } from '@/components/properties/AddPropertyModal';
import DashboardPageWrapper from '@/components/DashboardPageWrapper';
import { PropertyTypesApi } from '@/types/propertyTypes';
// import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';
import Property from '@/components/properties/Property';
import { cookies } from 'next/headers';
// import dynamic from 'next/dynamic';

// const Property = dynamic(() => import('@/components/properties/Property'));

// const fetchProperties = async () => {
//   // Test API call with proper cookie forwarding from server component
//   const cookieStore = await cookies();
//   const cookieHeader = cookieStore
//     .getAll()
//     .map((cookie) => `${cookie.name}=${cookie.value}`)
//     .join('; ');

//   console.log('Making API call from server component with cookies...');

//   const response = await fetch(`http://localhost:3000/api/properties`, {
//     headers: {
//       Cookie: cookieHeader,
//     },
//     next: {
//       tags: ['properties'],
//     },
//   });

//   const { properties } = await response.json();

//   return properties;
// };

export default async function DashboardListingsPage() {
  // const { properties } = await getPropertiesDataAction();

  // const properties = await fetchProperties();

  // Test API call with proper cookie forwarding from server component
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  // console.log('Making API call from server component with cookies...');

  const response = await fetch(`http://localhost:3000/api/properties`, {
    headers: {
      Cookie: cookieHeader,
    },
    next: {
      tags: ['properties'],
    },
  });

  const { properties } = await response.json();

  // console.log('Page Properties: ', properties);

  return (
    <DashboardPageWrapper>
      <div className='flex-1 overflow-y-auto'>
        <div className='mb-4 bg-white border-b-2 border-b-neutral/20'>
          <div className='p-6 flex items-center justify-between'>
            <h1 className='text-2xl font-bold'>Listings</h1>
            <div className='space-x-6'>
              <AddPropertyDialog />
            </div>
          </div>
        </div>
        {/* main content */}
        <div className='px-6'>
          <div className='space-y-4'>
            {properties?.map((property: PropertyTypesApi) => {
              return <Property key={property.id} property={property} />;
            })}
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}
