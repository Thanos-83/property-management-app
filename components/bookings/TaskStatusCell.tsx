'use client';

import { useState } from "react";
import moment from "moment";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { 
  Sparkles,      // Cleaning
  Wrench,        // Maintenance
  ClipboardCheck,// Inspection
  User,          // Meet & Greet
  HelpCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,         // Icon for "Multiple"
  Ban,
  Plus
} from "lucide-react";
import { Button } from "../ui/button";
import AddTaskModal from "../tasks/AddTaskModal";

// --- HELPER 1: Get Icon ---
const getTaskIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cleaning': return <Sparkles className="h-3 w-3" />;
    case 'maintenance': return <Wrench className="h-3 w-3" />;
    case 'inspection': return <ClipboardCheck className="h-3 w-3" />;
    case 'meet & greet': return <User className="h-3 w-3" />;
    default: return <HelpCircle className="h-3 w-3" />;
  }
};

// --- HELPER 2 & 3: Calculate Badge Content & Style based on Hierarchy ---
const calculateBadgeProps = (tasks: any[]) => {
  if (!tasks || tasks.length === 0) {
    return {
      style: "border-dashed border-gray-300 text-muted-foreground hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900",
      content: (
        <>
          <Plus className="h-3 w-3" />
          <span>Add Task</span>
        </>
      )
    };
  }

  const now = moment(new Date());
  const twoDaysFromNow = now.add(2, 'days').endOf('day');
  
  // 1. Check if ALL completed
  const allCompleted = tasks.every(t => t.status === 'completed');
  if (allCompleted) {
    return {
      style: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      content: (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>{tasks.length} Tasks</span>
          <span className="ml-1 opacity-70">(Complete)</span>
        </>
      )
    };
  }

  // Iterate to find worst case scenario
  let isCritical = false;  // Red (High Prio <= 2 Days)
  let isImportant = false; // Orange (High Prio > 2 Days)
  let isWarning = false;   // Yellow (Normal Prio <= 2 Days)
  let completedCount = tasks.filter(t => t.status === 'completed').length;

  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'cancelled') continue;

    const dueDate = task.scheduled_date ? moment(task.scheduled_date) : null;
    const isDueSoon = dueDate ? dueDate.isSameOrBefore(twoDaysFromNow, 'day') : false;
    const isHighPriority = task.priority === 3;

    // 🔴 Red: High Priority AND Due <= 2 Days
    if (isHighPriority && isDueSoon) {
      isCritical = true;
      break; // Worst case found
    }

    // 🟠 Orange: High Priority AND Due > 2 Days
    if (isHighPriority && !isDueSoon) {
      isImportant = true;
    }

    // � Yellow: Normal Priority AND Due <= 2 Days
    if (!isHighPriority && isDueSoon) {
      isWarning = true;
    }
  }

  const baseContent = (
    <>
      <span className="ml-1 opacity-80 text-[10px] font-semibold">
       {completedCount}/{tasks.length} Done
      </span>
    </>
  );

  if (isCritical) {
    return {
      style: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
      content: (
        <>
          <AlertCircle className="h-3 w-3 animate-pulse" />
          <span>{tasks.length} Tasks</span>
          {baseContent}
        </>
      )
    };
  }

  if (isImportant) {
    return {
      style: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
      content: (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>{tasks.length} Tasks</span>
          {baseContent}
        </>
      )
    };
  }

  if (isWarning) {
    return {
      style: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      content: (
        <>
          <Clock className="h-3 w-3" />
          <span>{tasks.length} Tasks</span>
          {baseContent}
        </>
      )
    };
  }

  // 🔵 ACTIVE (Routine/Scheduled) - Normal Priority > 2 Days (Default)
  return {
    style: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
    content: (
      <>
        <Layers className="h-3 w-3" />
        <span>{tasks.length} Tasks</span>
        {baseContent}
      </>
    )
  };
};


interface TaskStatusCellProps {
  tasks: any[];
  bookingId: string;      // Needed for the link
  bookingStatus: string;  // Needed to hide button if cancelled
  propertyId: string;
  guestName: string;
  propertyTitle: string;
}

