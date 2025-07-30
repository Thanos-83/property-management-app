'use server';
import { createClient } from '../utils/supabase/server';
import { propertySchema, PropertySchemaType } from '../schemas/property';
import { propertyIcalSchema } from '../schemas/property';

import { revalidateTag } from 'next/cache';

export const addPropertyAction = async (propertyData: PropertySchemaType) => {
  const supabase = await createClient();

  // Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  //   console.log('User Info: ', user);

  const parsedData = propertySchema.safeParse(propertyData);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      issues: parsedData.error.format(),
      status: 400,
    };
  }

  const { title, description, location, rooms, platform, ical_url } =
    parsedData.data;

  // Insert into database
  const { data, error } = await supabase
    .from('properties')
    .insert({
      title,
      description,
      location,
      rooms,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.log('Error: ', error);
    return { error: error, status: 500 };
  }

  const urlResponse = await supabase
    .from('property_icals')
    .insert({
      property_id: data.id,
      platform,
      ical_url,
    })
    .select()
    .single();

  if (urlResponse.error) {
    console.log('Error: ', urlResponse.error);
    return { error: error, status: 500 };
  }

  revalidateTag('properties');
  return { property: data, status: 201 };
};

export const getPropertiesDataAction = async () => {
  const supabase = await createClient();

  // Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Select into database
  const { data, error, status } = await supabase
    .from('properties')
    .select(
      `
    *,
    property_icals(*)
  `
    )
    .eq('owner_id', user?.id);

  if (error) {
    return { error: error, status: status, result: 'fail' };
  }

  return { properties: data, status: status, result: 'success' };
};

export const deletePropertyAction = async (id: string) => {
  const supabase = await createClient();

  const response = await supabase.from('properties').delete().eq('id', id);

  console.log('Response deleting property: ', response);

  if (response.error) {
    return {
      status: response.status,
      result: 'fail',
      error: response.error,
    };
  }

  revalidateTag('properties');
  return {
    status: response.status,
    result: 'success',
    error: response.error,
  };
};

export const addPropertyIcalAction = async (
  propertyId: string,
  platform: string,
  icalUrl: string
) => {
  const supabase = await createClient();

  // Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Validate inputs with zod schema
  const parsedData = propertyIcalSchema.safeParse({
    propertyId,
    platform,
    icalUrl,
  });

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      issues: parsedData.error.format(),
      status: 400,
    };
  }

  const {
    propertyId: validPropertyId,
    platform: validPlatform,
    icalUrl: validIcalUrl,
  } = parsedData.data;

  // Insert new iCal URL for the property
  const { data, error } = await supabase
    .from('property_icals')
    .insert({
      property_id: validPropertyId,
      platform: validPlatform,
      ical_url: validIcalUrl,
    })
    .select()
    .single();

  if (error) {
    console.log('Error adding iCal URL: ', error);
    return { error, status: 500 };
  }

  // Revalidate the listings page to update UI
  // revalidatePath('/dashboard/listings');
  revalidateTag('properties');

  return { ical: data, status: 201 };
};

export const deletePropertyIcalAction = async (icalId: string) => {
  const supabase = await createClient();

  const response = await supabase
    .from('property_icals')
    .delete()
    .eq('id', icalId);

  // console.log('Supabase response:', response);

  if (response.error) {
    const errorResult = {
      error: response.error,
      status: response.status,
      result: 'fail',
    };
    return errorResult;
  }

  const successResult = {
    status: response.status,
    result: 'success',
    error: null,
  };
  revalidateTag('properties');

  console.log('Returning success result:', successResult);
  return successResult;
};

// This is an Example of how to call API Route with forwarding cookies from a Server Action
export const fetchPropertyData = async () => {
  // console.log('Iam in the Server Action!!');

  const supabase = await createClient();

  const {
    data: { user },
    // error: userError,
  } = await supabase.auth.getUser();

  // console.log('User INFO from Server Action: ', user);
  // console.log('User ERROR from Server Action: ', userError);

  // Test API call from server action with proper cookie forwarding
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  // console.log('Making API call from server action with cookies...');

  const response = await fetch(`http://localhost:3000/api/properties`, {
    headers: {
      Cookie: cookieHeader,
    },
    next: {
      tags: ['properties'],
    },
  });

  const data = await response.json();
  // console.log('API Response from server action:', data);

  return { user, apiData: data };
};
