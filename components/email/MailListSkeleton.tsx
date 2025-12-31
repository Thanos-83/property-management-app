import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Separator } from "../ui/separator"

export function MailListSkeleton() {
  return (
    <div className="flex flex-col pt-0 gap-2">
            <Tabs defaultValue="all" className="h-[95%]">
            <div className="flex items-center px-4 py-2">
              {/* <h1 className="text-xl font-bold capitalize">{folder}</h1> */}
              <TabsList className="ml-auto">
                <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                  All mail
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-zinc-600 dark:text-zinc-200">
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            {/* Search removed from here and moved to Shell Header */}
            <div className="flex-1 overflow-auto h-[calc(100vh-200px)]">
              <TabsContent value="all" className="m-0 h-full">
                <div className="p-4 space-y-3 overflow-y-auto h-[calc(100vh-200px)]">
                    {/* Creating fake rows */}
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-[200px]" /> {/* Sender */}
                                    <Skeleton className="h-4 w-[80px] ml-auto" /> {/* Date */}
                                </div>
                                <Skeleton className="h-3 w-[80%]" /> {/* Subject */}
                            </div>
                        </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="unread" className="m-0 h-full">
                <div className="p-4 space-y-3 overflow-y-auto h-[calc(100vh-200px)]">
                {/* Creating fake rows */}
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-[200px]" /> {/* Sender */}
                                <Skeleton className="h-4 w-[80px] ml-auto" /> {/* Date */}
                            </div>
                            <Skeleton className="h-3 w-[80%]" /> {/* Subject */}
                        </div>
                    </div>
                    ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
    </div>
  )
}
