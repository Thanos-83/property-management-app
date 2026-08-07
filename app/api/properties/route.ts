// app/api/properties/route.ts
import { NextResponse } from 'next/server';

import { createApiClient } from '@/lib/utils/supabase/api';
import { createPropertySchema } from '@/lib/schemas/property';
import { revalidateTag } from 'next/cache';
import { BookingEvent } from '@/types/bookingTypes';

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
  const parsed = createPropertySchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', issues: parsed.error.format() },
      { status: 400 },
    );
  }

  const { title, description, location, rooms } = parsed.data;

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
    return NextResponse.json({ error: error }, { status: 500 });
  }

  revalidateTag('properties');
  // revalidatePath('/dashboard/listings', 'page');
  return NextResponse.json({ property: data }, { status: 201 });
}

export async function GET(request: Request) {
  try {
    const supabase = await createApiClient(request);

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log(
        'Error parsing user info in API Properties ROUTE: ',
        userError,
      );
      return NextResponse.json(
        { error: 'Unauthorized User. Can not access User INFO' },
        { status: 401 },
      );
    }

    // Select into database
    const { data, error, status } = await supabase
      .from('properties')
      .select(
        `
        *,
        property_icals(*),
        template_links:property_template_link(*),
        bookings(*)
      `,
      )
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error }, { status: status });
    }

    // --- NEW: Calculate Operational Stats in Memory ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparisons

    const propertiesWithStats = data.map((property) => {
      // 1. Filter out cancelled bookings and past bookings
      const upcomingBookings = (property.bookings || []).filter(
        (booking: BookingEvent) => {
          if (booking.status?.toLowerCase() === 'cancelled') return false;

          // Check if the check-out date is today or in the future
          const endDate = new Date(booking.end_date);
          return endDate >= today;
        },
      );

      // 2. Attach the count to the property object
      return {
        ...property,
        upcoming_bookings_count: upcomingBookings.length,
      };
    });

    // Return the enriched array with a 200 status (200 is standard for GET requests)
    return NextResponse.json(
      { properties: propertiesWithStats },
      { status: 200 },
    );
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
