import { format } from 'date-fns';
import { Mail, XCircle, CheckCircle, Edit2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';

// Helper function to categorize system emails
const getSystemEmailCategory = (subject: string = '') => {
  const lowerSub = subject.toLowerCase();

  if (lowerSub.includes('cancel')) {
    return {
      label: 'Cancelled',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: XCircle,
    };
  }
  if (lowerSub.includes('confirm') || lowerSub.includes('new booking')) {
    return {
      label: 'New Booking',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    };
  }
  if (
    lowerSub.includes('modify') ||
    lowerSub.includes('change') ||
    lowerSub.includes('update')
  ) {
    return {
      label: 'Modification',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: Edit2,
    };
  }

  return {
    label: 'System Update',
    color: 'bg-secondary text-secondary-foreground border-border',
    icon: Info,
  };
};

interface ShowEmailContentProps {
  message: {
    id: string;
    subject: string;
    text: string;
    timestamp: string;
  };
}

export function ShowEmailContent({ message }: ShowEmailContentProps) {
  const category = getSystemEmailCategory(message.subject);
  const Icon = category.icon;

  return (
    <div className='flex flex-col items-center my-6'>
      <span className='text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3 bg-muted/50 px-3 py-1 rounded-full border border-border/50'>
        {format(new Date(message.timestamp), 'MMM d, yyyy • h:mm a')}
      </span>

      <div className='w-full max-w-lg bg-white border border-border rounded-md shadow-sm flex items-center justify-between p-4'>
        {/* Left Side: Icon, Badge, and Subject */}
        <div className='flex items-center gap-4 min-w-0 pr-4'>
          <div
            className={`p-2 rounded-full shrink-0 ${category.color.split(' ')[0]}`}>
            <Icon className={`w-5 h-5 ${category.color.split(' ')[1]}`} />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <h4 className='text-sm font-bold text-foreground'>
                Platform Notification
              </h4>
              <Badge
                variant='outline'
                className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0 shadow-none ${category.color}`}>
                {category.label}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground truncate max-w-[280px]'>
              {message.subject}
            </p>
          </div>
        </div>

        {/* Right Side: The Dialog Trigger Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='shrink-0 h-8 gap-2 text-xs font-semibold bg-muted/20 hover:bg-muted'>
              <Mail className='w-3.5 h-3.5' />
              <span className='hidden sm:inline'>View Email</span>
            </Button>
          </DialogTrigger>

          <DialogContent className='max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden'>
            <DialogHeader className='p-6 border-b border-border bg-muted/10 shrink-0'>
              <div className='flex items-center gap-3 mb-1'>
                <Badge variant='outline' className={category.color}>
                  {category.label}
                </Badge>
                <DialogTitle className='text-lg'>
                  Original Email Body
                </DialogTitle>
              </div>
              <p className='text-sm text-muted-foreground'>{message.subject}</p>
            </DialogHeader>

            <ScrollArea className='flex-1 h-full max-h-[60vh] overflow-y-auto p-2 bg-white'>
              <pre className='text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 p-3 rounded-md border border-border'>
                {message.text || 'No text body available for this email.'}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
