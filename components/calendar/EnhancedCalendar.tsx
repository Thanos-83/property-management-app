'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { CalendarEvent, ConflictDetection } from '@/types/bookingTypes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2Icon, AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import Image from 'next/image';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarData {
  events: CalendarEvent[];
  conflicts: ConflictDetection[];
  totalBookings: number;
  conflictCount: number;
}

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
  bookingData: Promise<{ events: Array<CalendarEvent> }>;
}) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const data = use(bookingData);
  console.log('Booking Data on the Client: ', data);

  // Fetch calendar data
  const fetchCalendarData = async () => {
    try {
      const response = await fetch('/api/calendar');
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      const data = await response.json();
      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Sync all properties
  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ syncAll: true }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Sync completed! ${result.summary.totalNewBookings} new bookings, ${result.summary.totalUpdatedBookings} updated`
        );
        // Refresh calendar data
        await fetchCalendarData();
      } else {
        toast.error('Some syncs failed. Check individual property status.');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Failed to sync properties');
    } finally {
      setSyncing(false);
    }
  };

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    if (!calendarData) return [];

    return calendarData.events.filter((event) => {
      const propertyMatch =
        propertyFilter === 'all' ||
        event.resource.propertyId === propertyFilter;
      const platformMatch =
        platformFilter === 'all' || event.resource.platform === platformFilter;
      return propertyMatch && platformMatch;
    });
  }, [calendarData, propertyFilter, platformFilter]);

  // Get unique properties and platforms for filters
  const { uniqueProperties, uniquePlatforms } = useMemo(() => {
    if (!calendarData) return { uniqueProperties: [], uniquePlatforms: [] };

    const properties = Array.from(
      new Set(calendarData.events.map((event) => event.resource.propertyId))
    ).map((id) => {
      const event = calendarData.events.find(
        (e) => e.resource.propertyId === id
      );
      return { id, name: event?.resource.propertyName || 'Unknown' };
    });

    const platforms = Array.from(
      new Set(calendarData.events.map((event) => event.resource.platform))
    );

    return { uniqueProperties: properties, uniquePlatforms: platforms };
  }, [calendarData]);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const isConflicted = calendarData?.conflicts.some((conflict) =>
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

  // Load data on component mount
  useEffect(() => {
    fetchCalendarData();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Loader2Icon className='w-8 h-8 animate-spin' />
        <span className='ml-2'>Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4`}>
      {/* Header with controls */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center space-x-4'>
          <h2 className='text-2xl font-bold'>Property Calendar</h2>
          {calendarData && (
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <span>{calendarData.totalBookings} bookings</span>
              {calendarData.conflictCount > 0 && (
                <span className='flex items-center text-red-600'>
                  <AlertTriangleIcon className='w-4 h-4 mr-1' />
                  {calendarData.conflictCount} conflicts
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleSyncAll}
          disabled={syncing}
          className='flex items-center space-x-2'>
          <RefreshCwIcon
            className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
          />
          <span>{syncing ? 'Syncing...' : 'Sync All'}</span>
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-4'>
        <div className='flex items-center space-x-2'>
          <label className='text-sm font-medium'>Property:</label>
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className='border rounded px-2 py-1 text-sm'>
            <option value='all'>All Properties</option>
            {uniqueProperties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        <div className='flex items-center space-x-2'>
          <label className='text-sm font-medium'>Platform:</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className='border rounded px-2 py-1 text-sm'>
            <option value='all'>All Platforms</option>
            {uniquePlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conflicts Alert - To be removed in new separate component (Or better fully redesinged) */}
      {calendarData && calendarData.conflicts.length > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <AlertTriangleIcon className='w-5 h-5 text-red-500' />
            <h3 className='font-semibold text-red-800'>
              Booking Conflicts Detected
            </h3>
          </div>
          <div className='space-y-2'>
            {calendarData.conflicts.map((conflict) => (
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
          events={filteredEvents}
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
