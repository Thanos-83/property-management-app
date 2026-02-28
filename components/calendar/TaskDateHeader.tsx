import { CalendarEvent } from "@/types/bookingTypes";
import { AlertTriangle, Sparkles, Wrench } from "lucide-react";
import { memo } from "react";
import { isSameDay, areIntervalsOverlapping } from "date-fns";

interface TaskDateHeaderProps {
  label: string;
  date: Date;
  tasks: CalendarEvent[];
  bookings: CalendarEvent[];
  onOpenDayOverview?: (state: { isOpen: boolean; date: Date | null; events: CalendarEvent[] }) => void;
}

export const TaskDateHeader = memo(({ label, date, tasks, bookings,onOpenDayOverview }: TaskDateHeaderProps) => {
  // Filter tasks for this specific date
  const dayTasks = tasks.filter(t => isSameDay(new Date(t.start), date));

  // DETECT CONFLICTS FOR THIS DAY
  // We check if ANY booking on this day overlaps with another booking on the same property
  const hasConflictOnDay = bookings.some((b1) => {
    // Is b1 relevant to this day?
    const start1 = new Date(b1.start);
    const end1 = new Date(b1.end);
    if (!areIntervalsOverlapping({ start: start1, end: end1 }, { start: date, end: date }, { inclusive: true })) {
      return false; 
    }

    // Does b1 conflict with any b2?
    return bookings.some(b2 => 
      b1.id !== b2.id &&
      b1.resource.propertyId === b2.resource.propertyId && // Same Property
      areIntervalsOverlapping(
        { start: start1, end: end1 },
        { start: new Date(b2.start), end: new Date(b2.end) },
        { inclusive: false }
      )
    );
  });

  return (
    <>
      <div className="flex items-center px-2 py-1">
        {/* The Date Number (Now Clickable to open Day Overview) */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (onOpenDayOverview) onOpenDayOverview({ isOpen: true, date: date, events: dayTasks }); 
          }}
          className="font-semibold text-gray-700 text-sm hover:underline hover:text-primary transition-colors cursor-pointer"
        >
          {label}
        </button>
        
        {/* THE CRITICAL ALERT */}
        {hasConflictOnDay && (
          <div 
            className=" ml-2 bg-red-100 text-red-600 p-0.5 rounded-full border border-red-200 animate-pulse"
            title="Critical: Conflicts detected on this day"
          >
            <AlertTriangle className="w-3 h-3" />
          </div>
        )}
        
        {/* The Task Icons */}
        <div className="flex gap-1 flex-wrap justify-end max-w-[70%] ml-auto">
          {dayTasks.map(task => (
            <button 
              key={task.id} 
              className="bg-white border border-gray-200 rounded-full p-1.5 shadow-sm transform hover:scale-110 transition-transform" 
              title={`${task.resource.taskType} - ${task.status}`} 
              onClick={(e) => {
                e.stopPropagation(); // Prevents triggering the day-cell drilldown twice
                if (onOpenDayOverview) onOpenDayOverview({ isOpen: true, date: date, events: dayTasks }); // Restored opening the Day Overview!
              }}
            >
              {task.resource.taskType === 'Cleaning' && <Sparkles className="w-3 h-3 text-purple-600" />}
              {(task.resource.taskType === 'Maintenance' || !task.resource.taskType || task.resource.taskType !== 'Cleaning') && 
                <Wrench className="w-3 h-3 text-orange-600" />
              }
            </button>
          ))}
        </div>
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  // Return true = props equal = skip re-render
  // Return false = props changed = re-render

  // Label changes when calendar navigates to a new month (cell labels shift)
  if (prevProps.label !== nextProps.label) return false;

  // react-big-calendar creates new Date instances on every render,
  // so compare by value using isSameDay, not by reference.
  if (!isSameDay(prevProps.date, nextProps.date)) return false;

  // Tasks and Bookings: reference equality works when the parent stabilises
  // these arrays with useMemo.
  if (prevProps.tasks !== nextProps.tasks) return false;
  if (prevProps.bookings !== nextProps.bookings) return false;

  return true;
});

TaskDateHeader.displayName = 'TaskDateHeader';