"use client";

import { Skeleton } from "../ui/skeleton";



export function SidebarSkeleton() {
  return (
   <div className="p-4 space-y-4">
    <Skeleton className="animate-pulse h-6 w-full" />
    <Skeleton className="animate-pulse h-6 w-full" />
    <Skeleton className="animate-pulse h-6 w-full" />
    <Skeleton className="animate-pulse h-6 w-full" />
    <Skeleton className="animate-pulse h-6 w-full" />
    <Skeleton className="animate-pulse h-6 w-full" />
   </div>
  )
}