export function TaskStatusCell({ tasks, bookingId, bookingStatus, propertyId, guestName, propertyTitle }: TaskStatusCellProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

   // --- SCENARIO 0: Booking is Cancelled (No tasks needed) ---
  if (bookingStatus === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground opacity-50 cursor-not-allowed">
        <Ban className="h-3 w-3" />
        <span>No tasks</span>
      </span>
    );
  }

  // Determine Badge Content based on hierarchy logic
  const { content: badgeContent, style: badgeStyle } = calculateBadgeProps(tasks);
// console.log('Tasks: ',tasks)
  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger onClick={(e) => e.stopPropagation()}>
          <Badge
            variant="outline"
            className={`flex w-fit cursor-pointer items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium transition-colors ${badgeStyle}`}
          >
            {badgeContent}
          </Badge>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="end" side="top" sideOffset={8} onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b bg-muted/50 flex justify-between items-center">
              <span>Task List</span>
              <span className="text-[10px] bg-background px-1.5 py-0.5 rounded border shadow-sm">
                  {tasks?.length || 0} Total
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
               {/* ... (task list rendering same as before) */}
               {tasks && tasks.length > 0 ? (
                  tasks.map((task) => (
                      <div
                      key={task.id}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors border-b last:border-0 group"
                      >
                      {/* Icon */}
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {getTaskIcon(task.type)}
                      </div>
                      
                      {/* Details */}
                      <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex items-center justify-between">
                              <span className="font-medium text-xs capitalize">{task.type}</span>
                              {task.priority === 3 ? <span className="text-[10px] text-red-600 font-bold">High</span> : task.priority === 2 ? <span className="text-[10px] text-[#fe9a00] font-bold">Medium</span> : <span className="text-[10px] text-green-600 font-bold">Low</span>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                  task.status === 'completed' ? 'bg-green-500' :
                                  task.status === 'in_progress' ? 'bg-blue-500' :
                                  'bg-amber-400'
                              }`} />
                              {task.status.replace('_', ' ')} 
                              <span className="text-gray-300">•</span>
                              {task.team_member ? (
                                <span className="text-foreground font-medium ">
                                  {task.team_member.first_name} {task.team_member.last_name?.charAt(0)}.
                                </span>
                              ) : task.team_member_id ? (
                                'Assigned'
                              ) : (
                                <span className="text-amber-600 font-medium">Unassigned</span>
                              )}
                              </span>
                              </div>
                              <div>
                                {task.scheduled_date && (() => {
                                  const date = moment(task.scheduled_date);
                                  const isToday = date.isSame(moment(), 'day');
                                  const tomorrow = date.isSame(moment().add(1, 'days'), 'day');
                                  const twoDaysFromNow = date.isSame(moment().add(2, 'days'), 'day');
                                  return (
                                    <span className={`text-[10px] capitalize flex items-center gap-1.5 ${isToday || tomorrow || twoDaysFromNow ? 'text-red-500 font-bold' : 'text-muted-foreground font-medium'}`}>
                                      {isToday ? 'Today' : tomorrow ? 'Tomorrow' : twoDaysFromNow ? 'In 2 Days' : date.format('D MMM YYYY')}
                                    </span>
                                  );
                                })()}
                              </div>
                          </div>
                      </div>
                      </div>
                  ))
               ) : (
                  <div className="p-6 text-center text-muted-foreground text-xs italic">
                      No tasks created yet.
                  </div>
               )}
            </div>

            <div className="p-2 border-t bg-muted/10">
               <Button 
                 variant="outline" 
                 className="w-full max-w-xs text-xs h-8" 
                 onClick={() => {
                   setPopoverOpen(false);
                   setModalOpen(true);
                 }}
               >
                 <Plus className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                 Create Task
               </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AddTaskModal 
        bookingId={bookingId} 
        propertyId={propertyId} 
        guestName={guestName}
        propertyTitle={propertyTitle} 
        open={modalOpen}
        onOpenChange={setModalOpen}
        hideTrigger={true}
      />
    </>
  );
}
