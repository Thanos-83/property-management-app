'use server';
import { createClient } from '../utils/supabase/server';
import { ManagePropertySchemaType, createPropertySchema, CreatePropertySchemaType, managePropertySchema } from '../schemas/property';
import { propertyIcalSchema } from '../schemas/property';

import { revalidateTag } from 'next/cache';

export const addPropertyAction = async (propertyData: CreatePropertySchemaType) => {
  const supabase = await createClient();

  // Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401, success: false };
  }

  //   console.log('User Info: ', user);

  const parsedData = createPropertySchema.safeParse(propertyData);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      issues: parsedData.error.format(),
      status: 400,
    };
  }

  const { title, description, location, rooms } =
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
    return { error: error, status: 500, success: false };
  }

  revalidateTag('properties');
  return { property: data, status: 201, success: true };
};

export const updatePropertyAction = async(propertyId: string, updatePropertyData: ManagePropertySchemaType) =>{
  const supabase = await createClient();

  console.log('Update Property Data in Server Action: ', updatePropertyData);
  // Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Validate inputs with zod schema
  const parsedData = managePropertySchema.safeParse(updatePropertyData);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      issues: parsedData.error.format(),
      status: 400,
    };
  }


  const { title, description, location, rooms, image_url } =
    parsedData.data;

    const { data: updatedProperty, error : updateError } = await supabase
    .from('properties')
    .update({
      title,
      description,
      location,
      rooms,
      image_url,
    })
    .eq('id', propertyId);

    if (updateError) {
      console.log('Error: ', updateError);
      return { error: updateError, status: 500, success: false };
    }

    revalidateTag('properties');
    return {status: 200, result: 'success', error: null};
}

export const getPropertiesDataAction = async () => {
  try {
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
      return { error: error.message, status: status, result: 'fail' };
    }

    return { properties: data, status: status, result: 'success' };
  } catch (error) {
    console.error('Error fetching properties:', error);
    return {
      error: 'Error fetching properties',
      status: 500,
      result: 'fail',
    };
  }
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

export const addPropertyIcalAction = async ({
  propertyId,
  platform,
  icalUrl,
}: {
  propertyId: string;
  platform: string | undefined;
  icalUrl: string | undefined;
}) => {
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
    // console.log('Response adding iCal URL: ', data);
    // console.log('Error adding iCal URL: ', error);
  if (error) {
    console.log('Error adding iCal URL: ', error);
    return { error: error.message, status: 500, data: null };
  }

  // Revalidate the listings page to update UI
  // revalidatePath('/dashboard/listings');
  revalidateTag('properties');

  return { ical: data, status: 201, error: null };
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


// ACTION 1: Toggle the template ON/OFF for ONE specific property
export async function togglePropertyTemplateAction(propertyId: string, templateId: string, isActive: boolean) {
  const supabase = await createClient();
  
  // We use upsert. If the link exists for this specific property, update it. If not, create it.
  const { error } = await supabase
    .from('property_template_link')
    .upsert({
      property_id: propertyId,
      template_id: templateId,
      is_active: isActive,
    }, { 
      // This relies on the unique constraint we built in your database schema
      onConflict: 'property_id,template_id' 
    });

  if (error) throw new Error(error.message);
  
  revalidateTag('properties');
  return { success: true };
}

// ACTION 2: Update the time offset for ONE specific property
export async function updatePropertyTemplateOffsetAction(propertyId: string, templateId: string, offsetMinutes: number) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('property_template_link')
      .update({ offset_minutes: offsetMinutes })
      // CRITICAL: We must match BOTH the property and the template!
      .match({ property_id: propertyId, template_id: templateId }); 

  if (error) throw new Error(error.message);
  
  revalidateTag('properties');
  return { success: true, error: null };
} catch (error) {
  console.error('Error updating property template offset:', error);
  return { success: false, error: error };
}}