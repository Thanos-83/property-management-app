'use client';

import { PropertyTypesApi } from '@/types/propertyTypes';
import React, { useState } from 'react';

import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
// import { useActionState, startTransition } from 'react';
import DeletePropertyBtn from './DeletePropertyBtn';
import DeletePropertyIcalUrlBtn from './DeletePropertyIcalUrlBtn';
const AddIcalModal = dynamic(() => import('./AddIcalModal'), { ssr: false });

const platformIcons: Record<string, string> = {
  Airbnb: '/icons/airbnb.svg',
  Booking: '/icons/booking.svg',
  Vrbo: '/icons/vrbo.svg',
  Expedia: '/icons/expedia.svg',
};

export const Property = ({ property }: { property: PropertyTypesApi }) => {
  const [isSyncLoading, setSyncLoading] = useState(false);

  const handleSyncIcals = async (propertyId: string) => {
    setSyncLoading(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();

      console.log('Result syncing: ', result);
      if (result.success) {
        toast.success(
          `Sync completed! ${result.summary.totalNewBookings} new bookings, ${result.summary.totalUpdatedBookings} updated`
        );
      } else {
        toast.error('Sync failed. Please try again.');
      }
    } catch (error) {
      console.error('Error syncing property:', error);
      toast.error('Failed to sync property');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className='border rounded p-4 bg-white shadow-md flex flex-col space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-primary-main'>
          {property.title}
        </h2>
        <AddIcalModal propertyId={property.id} />
      </div>

      <div className='flex flex-wrap gap-2'>
        {property.property_icals.map((ical) => (
          <TooltipProvider key={ical.id}>
            <div className='flex items-center space-x-2 bg-gray-100 rounded px-3 min-w-max max-w-full'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button>
                    <Image
                      src={platformIcons[ical.platform] || '/icons/default.svg'}
                      alt={ical.platform}
                      width={100}
                      height={24}
                      className='object-contain'
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent className='whitespace-nowrap'>
                  {ical.ical_url}
                </TooltipContent>
              </Tooltip>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(ical.ical_url);
                }}
                className='ml-2 py-1 px-3 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs'>
                Copy iCal URL
              </Button>
              <DeletePropertyIcalUrlBtn icalId={ical.id} />
            </div>
          </TooltipProvider>
        ))}
      </div>
      <div className='border-t border-t-gray-200 pt-4 flex flex-col space-y-2'>
        <div className='flex items-center justify-end space-x-4'>
          <Link
            href={`/dashboard/listings/${property.id}`}
            className='btn btn-sm btn-outline'>
            Manage Property
          </Link>

          <DeletePropertyBtn propertyId={property.id} />
        </div>
        <div className='flex items-center space-x-4'>
          <Button
            variant='outline'
            size='sm'
            disabled={isSyncLoading}
            onClick={() => handleSyncIcals(property.id)}>
            <Loader2Icon
              className={`w-4 h-4 mr-1 ${
                isSyncLoading ? 'animate-spin' : 'hidden'
              }`}
            />
            Sync iCal
          </Button>
          <span className='text-sm text-muted-foreground'>
            Last synced:{' '}
            {property.property_icals[0]?.last_synced
              ? new Date(
                  property.property_icals[0].last_synced
                ).toLocaleString()
              : 'Never'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Property;
