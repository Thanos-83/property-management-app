import { createClient } from '@/lib/utils/supabase/server';
import { IcalParser } from './icalParser';
import { SyncResult, ParsedIcalEvent } from '@/types/bookingTypes';
import { PropertyIcalUrls } from '@/types/propertyTypes';

export class SyncService {
  /**
   * Sync all iCal URLs for a specific property
   */
  static async syncProperty(propertyId: string): Promise<SyncResult[]> {
    const supabase = await createClient();
    const results: SyncResult[] = [];

    try {
      // Get all iCal URLs for this property
      const { data: icalUrls, error: icalError } = await supabase
        .from('property_icals')
        .select('*')
        .eq('property_id', propertyId);

      if (icalError) {
        throw new Error(`Failed to fetch iCal URLs: ${icalError.message}`);
      }

      if (!icalUrls || icalUrls.length === 0) {
        return [
          {
            success: false,
            propertyId,
            icalSourceId: '',
            newBookings: 0,
            updatedBookings: 0,
            errors: ['No iCal URLs found for this property'],
          },
        ];
      }

      //Parallel Execution for multiple iCal URLs
      // Instead of looping sequentially, we launch all syncs simultaneously.
      const syncPromises = icalUrls.map((icalUrl) => this.syncIcalUrl(icalUrl));

      // allSettled waits for ALL to finish, even if some fail.
      const settledResults = await Promise.allSettled(syncPromises);

      for (const settled of settledResults) {
        if (settled.status === 'fulfilled') {
          results.push(settled.value);
        } else {
          // If a promise completely rejects (rare due to internal try/catch, but safe)
          results.push({
            success: false,
            propertyId,
            icalSourceId: 'unknown',
            newBookings: 0,
            updatedBookings: 0,
            errors: [
              settled.reason instanceof Error
                ? settled.reason.message
                : 'Unknown promise rejection',
            ],
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing property:', error);
      return [
        {
          success: false,
          propertyId,
          icalSourceId: '',
          newBookings: 0,
          updatedBookings: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      ];
    }
  }

  /**
   * Sync a SINGLE specific iCal URL
   */
  static async syncSingleIcal(icalId: string): Promise<SyncResult[]> {
    const supabase = await createClient();

    try {
      // Fetch the specific iCal link data
      const { data: icalUrl, error: icalError } = await supabase
        .from('property_icals')
        .select('*')
        .eq('id', icalId)
        .single();

      if (icalError || !icalUrl) {
        throw new Error(
          `Failed to find calendar link: ${icalError?.message || 'Not found'}`,
        );
      }

      // We return it as an array to match the expected format of the API route
      const result = await this.syncIcalUrl(icalUrl);
      return [result];
    } catch (error) {
      console.error('Error syncing single iCal:', error);
      return [
        {
          success: false,
          propertyId: '',
          icalSourceId: icalId,
          newBookings: 0,
          updatedBookings: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      ];
    }
  }

  /**
   *  Bulk Upserts + The Diffing Engine
   */
  static async syncIcalUrl(icalSource: PropertyIcalUrls): Promise<SyncResult> {
    const supabase = await createClient();
    const errors: string[] = [];

    let newBookingsCount = 0;
    let updatedBookingsCount = 0;

    try {
      // 1. Fetch and parse iCal data into memory
      const parsedEvents = await IcalParser.fetchAndParseIcal(
        icalSource.ical_url,
      );

      // --- THE DIFFING ENGINE ---
      const today = new Date().toISOString().split('T')[0];
      // A. Fetch existing bookings for THIS specific iCal link
      const { data: existingBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('booking_uid')
        .eq('ical_source_id', icalSource.id)
        .gte('end_date', today);

      if (fetchError)
        throw new Error(
          `Failed to fetch existing bookings: ${fetchError.message}`,
        );

      // B. Create Sets for blazing fast comparisons
      const existingUids = new Set(
        (existingBookings || []).map((b) => b.booking_uid),
      );
      const incomingUids = new Set(parsedEvents.map((e) => e.uid));

      // C. Calculate exact New vs Updated numbers
      for (const uid of incomingUids) {
        if (existingUids.has(uid)) {
          updatedBookingsCount++;
        } else {
          newBookingsCount++;
        }
      }

      // D. Find Cancellations (Ghost Bookings)
      // "Which UIDs are in our database, but missing from the new iCal file?"
      const cancelledUids = [...existingUids].filter(
        (uid) => !incomingUids.has(uid),
      );

      // --------------------------

      // 2. Format ALL events into an array of database-ready objects
      if (parsedEvents.length > 0) {
        const bookingsToUpsert = parsedEvents.map((event) => {
          const platform = IcalParser.detectPlatform(event.description || '');
          const guestName = IcalParser.extractGuestName(event);

          return {
            property_id: icalSource.property_id,
            ical_source_id: icalSource.id,
            booking_uid: event.uid,
            platform,
            start_date: event.start.toISOString().split('T')[0],
            end_date: event.end.toISOString().split('T')[0],
            guest_name: guestName,
            status: 'confirmed', // Ensure the status is active if it was previously cancelled and re-booked
            updated_at: new Date().toISOString(),
          };
        });

        // 3. Send the entire array to Supabase in ONE single network request!
        const { error: upsertError } = await supabase
          .from('bookings')
          .upsert(bookingsToUpsert, {
            onConflict: 'booking_uid',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          throw new Error(`Bulk upsert failed: ${upsertError.message}`);
        }
      }

      // 4. Handle Cancellations (Ghost Bookings)
      if (cancelledUids.length > 0) {
        const { error: cancelError } = await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .in('booking_uid', cancelledUids)
          .eq('ical_source_id', icalSource.id); // Extra safety check

        if (cancelError) {
          console.error(`Failed to mark cancellations: ${cancelError.message}`);
          errors.push(
            `Failed to cancel ${cancelledUids.length} missing bookings.`,
          );
        }
      }

      // 5. Update last_synced timestamp
      await supabase
        .from('property_icals')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'success',
          last_error_message: null,
        })
        .eq('id', icalSource.id);

      return {
        success: errors.length === 0,
        propertyId: icalSource.property_id,
        icalSourceId: icalSource.id,
        newBookings: newBookingsCount,
        updatedBookings: updatedBookingsCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error syncing iCal URL:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await supabase
        .from('property_icals')
        .update({
          sync_status: 'error',
          last_error_message: errorMessage,
          updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', icalSource.id);

      return {
        success: false,
        propertyId: icalSource.property_id,
        icalSourceId: icalSource.id,
        newBookings: 0,
        updatedBookings: 0,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Sync all properties for a user
   */
  static async syncAllUserProperties(userId: string): Promise<SyncResult[]> {
    const supabase = await createClient();
    const allResults: SyncResult[] = [];

    try {
      // Get all properties for the user
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', userId);

      if (propertiesError) {
        throw new Error(
          `Failed to fetch user properties: ${propertiesError.message}`,
        );
      }

      if (!properties || properties.length === 0) {
        return [
          {
            success: false,
            propertyId: '',
            icalSourceId: '',
            newBookings: 0,
            updatedBookings: 0,
            errors: ['No properties found for this user'],
          },
        ];
      }

      // Parallel Execution for entire portfolio
      const syncPromises = properties.map((property) =>
        this.syncProperty(property.id),
      );
      const settledResults = await Promise.allSettled(syncPromises);

      for (const settled of settledResults) {
        if (settled.status === 'fulfilled') {
          allResults.push(...settled.value);
        } else {
          allResults.push({
            success: false,
            propertyId: 'unknown',
            icalSourceId: '',
            newBookings: 0,
            updatedBookings: 0,
            errors: [
              settled.reason instanceof Error
                ? settled.reason.message
                : 'Unknown error',
            ],
          });
        }
      }

      return allResults;
    } catch (error) {
      console.error('Error syncing all user properties:', error);
      return [
        {
          success: false,
          propertyId: '',
          icalSourceId: '',
          newBookings: 0,
          updatedBookings: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      ];
    }
  }

  /**
   * Get sync status for all properties
   */
  static async getSyncStatus(userId: string) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
          id,
          title,
          property_icals (
            id,
            platform,
            last_synced,
            status
          )
        `,
        )
        .eq('owner_id', userId);

      if (error) {
        throw new Error(`Failed to fetch sync status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }
}
