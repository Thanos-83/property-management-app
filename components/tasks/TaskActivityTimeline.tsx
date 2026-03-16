'use client';

import { format } from "date-fns";
import { Activity, Loader2, MessageSquare, Send } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { forwardRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface TaskActivityTimelineProps {
  isSubmittingComment: boolean;
  handleAddComment: () => void;
  sortedActivities: any[]; 
  commentInputRef: React.RefObject<HTMLTextAreaElement | null>;
  currentUserInfo: any;
  teamMembers?: any[]; // <-- Bring back the team members array for the memory lookup!
}

const TaskActivityTimeline = forwardRef(({ 
  isSubmittingComment, 
  handleAddComment, 
  sortedActivities, 
  commentInputRef, 
  currentUserInfo,
  teamMembers = [] 
}: TaskActivityTimelineProps) => {

  // --- HELPER TO RENDER BOLD TEXT FROM LOGS ---
  const renderLogContent = (text: string) => {
    if (!text) return null;
    return text.split('**').map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
    );
  };

  // --- HELPER FOR AVATAR INITIALS ---
  const getInitials = (name: string) => {
    if (!name || name === 'Unknown') return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-foreground flex items-start gap-2 mb-4 shrink-0">
        <MessageSquare className="w-4 h-4 text-muted-foreground" /> 
        <span className="text-foreground">Activity Timeline</span>
      </h3>
      
      <div className="bg-slate-50 border border-border rounded-lg p-4 shadow-sm flex flex-col">
        {/* The Feed */}
        <div className="space-y-5 flex-1">
          {sortedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white border border-dashed border-border rounded-md">
              <Activity className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">Status changes and comments will appear here.</p>
            </div>
          ) : (
            sortedActivities.map((act: any) => {
              const isSystem = act.activity_type === 'system_log';
              const timeString = format(new Date(act.created_at), 'MMM d, h:mm a');
              
              // 1. Check if the comment was made by the logged-in Manager
              const isMe = act.user_id === currentUserInfo?.id;

              // 2. Memory Lookup: Try to find the user in the Team Members array
              const matchedMember = teamMembers.find((tm: any) => tm.auth_member_id === act.user_id);
              
              // 3. Resolve the Author's Name dynamically
              let authorName = 'Unknown User';
              if (isMe) {
                authorName = currentUserInfo?.full_name || 'Manager';
              } else if (matchedMember) {
                authorName = `${matchedMember.first_name || ''} ${matchedMember.last_name || ''}`.trim() || 'Team Member';
              } else if (isSystem) {
                authorName = 'System';
              }

              // 4. Resolve the Avatar dynamically
              const avatarUrl = isMe ? currentUserInfo?.avatar : matchedMember?.avatar_url;

              // --- RENDER SYSTEM LOG ---
              if (isSystem) {
                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs text-muted-foreground bg-white p-3 rounded-lg border border-border/50 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col flex-1 gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="font-bold text-foreground">{authorName}</span>
                      <span className="flex-1 text-foreground/80">{renderLogContent(act.content)}</span>
                      <span className="text-[10px] opacity-60 font-medium sm:ml-auto">{timeString}</span>
                    </div>
                  </div>
                );
              }

              // --- RENDER USER COMMENT BUBBLE ---
              return (
                <div key={act.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Avatar (Now completely dynamic!) */}
                  <Avatar className={`w-8 h-8 rounded-full border shadow-sm mt-1 ${isMe ? 'border-primary/20' : 'border-border'}`}>
                    <AvatarImage src={avatarUrl || ''} className="object-cover" />
                    <AvatarFallback className={`text-[10px] font-bold ${isMe ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getInitials(authorName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Bubble Container */}
                  <div className={`flex flex-col flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-muted-foreground">
                        {isMe ? `You (${authorName})` : authorName}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground/70">
                        {timeString}
                      </span>
                    </div>
                    
                    <div className={`
                      px-4 py-2.5 rounded-xl text-sm shadow-sm max-w-[90%] sm:max-w-[85%]
                      ${isMe 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-white border border-border text-foreground rounded-tl-sm'
                      }
                    `}>
                      <p className="leading-relaxed whitespace-pre-wrap">{act.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* The Chat Input */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border shrink-0">
          <Textarea
            ref={commentInputRef}
            placeholder="Type a comment or update..."
            className="min-h-[60px] h-[60px] border border-border py-3 text-sm bg-white resize-none"
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
            className="shrink-0 h-[44px] w-[44px] shadow-sm rounded-lg"
            onClick={handleAddComment} 
            disabled={isSubmittingComment}
          >
            {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
});

TaskActivityTimeline.displayName = "TaskActivityTimeline";

export default TaskActivityTimeline;