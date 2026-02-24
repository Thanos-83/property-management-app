// import { CalendarEvent } from '@/types/bookingTypes';
// import { Sparkles, Wrench, AlertTriangle, HomeIcon } from 'lucide-react';
// import Image from 'next/image';

// const platformColors: Record<string, string> = {
//   Airbnb: '#FF5A5F',
//   Booking: '#003580',
//   Vrbo: '#0066CC',
//   Expedia: '#FFC72C',
//   Unknown: '#6B7280',
// };

// const platformIcons: Record<string, string> = {
//   Airbnb: '/icons/airbnb.svg',
//   Booking: '/icons/booking.svg',
//   Vrbo: '/icons/vrbo.svg',
//   Expedia: '/icons/expedia.svg',
// };

// export const CustomEvent = ({ event }: { event: CalendarEvent }) => {
//   // console.log('Event: ', event);
//   // --- RENDER BOOKING ---
//   if (event.type === 'booking') {
//     const platform = event.resource.platform || 'Unknown';


//     const color = platformColors[platform] || platformColors.Unknown;
//     const isAirbnb = platform.toLowerCase().includes('airbnb');
//     const isBooking = platform.toLowerCase().includes('booking');
//     const isVrbo = platform.toLowerCase().includes('vrbo');
//     const isExpedia = platform.toLowerCase().includes('expedia');

//     let bgColor = 'bg-slate-500';
//     if (isAirbnb) bgColor = 'bg-[#FF5A5F]';
//     if (isBooking) bgColor = 'bg-[#003580]';
//     if (isVrbo) bgColor = 'bg-[#0066CC]';
//     if (isExpedia) bgColor = 'bg-[#FFC72C]';

//     const isConflicting = (event as any).isConflicting; // Passed via resource or pre-calculation
//     console.log('Event: ', event.id);
    
//     return (
//       <div
//         className={`
//           h-full w-[100%] mt-0.5 px-1.5 py-1 text-xs overflow-hidden text-white 
//           ${bgColor} bg-opacity-90 hover:bg-opacity-100 transition-opacity
//           ${isConflicting ? 'border-2 border-dashed border-red-500' : ''}
//         `}
//         title={`${event.title} (${platform}) ${isConflicting ? '- CONFLICT DETECTED' : ''}`}>
//         <div className='flex items-center gap-1.5 h-full'>         
//           {platformIcons[platform] ? (
//             <div className="bg-white/90 rounded-xs flex-shrink-0flex items-center justify-center">
//               <Image
//                 src={platformIcons[platform]}
//                 alt={platform}
//                 width={14}
//                 height={14}
//                 className='w-16 h-4 object-contain'
//               />
//             </div>
//           ) : (
//             <HomeIcon className="w-4 h-4 text-white" />
//           )}
//           <p className='font-medium truncate text-[12px]'>{event.title} | {event.resource.guestName ? event.resource.guestName : 'Unknown'}</p>
//            {/* Conflict Icon */}
//           {isConflicting && <AlertTriangle className="w-4 h-4 text-orange-700 animate-bounce" />}
//           <p className='text-[14px] text-white/80'>{event.id}</p>
//         </div>
//       </div>
//     );
//   }

//   // --- RENDER TASK ---
//   if (event.type === 'task') {
//     const isDone = event.status === 'completed';
//     // Default to Wrench if type is missing or not Cleaning
//     const Icon =
//       event.resource.taskType === 'Cleaning' ? Sparkles : Wrench;

//     return (
//       <div
//         className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shadow-sm ${
//           isDone
//             ? 'bg-green-100 border-green-300 text-green-800'
//             : 'bg-white border-red-200 text-red-800'
//         }`}
//         title={`${event.resource.taskType} - ${event.status}`}>
//         <Icon className='w-3 h-3' />
//         <span className='truncate hidden sm:inline'>{event.title}</span>
//       </div>
//     );
//   }

//   return null;
// };

