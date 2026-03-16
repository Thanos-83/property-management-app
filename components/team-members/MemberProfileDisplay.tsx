'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronLeft, LogOut, Mail, Phone, 
  CheckCircle2, ListTodo, ShieldCheck, Edit2 
} from 'lucide-react';
import { memberSignOutAction } from '@/lib/actions/teamMemberActions';
import { toast } from 'sonner';

interface MemberProfileDisplayProps {
  profile: any;
  onEdit: () => void;
}

export function MemberProfileDisplay({ profile, onEdit }: MemberProfileDisplayProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await memberSignOutAction();
      } catch (error) {
        toast.error('Failed to log out.');
      }
    });
  };

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 pb-safe">
      
      {/* --- HEADER --- */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/member/tasks')} 
            className="h-8 w-8 -ml-2 text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-bold text-foreground ml-2">My Profile</h1>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-primary font-bold hover:bg-primary/10 hover:text-primary px-2"
          onClick={onEdit}
        >
          <Edit2 className="w-4 h-4 mr-1.5" /> Edit
        </Button>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto w-full">
        
        {/* --- AVATAR & BASIC INFO --- */}
        <div className="flex flex-col items-center mt-4">
          <Avatar className="w-24 h-24 border-4 border-white shadow-sm mb-4">
            <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
            <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground text-center">
            {profile.first_name} {profile.last_name}
          </h2>
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mt-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="capitalize">{profile.member_role || 'Team Member'}</span>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border border-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-status-completed/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4 text-status-completed" />
              </div>
              <p className="text-2xl font-black text-foreground">{profile.stats?.completed || 0}</p>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Completed</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center mb-2">
                <ListTodo className="w-4 h-4 text-warning" />
              </div>
              <p className="text-2xl font-black text-foreground">{profile.stats?.pending || 0}</p>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* --- CONTACT DETAILS CARD --- */}
        <Card className="bg-white border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-muted/10">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Email Address
              </span>
              <span className="text-sm font-medium text-muted-foreground truncate" title="Contact your manager to change your email">
                {profile.email}
              </span>
            </div>
          </div>
          
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Phone Number
              </span>
              <span className="text-sm font-medium text-foreground mt-0.5">
                {profile.phone || <span className="text-muted-foreground/50 italic">Not provided</span>}
              </span>
            </div>
          </div>
        </Card>

        {/* --- ACTION AREA --- */}
        <div className="pt-4">
          <Button 
            variant="destructive" 
            className="w-full h-12 font-bold text-base shadow-sm"
            onClick={handleSignOut}
            disabled={isPending}
          >
            {isPending ? "Logging out..." : <><LogOut className="w-5 h-5 mr-2" /> Log Out</>}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Rendy Operations Portal v1.0
          </p>
        </div>

      </div>
    </div>
  );
}