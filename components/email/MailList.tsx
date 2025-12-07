'use client';

import { ComponentProps } from 'react';
import { formatDistanceToNow } from 'date-fns';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailSummary } from '@/lib/actions/emailActions';
import { MailListSkeleton } from './MailListSkeleton';

interface MailListProps {
  items: EmailSummary[];
  selectedMailId: string | null;
  onSelectMail: (id: string) => void;
  loading?: boolean;
}

export function MailList({ items, selectedMailId, onSelectMail, loading }: MailListProps) {
  if (loading) {
    return <MailListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No emails found.
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-2 mb-60">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(
              'cursor-pointer hover:bg-accent/50 gap-2 py-4 transition-colors',
              selectedMailId === item.id && 'bg-muted border-primary/50'
            )}
            onClick={() => onSelectMail(item.id)}
          >
            <CardHeader className="mb-1 px-4">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-md font-bold leading-tight truncate flex items-baseline">
                  {item.from.name}
                  {!item.sysLabels?.includes('seen') && (
                    <span className="flex ml-2 h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.receivedAt), {
                      addSuffix: true,
                    })}
                  </span>                
                </div>
              </div>
              <CardDescription className="text-sm font-medium truncate">
                {item.subject}
              </CardDescription>
            </CardHeader>
            <CardContent className="mb-1 px-4">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.bodySnippet}
              </p>
              {item.sysLabels && item.sysLabels.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {item.sysLabels.map((label) => (
                    <Badge
                      key={label}
                      variant={getBadgeVariantFromLabel(label)}
                      className="text-[12px] h-5 px-2 font-semibold"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>['variant'] {
  if (['work'].includes(label.toLowerCase())) {
    return 'default';
  }

  if (['personal'].includes(label.toLowerCase())) {
    return 'outline';
  }

  return 'secondary';
}