// components/calendar/CustomEvent.tsx
import { CalendarEvent } from '@/types/bookingTypes';
import { Sparkles, Wrench, AlertTriangle, HomeIcon } from 'lucide-react';
import Image from 'next/image';

// --- CONFIGURATION ---
const platformColors: Record<string, string> = {
  Airbnb: '#FF5A5F',
  Booking: '#003580',
  Vrbo: '#0066CC',
  Expedia: '#FFC72C',
  Unknown: '#64748b', // Slate-500
};

const platformIcons: Record<string, string> = {
  Airbnb: '/icons/airbnb.svg',
  Booking: '/icons/booking.svg',
  Vrbo: '/icons/vrbo.svg',
  Expedia: '/icons/expedia.svg',
};

export const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  
  // ==================================================================
  // RENDER BOOKING
  // ==================================================================
  if (event.type === 'booking') {
    const platform = event.resource.platform || 'Unknown';
    
    // Determine Background Color
    // Default to the mapping, fallback to Unknown gray
    let bgColorClass = 'bg-slate-500';
    if (platform.toLowerCase().includes('airbnb')) bgColorClass = 'bg-[#FF5A5F]';
    else if (platform.toLowerCase().includes('booking')) bgColorClass = 'bg-[#003580]';
    else if (platform.toLowerCase().includes('vrbo')) bgColorClass = 'bg-[#0066CC]';
    else if (platform.toLowerCase().includes('expedia')) bgColorClass = 'bg-[#FFC72C]';

    // Conflict Logic
    const isConflicting = (event as any).isConflicting; 

    return (
      <div
        className={`
          h-full w-full px-1.5 py-1.5 mb-1 text-xs text-white rounded-[3px] shadow-sm
          ${bgColorClass} 
          ${isConflicting 
            ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)] border-2 border-yellow-300' 
            : 'hover:opacity-90 transition-opacity'
          }
        `}
        title={`${event.title} (${platform}) ${isConflicting ? '- CONFLICT DETECTED' : ''}`}
      >
        <div className='flex items-center gap-1.5 h-full'>         
          {/* Platform Icon */}
          {platformIcons[platform] ? (
            <div className="bg-white/90 rounded-[2px] p-0.5 flex-shrink-0 flex items-center justify-center h-3.5 w-3.5">
              <Image
                src={platformIcons[platform]}
                alt={platform}
                width={12}
                height={12}
                className='w-full h-full object-contain'
              />
            </div>
          ) : (
            <HomeIcon className="w-3.5 h-3.5 text-white/80" />
          )}

          {/* Text Content */}
          <div className="flex-1 min-w-0 flex items-center gap-1">
             <span className='font-semibold truncate text-[11px] leading-tight'>
               {event.title}
             </span>
             {/* Optional: Separator if name exists */}
             {event.resource.guestName && (
               <span className="opacity-60 text-[10px] hidden sm:inline">| {event.resource.guestName}</span>
             )}
             <span className='truncate hidden sm:inline font-medium'>{event.resource.originalData.id}</span>
          </div>

          {/* Conflict Warning Icon */}
          {isConflicting && (
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-300 animate-pulse flex-shrink-0" />
          )}
        </div>
      </div>
    );
  }

  // ==================================================================
  // RENDER TASK
  // ==================================================================
  if (event.type === 'task') {
    const isDone = event.status === 'completed';
    // Default to Wrench if type is missing or not Cleaning
    const Icon = event.resource.taskType === 'Cleaning' ? Sparkles : Wrench;

    return (
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border shadow-sm w-fit max-w-full ${
          isDone
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-white border-rose-200 text-rose-700'
        }`}
        title={`${event.resource.taskType} - ${event.status}`}
      >
        <Icon className='w-3 h-3 flex-shrink-0' />
        <span className='truncate hidden sm:inline font-medium'>{event.title}</span>
        <span className='truncate hidden sm:inline font-medium'>{event.resource.originalData.booking_id}</span>
      </div>
    );
  }

  return null;
};
