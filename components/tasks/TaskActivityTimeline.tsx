'use client';

import { format } from "date-fns";
import { Activity, Loader2, MessageSquare, Send, User } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useMemo } from "react";
import {forwardRef} from 'react';

interface TaskActivityTimelineProps {
    isSubmittingComment: boolean;
    handleAddComment: () => void;
    sortedActivities: any[]; 
    commentInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const TaskActivityTimeline = forwardRef(({ isSubmittingComment, handleAddComment, sortedActivities, commentInputRef }: TaskActivityTimelineProps) => {


      // --- HELPER TO RENDER BOLD TEXT FROM LOGS ---
  const renderLogContent = (text: string) => {
    if (!text) return null;
    return text.split('**').map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
    );
  };
console.log('Sorted Activities in TaskActivityTimeline: ', sortedActivities);

    return (
        <div>
            <h3 className="text-sm font-bold text-foreground flex items-start gap-2 mb-4 shrink-0">
                <MessageSquare className="w-4 h-4 text-muted-foreground" /> 
                <span className=" text-foreground">Activity Timeline</span>
            </h3>
            <div className="bg-white border border-border rounded-lg p-4 shadow-sm flex flex-col">
                {/* The Feed */}
                <div className="space-y-4 flex-1">
                    {sortedActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/10 border border-dashed rounded-md">
                            <Activity className="w-8 h-8 text-muted-foreground/50 mb-3" />
                            <p className="text-sm font-medium text-foreground">No activity yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Status changes and comments will appear here.</p>
                          </div>
                        ) : (
                          sortedActivities.map((act: any) => {
                            const isSystem = act.activity_type === 'system_log';
                            const authorName = act.users?.first_name || act.team_members?.first_name || 'Team Member';
                            const timeString = format(new Date(act.created_at), 'MMM d, h:mm a');

                            if (isSystem) {
                              return (
                                <div key={act.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <Activity className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex gap-2 flex-1">
                                    <span className="font-bold text-foreground">{authorName}</span>{' '}
                                    <span className="flex-1 text-foreground/80">{renderLogContent(act.content)}</span>
                                    <span className="ml-auto text-[10px] opacity-60 font-medium">{timeString}</span>
                                  </div>
                                </div>
                              );
                            }

                            // User Comment Bubble
                            return (
                              <div key={act.id} className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="bg-muted/30 border border-border rounded-xl rounded-tl-sm p-3.5 flex-1 shadow-sm">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-foreground">{authorName}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground">{timeString}</span>
                                  </div>
                                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{act.content}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* The Chat Input (Anchored at the bottom of the card) */}
                      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border shrink-0">
                        <Textarea
                          ref={commentInputRef}
                          placeholder="Type a comment or update..."
                          className="min-h-[60px]  h-[60px] border border-border py-3 text-sm bg-muted/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="icon" 
                          className="shrink-0 h-[44px] w-[44px]"
                          onClick={handleAddComment} 
                          disabled={isSubmittingComment}
                        >
                          {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
        </div>
    );
})

export default TaskActivityTimeline;