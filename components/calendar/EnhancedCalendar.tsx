'use client';

import React, { useState, use, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { CalendarData, CalendarEvent } from '@/types/bookingTypes';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CustomEvent } from './CustomEvent';
import { BookingDetailsSheet } from '../bookings/BookingDetailsSheet';
import { TableBooking } from '@/types/bookingTypes';
import { DayOverviewDialog } from './DayOverviewDialog';
import { isSameDay } from 'date-fns';
import { isBookingConflicting } from '@/lib/utils/calendarUtils';
import { TaskDateHeader } from './TaskDateHeader';
import { TaskDetailsSheet } from './TaskDetailsSheet';
import { DetailedTask, TaskStatusOption } from '@/types/taskTypes';
import FilterCalendarData from './FilterCalendarData';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

const localizer = momentLocalizer(moment);

const platformColors: Record<string, string> = {
  Airbnb: '#FF5A5F',
  Booking: '#003580',
  Vrbo: '#0066CC',
  Expedia: '#FFC72C',
  Unknown: '#6B7280',
};

// const platformIcons: Record<string, string> = {
//   Airbnb: '/icons/airbnb.svg',
//   Booking: '/icons/booking.svg',
//   Vrbo: '/icons/vrbo.svg',
//   Expedia: '/icons/expedia.svg',
// };

