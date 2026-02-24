'use client';

import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarEvent } from "@/types/bookingTypes";
import { Sparkles, Wrench, AlertTriangle, Home, CheckCircle2, Clock, Calendar as CalendarIcon, CalendarRange, User, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TaskStatusOption } from "@/types/taskTypes";
import { capitalizeFirstLetter } from "@/lib/heplers";

interface DayOverviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  taskStatus: TaskStatusOption[];
  onAddTask?: (date: Date) => void;
}

const platformIcons: Record<string, string> = {
  Airbnb: '/icons/airbnb.svg',
  Booking: '/icons/booking.svg',
  Vrbo: '/icons/vrbo.svg',
  Expedia: '/icons/expedia.svg',
};

// Helper for Booking Status Badge Styling
const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-secondary text-secondary-foreground border-border';
  }
};

export function DayOverviewDialog({ isOpen, onClose, date, events, onSelectEvent, taskStatus, onAddTask }: DayOverviewDialogProps) {
  if (!date) return null;

  const bookings = events.filter(e => e.type === 'booking');
  const tasks = events.filter(e => e.type === 'task');
  const hasMultipleBookings = bookings.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-background">
        
        {/* --- DYNAMIC HEADER --- */}
        <DialogHeader className="p-6 bg-card border-b border-border">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {format(date, "EEEE")}
            </span>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
              {format(date, "MMMM d, yyyy")}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Overview of events and tasks for this day.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 pt-2 pb-6 flex flex-col">

            {/* --- SECTION A: BOOKINGS --- */}
            {bookings.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Scheduled Bookings
                    <span className="bg-secondary text-secondary-foreground py-0.5 px-2 rounded-full text-xs font-bold">
                      {bookings.length}
                    </span>
                  </h3>
                  
                  {hasMultipleBookings && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold shadow-sm border border-destructive/20">
                      <AlertTriangle className="w-3.5 h-3.5" /> Conflict
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  {bookings.map(event => {
                    const platform = event.resource?.platform || 'Direct';
                    const guestName = event.resource?.guestName || event.resource?.originalData?.guest_name || "Unknown Guest";
                    const propertyName = event.resource?.propertyName || event.resource?.originalData?.properties?.title || "Unknown Property";
                    const status = event.resource?.originalData?.status || 'Confirmed';
                    const icon = platformIcons[platform];

                    return (
                      <div 
                        key={event.id}
                        onClick={() => { onClose(); onSelectEvent(event); }}
                        className={`
                          group relative flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm cursor-pointer transition-all hover:shadow-md
                          ${hasMultipleBookings ? 'border-destructive/30 ring-1 ring-destructive/10' : 'border-border hover:border-primary/30'}
                        `}
                      >
                        {/* THE ACCENT LINE */}
                        {hasMultipleBookings && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-destructive rounded-l-xl" />
                        )}

                        <div className="flex items-start gap-4 pl-2 min-w-0 w-full">
                          {/* PLATFORM AVATAR */}
                          <div className="w-10 h-10 rounded-full border border-border bg-muted/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden mt-0.5">
                            {icon ? (
                               <Image src={icon} alt={platform} width={20} height={20} className="object-contain" />
                            ) : (
                               <Home className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* DATA */}
                          <div className="flex flex-col justify-center min-w-0 flex-1 pr-4">
                            
                            {/* Row 1: Name & Status Badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-foreground text-sm leading-none truncate max-w-[160px] sm:max-w-[200px]">
                                {guestName}
                              </h4>
                              <Badge className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(status)}`}>
                                {status}
                              </Badge>
                            </div>

                            {/* Row 2: Property & Dates */}
                            <div className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground mt-1">
                              <span className="truncate">{propertyName}</span>
                              <div className="flex items-center gap-1.5 text-foreground/80">
                                <CalendarRange className="w-3 h-3 text-muted-foreground" />
                                <span>{format(new Date(event.start), 'MMM d, yyyy')}</span>
                                <span className="text-muted-foreground/50 mx-0.5">→</span>
                                <span>{format(new Date(event.end), 'MMM d, yyyy')}</span>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <div className="shrink-0 pl-2 self-center">
                          <Button 
                            variant={hasMultipleBookings ? "destructive" : "secondary"} 
                            size="sm" 
                            className={`h-9 text-xs font-bold rounded-lg px-4 ${hasMultipleBookings ? 'shadow-sm shadow-destructive/20' : ''}`}
                          >
                            {hasMultipleBookings ? 'Resolve' : 'View'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- SECTION B: TASKS --- */}
            {tasks.length > 0 && (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Scheduled Tasks
                    <span className="bg-secondary text-secondary-foreground py-0.5 px-2 rounded-full text-xs font-bold">
                      {tasks.length}
                    </span>
                  </h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs font-bold"
                    onClick={() => {
                      onClose();
                      if (date && onAddTask) onAddTask(date);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Task
                  </Button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {tasks.map(event => {
                    const taskType = event.resource?.taskType || 'Maintenance';
                    const isCleaning = taskType === 'Cleaning';
                    const propertyName = event.resource?.propertyName || event.resource?.originalData?.properties?.title || "Unknown Property";
                    const assignee = event.resource?.originalData?.teamMember ? event.resource?.originalData?.teamMember?.first_name + ' ' + event.resource?.originalData?.teamMember?.last_name : 'Unassigned';
                    const status = event.status || 'pending';
                    const isCompleted = status === 'completed';

                    // --- DYNAMIC DATABASE COLOR LOGIC ---
                    const currentStatusObj = taskStatus?.find((s: any) => s.status?.toLowerCase().trim() === status.toLowerCase().trim());
                    const currentStatusColor = currentStatusObj?.status_color;

                    return (
                      <div 
                        key={event.id}
                        className="group relative flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm transition-all hover:shadow-md border-border hover:border-primary/30"
                      >
                        <div className="flex items-start gap-4 pl-2 min-w-0 w-full">
                          {/* TASK AVATAR */}
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5 border
                            ${isCleaning ? 'bg-primary/10 text-primary border-primary/20' : 'bg-chart-2/10 text-chart-2 border-chart-2/20'}
                          `}>
                            {isCleaning ? <Sparkles className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                          </div>

                          {/* DATA */}
                          <div className="flex flex-col justify-center min-w-0 flex-1 pr-4">
                            {/* Row 1: Title & Status Badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-foreground text-sm truncate max-w-[160px] sm:max-w-[200px]">
                                {capitalizeFirstLetter(event.title)}
                              </h4>
                              {/* --- UPDATED: Dynamic Inline Colors --- */}
                              <Badge 
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm"
                                style={currentStatusColor ? {
                                  backgroundColor: currentStatusColor + '1a', 
                                  color: currentStatusColor,
                                  borderColor: currentStatusColor + '33' 
                                } : {}}
                              >
                                {status.replace('_', ' ')}
                              </Badge>
                            </div>

                            {/* Row 2: Property & Assignee */}
                            <div className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground mt-1">
                              <div className="flex items-center gap-1.5 text-foreground/80">
                                <Home className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate">{propertyName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                {/* Tinted icons to match database status color */}
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3 h-3" style={currentStatusColor ? { color: currentStatusColor } : {}} />
                                ) : (
                                  <Clock className="w-3 h-3" style={currentStatusColor ? { color: currentStatusColor } : {}} />
                                )}
                                <span className="truncate">{assignee}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ACTION BUTTONS (Inline Quick Actions) */}
                        <div className="shrink-0 pl-2 self-center flex items-center gap-1.5">
                          <Button 
                            type="button"
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-3 text-xs font-bold shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onSelectEvent(event);
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* --- EMPTY STATE --- */}
            {events.length === 0 && (
               <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                 <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                 </div>
                 <h4 className="text-sm font-bold text-foreground">No events</h4>
                 <p className="text-xs text-muted-foreground mt-1">Your schedule is clear for this day.</p>
               </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}