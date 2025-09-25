// app/api/properties/route.ts
import { NextResponse } from 'next/server';

import { createApiClient } from '@/lib/utils/supabase/api';
import { propertySchema } from '@/lib/schemas/property';
import { revalidateTag } from 'next/cache';
import { testApiAuth } from '@/lib/utils/test-auth';

export async function POST(req: Request) {
  const supabase = await createApiClient(req);

  // Auth: get the user from supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log('User info in server POST API route: ', user);

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  let jsonBody;
  try {
    jsonBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  console.log('JSON Body: ', jsonBody);
  const parsed = propertySchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const { title, description, location, rooms, ical_url } = parsed.data;

  // Insert into database
  const { data, error } = await supabase
    .from('properties')
    .insert({
      title,
      description,
      location,
      rooms,
      ical_url,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.log('Error: ', error);
    return NextResponse.json({ error: error }, { status: 500 });
  }

  revalidateTag('properties');
  // revalidatePath('/dashboard/listings', 'page');
  return NextResponse.json({ property: data }, { status: 201 });
}

export async function GET(request: Request) {
  try {
    // Test the API auth function
    await testApiAuth(request);

    const supabase = await createApiClient(request);

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // console.log('User Info in GET properties Method: ', user);

    if (userError || !user) {
      console.log(
        'Error parsing user info in API Properties ROUTE: ',
        userError
      );
      return NextResponse.json(
        { error: 'Unauthorized User. Can not access User INFO' },
        { status: 401 }
      );
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
      return NextResponse.json({ error: error }, { status: status });
    }

    // console.log('Server Data: ', data);

    return NextResponse.json({ properties: data }, { status: 201 });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
