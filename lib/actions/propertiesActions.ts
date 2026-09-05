'use server';
import { createClient } from '../utils/supabase/server';
import {
  ManagePropertySchemaType,
  createPropertySchema,
  CreatePropertySchemaType,
  managePropertySchema,
  updateIcalSchema,
} from '../schemas/property';
import { propertyIcalSchema } from '../schemas/property';
import { checkAccess } from '@/lib/utils/gatekeeper';

import { revalidateTag } from 'next/cache';

export const addPropertyAction = async (
  propertyData: CreatePropertySchemaType,
) => {
  const supabase = await createClient();

  // 1. Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401, success: false };
  }

  // 2. THE GATEKEEPER CHECK (Backend Security)
  const access = await checkAccess('properties');

  if (!access.allowed) {
    // If they bypassed the frontend UI somehow, the server blocks them completely
    return {
      error: 'Plan limit reached or trial expired.',
      reason: access.reason,
      status: 403,
      success: false,
    };
  }

  // 3. Validate form data
  const parsedData = createPropertySchema.safeParse(propertyData);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      issues: parsedData.error.format(),
      status: 400,
    };
  }

  const { title, description, location, rooms } = parsedData.data;

  // 4. Insert into properties database
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

  // 5. INCREMENT USAGE COUNTER
  // We fetch their current count, then add 1 to it.
  const { data: currentUsage } = await supabase
    .from('user_usage')
    .select('properties_count')
    .eq('user_id', user.id)
    .single();

  if (currentUsage) {
    await supabase
      .from('user_usage')
      .update({ properties_count: currentUsage.properties_count + 1 })
      .eq('user_id', user.id);
  }

  // 6. Refresh UI and return success
  revalidateTag('properties');
  return { property: data, status: 201, success: true };
};

