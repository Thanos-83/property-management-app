import React from 'react';
import DashboardPageWrapper from '@/components/DashboardPageWrapper';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';

function Calendar() {
  return (
    <DashboardPageWrapper>
      <div className='flex-1 overflow-y-auto'>
        <div className='mb-4 bg-white border-b-2 border-b-neutral/20'>
          <div className='p-6'>
            <h1 className='text-2xl font-bold'>Calendar</h1>
            <p className='text-gray-600 mt-1'>
              View and manage all your property bookings in one place
            </p>
          </div>
        </div>
        <div className='px-4 pb-4'>
          <EnhancedCalendar />
        </div>
      </div>
    </DashboardPageWrapper>
  );
}

export default Calendar;
