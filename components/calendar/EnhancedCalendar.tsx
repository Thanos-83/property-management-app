'use client';

import React, { useState, use } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { CalendarData, CalendarEvent } from '@/types/bookingTypes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// import { toast } from 'sonner';
import { AlertTriangleIcon } from 'lucide-react';
import Image from 'next/image';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const platformColors: Record<string, string> = {
  Airbnb: '#FF5A5F',
  Booking: '#003580',
  Vrbo: '#0066CC',
  Expedia: '#FFC72C',
  Unknown: '#6B7280',
};

const platformIcons: Record<string, string> = {
  Airbnb: '/icons/airbnb.svg',
  Booking: '/icons/booking.svg',
  Vrbo: '/icons/vrbo.svg',
  Expedia: '/icons/expedia.svg',
};

export default function EnhancedCalendar({
  bookingData,
}: {
  bookingData: Promise<CalendarData>;
}) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  const data = use(bookingData);
  console.log('Booking Data on the Client: ', data);

  // Sync all properties

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const isConflicted =
      data &&
      'events' in data &&
      data.conflicts?.some((conflict) =>
        conflict.conflicts.some(
          (c) =>
            c.booking1.platform === event.resource.platform ||
            c.booking2.platform === event.resource.platform
        )
      );

    return (
      <div
        className={`flex items-center space-x-1 text-xs p-1 rounded ${
          isConflicted ? 'bg-red-100 border border-red-300' : ''
        }`}
        style={{
          backgroundColor: isConflicted
            ? undefined
            : platformColors[event.resource.platform] + '20',
          borderLeft: `3px solid ${platformColors[event.resource.platform]}`,
        }}>
        {platformIcons[event.resource.platform] && (
          <Image
            src={platformIcons[event.resource.platform]}
            alt={event.resource.platform}
            width={8}
            height={8}
            className='w-24 h-6 flex-shrink-0'
          />
        )}
        <span className='truncate font-medium'>
          {event.resource.propertyName}
        </span>
        {isConflicted && (
          <AlertTriangleIcon className='w-3 h-3 text-red-500 flex-shrink-0' />
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4`}>
      {/* Header with controls */}

      {/* Conflicts Alert - To be removed in new separate component (Or better fully redesinged) */}
      {data &&
        'events' in data &&
        data.conflicts &&
        data.conflicts.length > 0 && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <AlertTriangleIcon className='w-5 h-5 text-red-500' />
              <h3 className='font-semibold text-red-800'>
                Booking Conflicts Detected
              </h3>
            </div>
            <div className='space-y-2'>
              {data.conflicts.map((conflict) => (
                <div key={conflict.propertyId} className='text-sm'>
                  <strong>{conflict.propertyName}:</strong>
                  <ul className='ml-4 mt-1'>
                    {conflict.conflicts.map((c, index) => (
                      <li key={index} className='text-red-700'>
                        {c.booking1.platform} ({c.booking1.dates}) overlaps with{' '}
                        {c.booking2.platform} ({c.booking2.dates}) -{' '}
                        {c.overlapDays} days
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Calendar */}
      <div
        className='bg-white rounded-lg border p-4'
        style={{ height: '580px' }}>
        <Calendar
          localizer={localizer}
          events={data && 'events' in data ? data.events || [] : []}
          startAccessor='start'
          endAccessor='end'
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          components={{
            event: EventComponent,
          }}
          onSelectEvent={(event: CalendarEvent) => setSelectedEvent(event)}
          popup
          popupOffset={{ x: 30, y: 20 }}
          eventPropGetter={(event: CalendarEvent) => ({
            style: {
              backgroundColor: platformColors[event.resource.platform] + '40',
              borderColor: platformColors[event.resource.platform],
              color: '#000',
            },
          })}
        />
      </div>

      {/* Event Details Modal - To be removed in a new separate component*/}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <>
              <div className='space-y-2'>
                <div>
                  <strong>Property:</strong>{' '}
                  {selectedEvent.resource.propertyName}
                </div>
                <div className='flex items-center space-x-2'>
                  <strong>Platform:</strong>
                  {platformIcons[selectedEvent.resource.platform] && (
                    <Image
                      src={platformIcons[selectedEvent.resource.platform]}
                      alt={selectedEvent.resource.platform}
                      width={20}
                      height={20}
                    />
                  )}
                  <span>{selectedEvent.resource.platform}</span>
                </div>
                <div>
                  <strong>Dates:</strong>{' '}
                  {moment(selectedEvent.start).format('DD/MM/YYYY')} -{' '}
                  {moment(selectedEvent.end).format('DD/MM/YYYY')}
                </div>
                {selectedEvent.resource.guestName && (
                  <div>
                    <strong>Guest:</strong> {selectedEvent.resource.guestName}
                  </div>
                )}
                <div>
                  <strong>Duration:</strong>{' '}
                  {moment(selectedEvent.end).diff(
                    moment(selectedEvent.start),
                    'days'
                  )}{' '}
                  days
                </div>
              </div>
              <div className='flex justify-end mt-6'>
                <Button onClick={() => setSelectedEvent(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
