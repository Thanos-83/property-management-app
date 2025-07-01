import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { SyncService } from '@/lib/services/syncService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log('User from syncing properties: ', user);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, syncAll } = body;

    let results;

    if (syncAll) {
      // Sync all properties for the user
      results = await SyncService.syncAllUserProperties(user.id);
    } else if (propertyId) {
      // Sync specific property
      results = await SyncService.syncProperty(propertyId);
    } else {
      return NextResponse.json(
        { error: 'Either propertyId or syncAll must be specified' },
        { status: 400 }
      );
    }

    // Calculate summary statistics
    const totalNewBookings = results.reduce(
      (sum, result) => sum + result.newBookings,
      0
    );
    const totalUpdatedBookings = results.reduce(
      (sum, result) => sum + result.updatedBookings,
      0
    );
    const successfulSyncs = results.filter((result) => result.success).length;
    const failedSyncs = results.filter((result) => !result.success).length;
    const allErrors = results.flatMap((result) => result.errors || []);

    return NextResponse.json({
      success: failedSyncs === 0,
      results,
      summary: {
        totalNewBookings,
        totalUpdatedBookings,
        successfulSyncs,
        failedSyncs,
        totalSyncs: results.length,
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // console.log('User Info in GET sync Method: ', user);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sync status for all properties
    const syncStatus = await SyncService.getSyncStatus(user.id);

    return NextResponse.json({
      success: true,
      syncStatus,
    });
  } catch (error) {
    console.error('Sync status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
