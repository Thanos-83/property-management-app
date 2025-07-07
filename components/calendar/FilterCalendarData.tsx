'use client';
import React, { useTransition } from 'react';
import { PlatformFilter } from './PlatformFilter';
import { parseAsString, useQueryState } from 'nuqs';
import { PropertyFilter } from './PropertyFilter';
import { useSearchParams } from 'next/navigation';

type FilterDataTypes = {
  filterOptionsData: {
    id: string;
    title: string;
    ical_urls: { ical_url: string; platform: string }[];
  }[];
};

function FilterCalendarData({ filterOptionsData }: FilterDataTypes) {
  //   const filterOptionsData = use(filterOptionsData);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const propertyId = searchParams.get('property');
  //   const platform = searchParams.get('platform');

  // ========  Platform Filtering ===============
  const [platform, setPlatform] = useQueryState(
    'platform',
    parseAsString.withDefault('All').withOptions({
      history: 'push',
      shallow: false,
      startTransition,
    })
  );

  async function handlePlatformFilter(value: string) {
    setPlatform(value);
  }
  //   ============================================

  //   console.log('Filter Options Data in the Client: ', filterOptionsData);

  // ========  Property Filtering ===============
  const [property, setProperty] = useQueryState(
    'property',
    parseAsString.withDefault('').withOptions({
      history: 'push',
      shallow: false,
      startTransition,
    })
  );

  async function handlePropertyFilter(value: string) {
    setProperty(value);
    if (platform) {
      setPlatform('All');
    }
  }

  //   ============================================
  console.log('Is Pending: ', isPending);

  return (
    <div
      data-pending={isPending ? '' : undefined}
      className={` iam-here flex items-center gap-4`}>
      <PlatformFilter
        propertyPlatforms={
          !propertyId
            ? filterOptionsData[0].ical_urls
            : filterOptionsData.filter((data) => data.id === propertyId)[0]
                .ical_urls
        }
        handlePlatformFilter={handlePlatformFilter}
        searchParamPlatform={platform}
      />
      <PropertyFilter
        propertiesData={filterOptionsData}
        handlePropertyFilter={handlePropertyFilter}
        searchParamProperty={property}
      />
    </div>
  );
}

export default FilterCalendarData;
