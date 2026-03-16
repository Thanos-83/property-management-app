'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isToday, isBefore, isAfter, startOfDay } from 'date-fns';

interface TeamTasksClientProps {
  initialTasks: any[];
}

export function TeamTasksClient({ initialTasks }: TeamTasksClientProps) {
  const router = useRouter();

  // --- SORT TASKS INTO BUCKETS INSTANTLY ---
  const { todayTasks, upcomingTasks, completedTasks } = useMemo(() => {
    const today: any[] = [];
    const upcoming: any[] = [];
    const completed: any[] = [];
    const now = startOfDay(new Date());

    initialTasks.forEach(task => {
      // First, check if the task is completely done
      if (task.status === 'completed') {
        completed.push(task);
        return; // Skip date checks if it's already done
      }

      // If not completed, sort it by date
      const taskDate = startOfDay(new Date(task.scheduled_date));
      
      // If it's exactly today, OR it's a past date (Overdue)
      if (isToday(taskDate) || isBefore(taskDate, now)) {
        today.push(task);
      } 
      // If it's strictly in the future
      else if (isAfter(taskDate, now)) {
        upcoming.push(task);
      }
    });

    return { todayTasks: today, upcomingTasks: upcoming, completedTasks: completed };
  }, [initialTasks]);

  return (
    <Tabs defaultValue="today" className="w-full">
      {/* UPDATE: Added a third column for Completed */}
      <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50 h-10">
        <TabsTrigger value="today" className="text-xs">
          Today {todayTasks.length > 0 && `(${todayTasks.length})`}
        </TabsTrigger>
        <TabsTrigger value="upcoming" className="text-xs">
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="completed" className="text-xs">
          Completed
        </TabsTrigger>
      </TabsList>
      
      {/* TODAY TAB */}
      <TabsContent value="today" className="space-y-3">
        {todayTasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground flex flex-col items-center bg-white rounded-xl border border-dashed shadow-sm">
            <Sparkles className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">You're all caught up for today!</p>
          </div>
        ) : (
          todayTasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => router.push(`/member/tasks/${task.id}`)} />
          ))
        )}
      </TabsContent>
      
      {/* UPCOMING TAB */}
      <TabsContent value="upcoming" className="space-y-3">
        {upcomingTasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground flex flex-col items-center bg-white rounded-xl border border-dashed shadow-sm">
            <Calendar className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">No upcoming tasks scheduled yet.</p>
          </div>
        ) : (
            upcomingTasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => router.push(`/member/tasks/${task.id}`)} />
          ))
        )}
      </TabsContent>

      {/* COMPLETED TAB */}
      <TabsContent value="completed" className="space-y-3">
        {completedTasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground flex flex-col items-center bg-white rounded-xl border border-dashed shadow-sm">
            <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">No completed tasks yet.</p>
          </div>
        ) : (
            completedTasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => router.push(`/member/tasks/${task.id}`)} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

// Extracted Card Component
function TaskCard({ task, onClick }: { task: any, onClick: () => void }) {
  const isCleaning = task.type === 'Cleaning';
  const isCompleted = task.status === 'completed';
  const isHighPriority = task.priority === 3 || task.priority === '3';

  return (
    <Card 
      className={`active:scale-[0.98] transition-all cursor-pointer shadow-sm border ${isCompleted ? 'opacity-60 bg-muted/30' : 'bg-white hover:border-primary/30'}`} 
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge 
              variant="outline" 
              className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 shadow-sm border ${
                isCleaning ? 'bg-primary/10 text-primary border-primary/20' : 'bg-chart-2/10 text-chart-2 border-chart-2/20'
              }`}
            >
              {task.type}
            </Badge>
            {isHighPriority && !isCompleted && (
              <span className="text-[10px] font-bold text-destructive flex items-center">High Priority</span>
            )}
          </div>
          
          <h3 className={`font-bold text-base truncate mb-2 ${isCompleted ? 'text-muted-foreground line-through decoration-2' : 'text-foreground'}`}>
            {task.title || task.type}
          </h3>
          
          <div className="space-y-1">
            <div className="flex items-center text-[11px] font-medium text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span className="truncate">{task.property?.title || 'Unknown Property'}</span>
            </div>
            <div className="flex items-center text-[11px] font-medium text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>{format(new Date(task.scheduled_date), 'MMM d, yyyy • h:mm a')}</span>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 text-muted-foreground/50">
          <ChevronRight className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}