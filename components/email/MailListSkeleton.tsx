import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MailListSkeleton() {
  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="gap-2 py-4">
            <CardHeader className="mb-1 px-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-baseline gap-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="mb-1 px-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6 mt-1" />
              <Skeleton className="h-3 w-1/6 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