export const updatePropertyAction = async (
  propertyId: string,
  updatePropertyData: ManagePropertySchemaType,
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
  const parsedData = managePropertySchema.safeParse(updatePropertyData);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      issues: parsedData.error.format(),
      status: 400,
    };
  }

  const { title, description, location, rooms, image_url } = parsedData.data;

  const { error: updateError } = await supabase
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
  return { status: 200, result: 'success', error: null };
};

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
    `,
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

// Delete or Archive property action with gatekeeper check
export const deletePropertyAction = async (id: string) => {
  const supabase = await createClient();

  // 1. Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401, result: 'fail' };
  }

  // 2. CHECK FOR HISTORICAL DATA (Bookings)
  // We do a fast "HEAD" request just to get the count of bookings, not the actual data
  const { count: bookingsCount, error: countError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', id);

  if (countError) {
    return { status: 500, result: 'fail', error: countError };
  }

  // 3. DECIDE: HARD DELETE OR SOFT ARCHIVE
  if (bookingsCount === 0) {
    // --- PATH A: HARD DELETE ---
    // Safe to wipe completely because there is no financial history.
    // (Your database cascading rules will automatically delete the iCals, tasks, and template links).
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (deleteError) return { status: 500, result: 'fail', error: deleteError };
  } else {
    // --- PATH B: SOFT DELETE (ARCHIVE) ---
    // There are bookings, so we must protect the financial data for AADE.

    // A. Change status to archived
    const { error: archiveError } = await supabase
      .from('properties')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (archiveError)
      return { status: 500, result: 'fail', error: archiveError };

    // B. Unplug the sync: Hard delete the iCal URLs
    await supabase.from('property_icals').delete().eq('property_id', id);

    // C. Clean up upcoming clutter: Delete future/pending tasks (keep completed ones)
    await supabase
      .from('tasks')
      .delete()
      .eq('property_id', id)
      .in('status', ['pending', 'accepted', 'in_progress']);

    // D. Unlink templates so they stop generating new tasks
    await supabase
      .from('property_template_link')
      .delete()
      .eq('property_id', id);
  }

  // 4. DECREMENT USAGE COUNTER (Crucial!)
  // Whether we Hard Deleted or Archived, this property no longer counts against their active billing limit!
  const { data: currentUsage } = await supabase
    .from('user_usage')
    .select('properties_count')
    .eq('user_id', user.id)
    .single();

  if (currentUsage && currentUsage.properties_count > 0) {
    await supabase
      .from('user_usage')
      .update({ properties_count: currentUsage.properties_count - 1 })
      .eq('user_id', user.id);
  }

  // 5. Refresh UI
  revalidateTag('properties');

  return {
    status: 200,
    result: 'success',
    error: null,
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

  // --- NEW CHECK: Prevent Duplicate Platforms ---
  const { data: existingIcal, error: fetchError } = await supabase
    .from('property_icals')
    .select('id')
    .eq('property_id', validPropertyId)
    .eq('platform', validPlatform)
    .maybeSingle();

  if (fetchError) {
    console.error('[addPropertyIcalAction Check Error]:', fetchError);
    return { error: 'Failed to verify existing calendar links.', status: 500 };
  }

  if (existingIcal) {
    // Return a 409 Conflict with a friendly, readable error message
    return {
      error: `A calendar link for ${validPlatform} already exists for this property. You can only have one link per platform.`,
      status: 409,
      data: null,
    };
  }
  // ---------------------------------------------

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
    console.error('Error adding iCal URL: ', error);
    return { error: error.message, status: 500, data: null };
  }

  // Revalidate the listings page to update UI
  revalidateTag('properties');

  return { ical: data, status: 201, error: null };
};

// Update iCal URL Action
export const updatePropertyIcalAction = async (payload: {
  icalId: string;
  icalUrl: string | undefined;
  icalPlatform: string | undefined;
  propertyId: string;
}) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const parsedData = updateIcalSchema.safeParse(payload);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      issues: parsedData.error.format(),
      status: 400,
    };
  }

  const { icalId, icalUrl, icalPlatform, propertyId } = parsedData.data;

  // Prevent setting the platform to one that already exists (excluding the current one)
  const { data: existingIcal, error: fetchError } = await supabase
    .from('property_icals')
    .select('id')
    .eq('property_id', propertyId)
    .eq('platform', icalPlatform)
    .neq('id', icalId) // Ensure we don't conflict with ourselves
    .maybeSingle();

  if (fetchError) {
    console.error('[updatePropertyIcalAction Check Error]:', fetchError);
    return { error: 'Failed to verify existing calendar links.', status: 500 };
  }

  if (existingIcal) {
    return {
      error: `A calendar link for ${icalPlatform} already exists for this property.`,
      status: 409,
      data: null,
    };
  }

  // Update iCal URL
  const { data, error } = await supabase
    .from('property_icals')
    .update({
      ical_url: icalUrl,
      platform: icalPlatform,
      sync_status: 'pending',
      last_synced_at: null,
      last_error_message: null,
      updated_at: new Date().toISOString(), // Good practice to force timestamp update
    })
    .eq('id', icalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating iCal URL: ', error);
    return { error: error.message, status: 500, data: null };
  }

  revalidateTag('properties');

  return { ical: data, status: 200, error: null };
};

export const deletePropertyIcalAction = async (icalId: string) => {
  const supabase = await createClient();

  const response = await supabase
    .from('property_icals')
    .delete()
    .eq('id', icalId);

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

  return successResult;
};

// This is an Example of how to call API Route with forwarding cookies from a Server Action
export const fetchPropertyData = async () => {
  const supabase = await createClient();

  const {
    data: { user },
    // error: userError,
  } = await supabase.auth.getUser();

  // Test API call from server action with proper cookie forwarding
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const response = await fetch(`http://localhost:3000/api/properties`, {
    headers: {
      Cookie: cookieHeader,
    },
    next: {
      tags: ['properties'],
    },
  });

  const data = await response.json();

  return { user, apiData: data };
};

// ACTION 1: Toggle the template ON/OFF for ONE specific property
export async function togglePropertyTemplateAction(
  propertyId: string,
  templateId: string,
  isActive: boolean,
) {
  const supabase = await createClient();

  // We use upsert. If the link exists for this specific property, update it. If not, create it.
  const { error } = await supabase.from('property_template_link').upsert(
    {
      property_id: propertyId,
      template_id: templateId,
      is_active: isActive,
    },
    {
      // This relies on the unique constraint we built in your database schema
      onConflict: 'property_id,template_id',
    },
  );

  if (error) throw new Error(error.message);

  revalidateTag('properties');
  return { success: true };
}

// ACTION 2: Update the time offset for ONE specific property
export async function updatePropertyTemplateOffsetAction(
  propertyId: string,
  templateId: string,
  offsetMinutes: number,
) {
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
  }
}
