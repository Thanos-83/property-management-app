import { OverviewCard } from '@/components/OverviewCard';
import { PlaceholderChart } from '@/components/PlaceholderChart';

import DashboardPageWrapper from '@/components/DashboardPageWrapper';

export default async function DashboardPage() {
  return (
    <DashboardPageWrapper>
      <div className='flex-1 overflow-y-auto'>
        <div className='mb-4 bg-white border-b-2 border-b-neutral/20'>
          <div className='p-6'>
            <h1 className='text-2xl font-bold'>Overview</h1>
          </div>
        </div>
        {/* main content */}
        <div className='px-4'>
          {/* Cards row */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
            <OverviewCard
              title='Total Income'
              value='$0.00'
              positive
              subValue='+0.00%'
              sub='Compared to last month'
            />
            <OverviewCard
              title='Profit'
              value='$0.00'
              positive
              subValue='+0.00%'
              sub='Compared to last month'
            />
            <OverviewCard
              title='Total Views'
              value='0'
              positive
              subValue='+0.00%'
              sub='Compared to last month'
            />
            <OverviewCard
              title='Conversion Rate'
              value='0,00%'
              positive
              subValue='+0.00%'
              sub='Compared to last month'
            />
          </div>
          {/* Graphs */}
          <div className='grid md:grid-cols-3 gap-4'>
            <PlaceholderChart
              title='Revenue Over Time'
              description='Total Revenue vs Total Target'
            />
            <PlaceholderChart title='Session by Country' />
            <div className='grid grid-rows-2 gap-4'>
              <PlaceholderChart title='Sales by Region' />
              <PlaceholderChart title='Sales by e-commerce platform' />
            </div>
            <PlaceholderChart title='Registered users' />
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}