export default function EnhancedCalendar({
  bookingData,
  properties,
  taskStatusData,
  taskPrioritiesData,
  taskMembersData,
  currentUserId,
  currentUserInfo,
  filterOptionsData,
}: {
  bookingData: Promise<CalendarData>;
  properties: any[];
  taskStatusData: TaskStatusOption[];
  taskPrioritiesData: any[];
  taskMembersData: any[];
  currentUserId: string;
  currentUserInfo: any;
  filterOptionsData: any[];
}) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // State for Booking Sheet
  const [selectedBooking, setSelectedBooking] = useState<TableBooking | null>(
    null,
  );
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);

  // State for Task Modal
  const [selectedTask, setSelectedTask] = useState<DetailedTask | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  // State for prefilling the task date
  // const [taskPrefilledDate, setTaskPrefilledDate] = useState<Date | null>(null);

  // State for Booking Conflicting
  const [isSelectedBookingConflicting, setIsSelectedBookingConflicting] =
    useState(false);

  // State for the Day Dialog
  const [dayDialogState, setDayDialogState] = useState<{
    isOpen: boolean;
    date: Date | null;
    events: CalendarEvent[];
  }>({ isOpen: false, date: null, events: [] });

  // Add the Handler for the show more button
  const handleShowMore = (events: any[], date: Date) => {
    // Fetch ALL events (tasks + bookings) for this day
    console.log('Events in show more: ', events);
    console.log('Date in show more: ', date);
    console.log('Data in show more: ', data);
    const allEvents = 'events' in data ? data.events || [] : [];
    const dailyEvents = allEvents.filter((event) =>
      isSameDay(new Date(event.start), date),
    );
    console.log('Daily events in show more: ', dailyEvents);
    setDayDialogState({
      isOpen: true,
      date: date,
      // events: dailyEvents as CalendarEvent[]
      events: events as CalendarEvent[],
    });
  };

  const data = use(bookingData);

  console.log('Booking Data in Enhanced Calendar: ', data);

  // console.log('Events data: ', data.events[0])
  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'booking') {
      // Transform originalData to match TableBooking (property vs properties)
      const bookingData = event.resource.originalData;
      const tableBooking: TableBooking = {
        ...bookingData,
        property: bookingData.properties, // Map 'properties' to 'property'
      };
      setSelectedBooking(tableBooking);
      setIsSelectedBookingConflicting((event as any).isConflicting || false);
      setIsBookingSheetOpen(true);
    } else if (event.type === 'task') {
      console.log('Selected Task: ', event.resource.originalData);
      setSelectedTask(event.resource.originalData);
      setIsTaskSheetOpen(true);
    }
  };

  // THE FIX: Custom Handler for "Drill Down" events
  const handleDrillDown = useCallback(
    (date: Date) => {
      // 1. Manually find the events for this specific day
      // (We have to do this because onDrillDown only gives us the date, not the events list)
      const events = 'events' in data ? data.events || [] : [];

      const dailyEvents = events.filter((event) =>
        isSameDay(new Date(event.start), date),
      );

      // 2. Open YOUR Dialog
      setDayDialogState({
        isOpen: true,
        date: date,
        events: dailyEvents,
      });

      // 3. Do NOT navigate anywhere. The function ends here.
    },
    [data],
  );

  // Separate events for Grid (Bookings) and Header (Tasks)
  const { tasks, bookings } = useMemo(() => {
    const allEvents = data && 'events' in data ? data.events || [] : [];

    // Tasks go to the header
    const t = allEvents.filter((e) => e.type === 'task');

    // Bookings go to the grid
    const onlyBookings = allEvents.filter((e) => e.type === 'booking');
    // We also calculate conflicts here to pass down via the event object wrapper
    const b = onlyBookings.map((item) => ({
      ...item,
      isConflicting: isBookingConflicting(item, onlyBookings),
    }));

    return { tasks: t, bookings: b };
  }, [data]);

  // Moved handleOpenCreateTask UP and added the date parameter
  const handleOpenCreateTask = useCallback((passedDate?: Date) => {
    setSelectedTask(null);
    // setTaskPrefilledDate(passedDate || new Date()); // Store the passed date or default to today
    setDayDialogState((prev) => ({ ...prev, date: passedDate || new Date() }));
    setIsTaskSheetOpen(true);
  }, []);

  // Define the DateHeader component here to close over 'tasks'
  const components = useMemo(
    () => ({
      event: CustomEvent,
      month: {
        dateHeader: ({ label, date }: { label: string; date: Date }) => (
          <TaskDateHeader
            label={label}
            date={date}
            tasks={tasks}
            bookings={bookings}
            onOpenDayOverview={setDayDialogState}
          />
        ),
      },
    }),
    [tasks, bookings, handleDrillDown, handleOpenCreateTask],
  );
  return (
    <div className={`space-y-4`}>
      <div className='flex items-center justify-between mb-4'>
        <FilterCalendarData filterOptionsData={filterOptionsData} />
        <Button
          onClick={() => handleOpenCreateTask()}
          className='font-bold shadow-sm'>
          <Plus className='w-4 h-4 mr-2' />
          New Task
        </Button>
      </div>
      {/* Calendar */}
      <div
        className='group-has-[[data-pending]]:animate-pulse bg-white rounded-md border p-2'
        style={{ maxHeight: 'calc(100vh + 100px)' }}>
        <Calendar
          localizer={localizer}
          events={bookings} // ONLY show Bookings in the main grid
          startAccessor='start'
          endAccessor='end'
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          components={components}
          onSelectEvent={handleSelectEvent}
          popup={false}
          drilldownView={null}
          onDrillDown={handleDrillDown}
          onShowMore={(events, date) => handleShowMore(events, date)}
          eventPropGetter={(event: CalendarEvent) => {
            if (event.type === 'task') return {};
            const platform = event.resource.platform || 'Unknown';
            const color = platformColors[platform] || platformColors.Unknown;
            return {
              style: {
                backgroundColor: color + '40',
                borderColor: color,
                color: '#000',
              },
            };
          }}
        />
      </div>

      {/* Booking Details Sheet */}
      <BookingDetailsSheet
        booking={selectedBooking}
        isOpen={isBookingSheetOpen}
        onOpenChange={setIsBookingSheetOpen}
        properties={properties}
        isConflicting={isSelectedBookingConflicting}
      />

      {/* Task Details Sheet */}

      <TaskDetailsSheet
        task={selectedTask}
        isOpen={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        properties={properties}
        teamMembers={taskMembersData}
        taskStatus={taskStatusData}
        taskPriorities={taskPrioritiesData}
        currentUserId={currentUserId}
        currentDate={dayDialogState.date || new Date()}
        mode={selectedTask ? 'edit' : 'create'}
        currentUserInfo={currentUserInfo}
      />

      <DayOverviewDialog
        isOpen={dayDialogState.isOpen}
        onClose={() =>
          setDayDialogState((prev) => ({ ...prev, isOpen: false }))
        }
        date={dayDialogState.date}
        events={dayDialogState.events}
        onSelectEvent={handleSelectEvent}
        taskStatus={taskStatusData}
        onAddTask={handleOpenCreateTask}
      />
    </div>
  );
}
