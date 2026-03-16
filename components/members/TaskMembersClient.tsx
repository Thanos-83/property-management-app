'use client';

import React, { useState, useTransition } from 'react';
import { Mail, Phone, User, Clock, CheckCircle2, ShieldAlert, MoreVertical, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AddTaskMemberModal from './AddTaskMemberModal'; // The modal we just updated
import { useRouter } from 'next/navigation';
import { DeleteMemberAlertDialog } from './DeleteMemberAlertDialog';
import { toast } from 'sonner';
import { deleteTeamMemberAction, resendInvitationAction } from '@/lib/actions/taskMemberActions';

interface TaskMembersClientProps {
  initialMembers: any[];
  taskTypes: any[];
}

export default function TaskMembersClient({ initialMembers, taskTypes }: TaskMembersClientProps) {
  const router = useRouter();

  // We can use local state if we want to do optimistic updates later, 
  // but for now, we'll just rely on the server data and router.refresh()
  const [members, setMembers] = useState(initialMembers);
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null)
  const [isDeleting, startDeletingMemberTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const handleRefresh = () => {
    router.refresh();
  };

  const handleConfirmDelete = async () => {
    // if (!memberToDelete) return;
    try {
        startDeletingMemberTransition(async()=>{
            const response = await deleteTeamMemberAction(memberToDelete.id)
            console.log('Response deleting team member: ', response)
            if(response.result === 'success'){
                toast.success('Invitation revoked successfully!')
                // setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
                // setMemberToDelete(null);
                setIsOpen(false)
                handleRefresh()
            }else{
                toast.error(response.error)
            }
        })
    } catch (error) {
        toast.error('Error deleting team member.')        
    }
   
  };


    // --- Resend Handler ---
  const handleResendInvite = async (email: string) => {
    const toastId = toast.loading('Resending invitation...');
    try {
      const result = await resendInvitationAction(email);
      toast.dismiss(toastId);
      if (result.status) {
        toast.success('Invitation resent successfully!');
        handleRefresh(); // This will refresh the grid, wiping out the expired/maxed badges!
      } else {
        toast.error(result.message || 'Failed to resend invitation.');
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('An unexpected error occurred.');
    }
  };

  console.log('Team members: ', initialMembers)

  return (
    <div className="flex flex-col w-full h-full">
      {/* --- HEADER --- */}
      <div className='bg-white border-b border-border shadow-sm'>
        <div className='px-6 py-4 max-w-[1600px] mx-auto flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>Team Members</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your staff, assign roles, and track invitation statuses.
            </p>
          </div>
          
          {/* THE UPDATED MODAL IS TRIGGERED HERE */}
          <AddTaskMemberModal onSuccess={handleRefresh} taskTypes={taskTypes} />
        </div>
      </div>

      {/* --- MAIN CONTENT (GRID) --- */}
      <div className='p-6 max-w-[1600px] mx-auto w-full'>
        {initialMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-white/50 text-center mt-8">
            <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground mb-1">No team members yet</p>
            <p className="text-sm text-muted-foreground mb-4">Invite your first cleaner or maintenance staff to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {initialMembers.map((member) => {
              const isPending = member.status === 'pending';
              const fullName = member.first_name || member.last_name 
                ? `${member.first_name || ''} ${member.last_name || ''}`.trim() 
                : 'Unknown User';
                              // --- NEW: Detailed Pending States ---
              let isExpired = false;
              let isMaxedOut = false;
              if (isPending && member.invite_details) {
                isExpired = new Date(member.invite_details.expires_at) < new Date();
                isMaxedOut = member.invite_details.click_count >= member.invite_details.max_clicks;
              }

              // Determine Badge Content dynamically
              let badgeContent = <><Clock className="w-3 h-3" /> Pending Invite</>;
              let badgeStyles = "bg-amber-50 text-amber-700 border-amber-200";

              if (isPending) {
                if (isExpired) {
                  badgeContent = <><AlertCircle className="w-3 h-3" /> Expired Link</>;
                  badgeStyles = "bg-destructive/10 text-destructive border-destructive/20";
                } else if (isMaxedOut) {
                  badgeContent = <><AlertCircle className="w-3 h-3" /> Max Clicks Reached</>;
                  badgeStyles = "bg-destructive/10 text-destructive border-destructive/20";
                }
              } else {
                badgeContent = <><CheckCircle2 className="w-3 h-3" /> Active</>;
                badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
              }
              
              // Get initials for Avatar
              const initials = (member.first_name?.[0] || '') + (member.last_name?.[0] || '');

              return (
                <Card key={member.id} className={`py-0 rounded-md overflow-hidden transition-all ${isPending ? 'border-dashed bg-slate-50/50' : 'bg-white shadow-sm hover:shadow-md'} ${isDeleting ? 'opacity-50 animation-pulse' : ''}`}>
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col gap-4">
                      
                      {/* Top Row: Avatar, Name & Actions */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-10 w-10 border ${isPending ? 'opacity-60 grayscale' : ''}`}>
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {initials || <User className="w-4 h-4" />}
                            </AvatarFallback>
                            <AvatarImage src={member.avatar_url} className='object-cover'/>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground truncate max-w-[140px]" title={fullName}>
                              {fullName}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize font-medium">
                              {member.member_role || 'Staff'}
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isPending && (
                              <DropdownMenuItem onClick={() => handleResendInvite(member.email)} className="cursor-pointer">
                                Resend Invitation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {setIsOpen(true); setMemberToDelete(member)}} className="cursor-pointer text-destructive focus:text-destructive">
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Middle Row: Contact Info */}
                      <div className="flex flex-col gap-2 text-xs text-muted-foreground bg-muted/20 p-3 rounded-md border border-border/50">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          <a 
                            href={`mailto:${member.email}`} 
                            className="truncate hover:text-primary hover:underline transition-colors"
                            title={`Send email to ${member.email}`}
                          >
                            {member.email}
                          </a>
                        </div>
                        {member.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" />
                            <a 
                              href={`tel:${member.phone}`} 
                              className="hover:text-primary hover:underline transition-colors"
                              title={`Call ${member.phone}`}
                            >
                              {member.phone}
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" />
                            <span>Not provided</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Status Badge */}
                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        {/* Dynamic Badge applied here! */}
                        <Badge variant={isPending ? "outline" : "secondary"} className={`shadow-sm gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${badgeStyles}`}>
                          {badgeContent}
                        </Badge>
                        
                        {!member.has_portal_access && !isPending && (
                          <ShieldAlert className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <DeleteMemberAlertDialog
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
        //   setMemberToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        member={memberToDelete}
      />
    </div>
  );
}