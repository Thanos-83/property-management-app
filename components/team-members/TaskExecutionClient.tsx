'use client';

import React, { useState, useOptimistic, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Calendar, CheckCircle2, Circle, Camera, Loader2, Sparkles, Wrench, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { toggleChecklistItemAction, completeAssignedTaskAction, uploadTaskAttachmentRecordAction } from '@/lib/actions/teamMemberActions';
import { createClient } from '@/lib/utils/supabase/client';
import Image from 'next/image';
import { TaskCommentsSheet } from './TaskCommentsSheet';
import { MessageSquare } from 'lucide-react';

interface TaskExecutionClientProps {
  initialTask: any;
}

interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  activity_type: string;
  content: string;
  created_at: string;
}

export function TaskExecutionClient({ initialTask }: TaskExecutionClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // --- NEW: CHAT STATES ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [baseActivities, setBaseActivities] = useState<TaskActivity[]>([]);

  // Fetch their ID so we know which messages are "Me" vs "Manager"
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await createClient().auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
    setBaseActivities(initialTask.task_activity.filter((a: TaskActivity) => a.activity_type === 'user_comment').sort((a: TaskActivity, b: TaskActivity) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []);
  }, [initialTask]);



  // --- OPTIMISTIC CHECKLIST UI ---
  // This makes the checkboxes feel instant on mobile, even if the network is slow.
  const [optimisticTodos, toggleOptimisticTodo] = useOptimistic(
    initialTask.taskTodos || [],
    (state: any[], todoId: string) => {
      return state.map(todo => 
        todo.id === todoId ? { ...todo, is_completed: !todo.is_completed } : todo
      );
    }
  );

  const isCleaning = initialTask.type === 'Cleaning';
  const isTaskDone = initialTask.status === 'completed';
  const doneCount = optimisticTodos.filter((t: any) => t.is_completed).length;
  const totalCount = optimisticTodos.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // --- HANDLERS ---

  const handleToggleTodo = (todoId: string, currentStatus: boolean) => {
    if (isTaskDone) return; // Prevent edits if task is already complete
    
    // 1. Instant UI update
    startTransition(async () => {
      toggleOptimisticTodo(todoId);
      // 2. Server update
      const res = await toggleChecklistItemAction(todoId, !currentStatus, initialTask.id);
      if (!res.success) {
        toast.error("Failed to update item");
      }
    });
  };

  const handleCompleteTask = async () => {
    if (totalCount > 0 && doneCount < totalCount) {
      const confirm = window.confirm("You haven't completed all checklist items. Are you sure you want to finish this task?");
      if (!confirm) return;
    }

    setIsCompleting(true);
    const res = await completeAssignedTaskAction(initialTask.id);
    console.log('Task completed response: ', res)
    if (res.success) {
      toast.success("Task completed! Great job.");
      router.push('/member/tasks');
    } else {
      toast.error(res.error || "Failed to complete task");
      setIsCompleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be less than 5MB");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading photo...");

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task_attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task_attachments')
        .getPublicUrl(fileName);

      const res = await uploadTaskAttachmentRecordAction(initialTask.id, publicUrl, file.name, file.type);
      
      if (res.success) {
        toast.success("Photo added!", { id: toastId });
        router.refresh();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-24">
      
      {/* --- STICKY HEADER --- */}
      <header className="bg-white border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/member/tasks')} className="h-8 w-8 -ml-2 text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="font-bold text-base text-foreground truncate max-w-[200px]">
            {initialTask.title || initialTask.type}
          </div>
          
          <div className="flex items-center gap-2">
            {/* NEW: Chat Icon Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-8 w-8 text-muted-foreground hover:bg-muted/50 rounded-full"
              onClick={() => setIsCommentsOpen(true)}
            >
              <MessageSquare className="w-5 h-5" />
              {baseActivities.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                  {baseActivities.length}
                </span>
              )}
            </Button>

            <Badge variant={isTaskDone ? "secondary" : "outline"} className={`text-[10px] uppercase font-bold tracking-wider ${isTaskDone ? 'bg-status-completed/10 text-status-completed border-status-completed/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
              {initialTask.status}
            </Badge>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {totalCount > 0 && (
          <div className="w-full bg-muted h-1.5">
            <div 
              className={`h-full transition-all duration-500 ease-out ${progressPercent === 100 ? 'bg-status-completed' : 'bg-primary'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* INFO CARD */}
        <Card className="shadow-sm border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 border-b border-border pb-3">
               <div className={`p-2 rounded-lg border shadow-sm ${isCleaning ? 'bg-primary/10 text-primary border-primary/20' : 'bg-chart-2/10 text-chart-2 border-chart-2/20'}`}>
                  {isCleaning ? <Sparkles className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{initialTask.property?.title || 'Unknown Property'}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {initialTask.property?.location || 'No location'}
                  </p>
                </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> 
                {initialTask.scheduled_date ? format(new Date(initialTask.scheduled_date), 'EEEE, MMM do') : 'No Date'}
              </span>
              {initialTask.priority >= 3 && (
                <span className="text-xs font-bold text-destructive flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-sm">
                  <AlertCircle className="w-3 h-3" /> High Priority
                </span>
              )}
            </div>

            {initialTask.notes && (
              <div className="mt-3 p-3 bg-muted/30 rounded-md border border-border/50 text-sm text-foreground">
                <span className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Notes / Instructions</span>
                {initialTask.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CHECKLIST CARD */}
        {optimisticTodos.length > 0 && (
          <Card className="shadow-sm border-border">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-border bg-muted/10 flex justify-between items-center">
                <span className="font-bold text-sm text-foreground">Checklist</span>
                <span className="text-xs font-bold text-muted-foreground">{doneCount} of {totalCount}</span>
              </div>
              <div className="flex flex-col">
                {optimisticTodos.map((todo: any) => (
                  <div 
                    key={todo.id} 
                    onClick={() => handleToggleTodo(todo.id, todo.is_completed)}
                    className="flex items-start gap-3 p-4 border-b border-border last:border-0 active:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="mt-0.5 shrink-0">
                      {todo.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-status-completed transition-transform scale-110" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <span className={`text-sm leading-snug transition-all ${todo.is_completed ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                      {todo.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PHOTOS & ATTACHMENTS CARD */}
        <Card className="shadow-sm border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm text-foreground">Photos & Proof</span>
              
              {/* HIDDEN FILE INPUT. 'capture="environment"' forces the back camera on mobile phones! */}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              {!isTaskDone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs font-bold shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Camera className="w-3 h-3 mr-1.5" />}
                  Take Photo
                </Button>
              )}
            </div>

            {initialTask.attachments && initialTask.attachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {initialTask.attachments.map((file: any) => (
                  <div key={file.id} className="relative aspect-square rounded-md overflow-hidden border border-border shadow-sm bg-muted">
                     {file.file_type?.startsWith('image/') ? (
                        <Image src={file.file_url} alt="Proof" fill className="object-cover" />
                     ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-1 text-center">Doc</div>
                     )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-md bg-muted/10">
                <Camera className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No photos uploaded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      {/* --- STICKY BOTTOM ACTION --- */}
      {!isTaskDone && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe z-20">
          <Button 
            className="w-full font-bold h-12 text-lg shadow-sm" 
            size="lg"
            disabled={isCompleting}
            onClick={handleCompleteTask}
          >
            {isCompleting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Completing...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Mark as Completed</>
            )}
          </Button>
        </div>
      )}

      {/* COMMENTS SLIDE SHEET (MOBILE BOTTOM DRAWER) */}
      <TaskCommentsSheet 
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={baseActivities}
        currentUserId={currentUserId}
        task={initialTask}
      />
    </div>
  );
}