'use client';

import { DetailedProperty, PropertyIcal } from '@/types/propertyTypes';
import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Loader2Icon,
  MapPin,
  BedDouble,
  Building2,
  MoreHorizontal,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { deletePropertyAction } from '@/lib/actions/propertiesActions';
import { useRouter } from 'next/navigation';

const platformIcons: Record<string, string> = {
  Airbnb: '/icons/airbnb-short.png',
  Booking: '/icons/booking-short.png',
  Vrbo: '/icons/vrbo-short.png',
  Expedia: '/icons/expedia-short.png',
};

const MAX_VISIBLE_PLATFORMS = 3;

export default function PropertyCard({
  property,
  onManage,
}: {
  property: DetailedProperty;
  onManage: () => void;
}) {
  const router = useRouter();
  const [isSyncLoading, setSyncLoading] = useState(false);
  const [isDeleting, startDeletingTransition] = useTransition();
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);

  // Extract unique platforms so we don't show 3 Airbnb icons if they have 3 Airbnb calendars
  const uniquePlatforms = Array.from(
    new Set(
      property.property_icals?.map((ical: PropertyIcal) => {
        return { platform: ical.platform, statusHealth: ical.sync_status };
      }) || [],
    ),
  );

  const visiblePlatforms = uniquePlatforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const hiddenPlatforms = uniquePlatforms.slice(MAX_VISIBLE_PLATFORMS);
  const hiddenCount = uniquePlatforms.length - MAX_VISIBLE_PLATFORMS;

  // --- DERIVE GLOBAL SYNC HEALTH FOR THIS PROPERTY ---
  const icals = property.property_icals || [];
  const hasErrors = icals.some(
    (ical: PropertyIcal) => ical.sync_status === 'error',
  );
  const isPending = icals.some(
    (ical: PropertyIcal) => ical.sync_status === 'pending',
  );
  // If no iCals, it's neutral. Otherwise, error trumps pending, pending trumps healthy.
  const globalSyncStatus =
    icals.length === 0
      ? 'none'
      : hasErrors
        ? 'error'
        : isPending
          ? 'pending'
          : 'healthy';

  const handleSyncIcals = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      });

      if (!response.ok) throw new Error('Sync failed');

      const result = await response.json();

      // --- SMART PARTIAL SUCCESS LOGIC ---
      if (result.summary.failedSyncs === 0) {
        toast.success(
          `Sync completed! ${result.summary.totalNewBookings} new bookings, ${result.summary.totalUpdatedBookings} updated`,
        );
      } else if (result.summary.successfulSyncs > 0) {
        toast.warning(
          `Partial sync: ${result.summary.successfulSyncs} synced correctly, ${result.summary.failedSyncs} failed.`,
        );
      } else {
        toast.error('Sync failed for all calendars. Please check your URLs.');
      }
    } catch (error) {
      console.error('Error syncing property:', error);
      toast.error('Failed to sync property');
    } finally {
      setSyncLoading(false);
      setIsActionsDropdownOpen(false); // Manually close the dropdown ONLY when the sync finishes
      router.refresh();
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    startDeletingTransition(async () => {
      const result = await deletePropertyAction(propertyId);
      if (result?.result === 'success') {
        setTimeout(() => toast.success('Property deleted successfully'), 500);
      } else if (result?.result === 'fail') {
        toast.error(result?.error?.message || 'Failed to delete property');
      }
    });
  };

  return (
    <div className='group flex flex-col bg-white rounded-md border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative'>
      {/* --- HEADER IMAGE AREA --- */}
      <div className='relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-muted flex items-center justify-center border-b border-border'>
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={property.title}
            fill
            className='object-cover'
          />
        ) : (
          <Building2 className='w-12 h-12 text-primary/30' />
        )}

        {/* Absolute Action Menu */}
        <div className='absolute top-3 right-3'>
          <DropdownMenu
            open={isActionsDropdownOpen}
            onOpenChange={setIsActionsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant='secondary'
                size='icon'
                className='h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm border border-border/50'>
                <MoreHorizontal className='h-4 w-4 text-foreground' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-[260px] z-[100] rounded-md shadow-lg'>
              {/* THE FIX: Use onSelect with e.preventDefault() to stop auto-closing */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleSyncIcals();
                }}
                disabled={isSyncLoading}
                className='cursor-pointer font-medium'>
                {isSyncLoading ? (
                  <Loader2Icon className='mr-2 h-4 w-4 animate-spin text-primary' />
                ) : (
                  <RefreshCw className='mr-2 h-4 w-4 text-muted-foreground' />
                )}
                {isSyncLoading ? 'Syncing...' : 'Sync Calendar Now'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <div className='p-1'>
                <Button
                  disabled={isDeleting}
                  onClick={() => handleDeleteProperty(property.id)}
                  variant='destructive'
                  className='w-full'
                  size='sm'>
                  <Loader2Icon
                    className={`animate-spin ${isDeleting ? 'block' : 'hidden'}`}
                  />
                  Delete
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* --- CARD BODY --- */}
      <div className='p-3 flex flex-col flex-1'>
        <h3
          className='font-extrabold text-lg text-foreground truncate mb-2'
          title={property.title}>
          {property.title}
        </h3>

        <div className='flex flex-col gap-2.5 text-xs font-medium text-muted-foreground mb-4'>
          <div className='flex items-center gap-2'>
            <MapPin className='w-3.5 h-3.5 text-primary/70 shrink-0' />
            <span className='truncate'>
              {property.location || 'Location not set'}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <BedDouble className='w-3.5 h-3.5 text-primary/70 shrink-0' />
            <span>
              {property.rooms || 1} {property.rooms === 1 ? 'Room' : 'Rooms'}
            </span>
          </div>
        </div>

        {/* --- NEW: OPERATIONAL STATS --- */}
        <div className='grid grid-cols-2 gap-2 mb-1 bg-muted/30 p-2 rounded-md border border-border/50'>
          <div className='flex flex-col gap-0.5'>
            <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
              <CalendarDays className='w-3 h-3' /> Upcoming
            </span>
            <span className='text-sm font-black text-foreground'>
              {property.upcoming_bookings_count ?? '--'}{' '}
              <span className='text-xs font-medium text-muted-foreground'>
                Stays
              </span>
            </span>
          </div>

          <div className='flex flex-col gap-0.5 border-l border-border/50 pl-3'>
            <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
              Sync Status
            </span>
            <span className='text-xs font-bold flex items-center gap-1 mt-0.5'>
              {globalSyncStatus === 'error' ? (
                <>
                  <AlertCircle className='w-3.5 h-3.5 text-destructive' />{' '}
                  <span className='text-destructive'>Action Needed</span>
                </>
              ) : globalSyncStatus === 'pending' ? (
                <>
                  <RefreshCw className='w-3.5 h-3.5 text-muted-foreground' />{' '}
                  <span className='text-muted-foreground'>Pending</span>
                </>
              ) : globalSyncStatus === 'healthy' ? (
                <>
                  <CheckCircle2 className='w-3.5 h-3.5 text-status-completed' />{' '}
                  <span className='text-status-completed'>Healthy</span>
                </>
              ) : (
                <span className='text-muted-foreground'>No Calendars</span>
              )}
            </span>
          </div>
        </div>

        {/* --- FOOTER: CHANNELS & MANAGE --- */}
        <div className='mt-1 pt-2 border-t border-border flex items-center justify-between'>
          <div className='flex items-center gap-1.5'>
            {uniquePlatforms.length > 0 ? (
              <AvatarGroup>
                {visiblePlatforms.map((platform) => (
                  <Avatar
                    key={platform.platform as string}
                    className='items-center justify-center bg-white overflow-visible shadow-sm'>
                    <AvatarImage
                      src={
                        platformIcons[platform.platform as string] ||
                        '/icons/default.svg'
                      }
                      className='rounded-full overflow-hidden object-cover'
                    />
                    <AvatarFallback className='text-[10px] bg-muted'>
                      {platform.platform.charAt(0).toUpperCase()}
                    </AvatarFallback>
                    <AvatarBadge
                      className={`!w-2 !h-2 ring-1 top-0 left-0 ${platform.statusHealth === 'success' ? 'bg-green-600 dark:bg-green-800' : platform.statusHealth === 'pending' ? 'bg-muted-foreground dark:bg-muted-foreground' : 'bg-red-600 dark:bg-red-800'}`}
                    />
                  </Avatar>
                ))}
                {hiddenCount > 0 && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AvatarGroupCount className='w-8 h-8 shadow-sm text-[10px] font-bold bg-muted text-muted-foreground cursor-help'>
                          +{hiddenCount}
                        </AvatarGroupCount>
                      </TooltipTrigger>
                      <TooltipContent
                        side='top'
                        className='p-2 bg-popover border-border shadow-md [&>svg]:fill-popover'>
                        <div className='flex flex-col gap-1.5'>
                          {hiddenPlatforms.map((p) => (
                            <Avatar
                              key={p.platform as string}
                              className='items-center justify-center bg-white overflow-visible'>
                              <AvatarImage
                                src={
                                  platformIcons[p.platform as string] ||
                                  '/icons/default.svg'
                                }
                                className='rounded-full overflow-hidden object-cover'
                              />
                              <AvatarFallback className='text-[10px] bg-muted'>
                                {p.platform.charAt(0).toUpperCase()}
                              </AvatarFallback>
                              <AvatarBadge
                                className={`!w-2 !h-2 ring-1 top-0 left-0 ${p.statusHealth === 'success' ? 'bg-green-600 dark:bg-green-800' : p.statusHealth === 'pending' ? 'bg-muted-foreground dark:bg-muted-foreground' : 'bg-red-600 dark:bg-red-800'}`}
                              />
                            </Avatar>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </AvatarGroup>
            ) : (
              <Badge
                variant='secondary'
                className='text-[9px] uppercase tracking-wider font-bold'>
                No Sync
              </Badge>
            )}
          </div>

          <Button
            onClick={onManage}
            variant='default'
            size='sm'
            className='h-8 px-4 text-xs font-bold rounded-lg shadow-sm'>
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}
