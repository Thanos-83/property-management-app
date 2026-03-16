'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { addTaskCommentAction } from '@/lib/actions/taskActions';
import { toast } from 'sonner';
import { useOptimistic } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { useRouter } from 'next/navigation';
interface TaskCommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: any[];
  currentUserId: string | null;
  task: any | null;
}

interface OptimisticComment {
  id: string;
  activity_type: string;
  content: string;
  created_at: string;
  user_id: string | null;
  task_id: string;
  isPending?: boolean;
}

export function TaskCommentsSheet({ 
  isOpen, 
  onClose, 
  comments, 
  currentUserId, 
  task
}: TaskCommentsSheetProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [optimisticComments, setOptimisticComments] = useOptimistic<OptimisticComment[], OptimisticComment>(comments || [], (state, newComment) => [...state, newComment]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // setTaskComments(comments);
  }, [comments, isOpen]);


    // --- REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!task?.id || !isOpen) return;

    const supabase = createClient();
    const channel = supabase.channel(`team-comments-${task.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'task_activity', 
        filter: `task_id=eq.${task.id}` 
      }, (payload) => {
        // If the host sent a message, refresh the server data!
        if (payload.new.user_id !== currentUserId) {
          router.refresh();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [task?.id, isOpen, currentUserId, router]);



  console.log('Task Comments: ', optimisticComments)
  // --- COMMENT SUBMIT HANDLER USING USE-OPTIMISTIC ---
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setIsSubmittingComment(true);
    const textToSubmit = text;
 
    const optimisticComment = {
      id: crypto.randomUUID(), 
      activity_type: 'user_comment',
      content: text,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      task_id: task.id,
      isPending: true,
    };

    startTransition(async () => setOptimisticComments(optimisticComment));
    const res = await addTaskCommentAction(task.id, textToSubmit);
      console.log('Response adding comment: ', res)
      // 3. Handle failure
      if (res?.error) {
        toast.error(res.error || "Failed to add comment");
        setText(textToSubmit);  
        setIsSubmittingComment(false);
      }else {
        if(text) {
          setText('');
        }
        setIsSubmittingComment(false);  
      }
    };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* side="bottom" and h-[85vh] creates a native-feeling mobile drawer */}
      <SheetContent side="right" className="h-[100vh] w-[100vw] !max-w-[500px] p-0 flex flex-col bg-slate-50 border-t border-border z-[100]">
        
        <SheetHeader className="p-4 bg-white border-b border-border shrink-0 rounded-t-xl shadow-sm">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <MessageSquare className="w-5 h-5 text-primary" />
            Task Comments
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 overflow-y-auto h-[calc(100dvh-122px)]">
          {optimisticComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground mt-10 opacity-70">
              <MessageSquare className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">No comments yet</p>
              <p className="text-xs">Send a message to the property manager.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-4">
              {optimisticComments.map((comment: OptimisticComment) => {
                const isMe = comment.user_id === currentUserId;
                const isPending = comment.isPending;

                return (
                  <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`
                      max-w-[85%] px-4 py-2.5 rounded-xl text-sm shadow-sm
                      ${isMe 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-white border border-border text-foreground rounded-tl-none'
                      }
                      ${isPending ? 'opacity-70' : 'opacity-100'}
                    `}>
                      {comment.content}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground mt-1 px-1 flex items-center gap-1">
                      {isPending && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      {!isMe && "Manager • "}
                      {comment.created_at ? format(new Date(comment.created_at), 'dd/MM/yyyy - h:mm a') : 'Just now'}
                    </span>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-3 bg-white border-t border-border shrink-0 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <Input 
              placeholder="Type a message..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-muted/50 border-border rounded-full px-4 h-10"
              disabled={isSubmittingComment}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!text.trim() || isSubmittingComment}
              className="rounded-full h-10 w-10 shrink-0 shadow-sm"
            >
              {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
            </Button>
          </form>
        </div>

      </SheetContent>
    </Sheet>
  );
}