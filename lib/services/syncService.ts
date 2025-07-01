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

      // Sync each iCal URL
      for (const icalUrl of icalUrls) {
        const result = await this.syncIcalUrl(icalUrl);
        results.push(result);
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
   * Sync a single iCal URL
   */
  static async syncIcalUrl(icalSource: PropertyIcalUrls): Promise<SyncResult> {
    const supabase = await createClient();
    let newBookings = 0;
    let updatedBookings = 0;
    const errors: string[] = [];

    try {
      // Fetch and parse iCal data
      const parsedEvents = await IcalParser.fetchAndParseIcal(
        icalSource.ical_url
      );

      // Process each event
      for (const event of parsedEvents) {
        try {
          const result = await this.upsertBooking(event, icalSource);
          if (result.isNew) {
            newBookings++;
          } else {
            updatedBookings++;
          }
        } catch (error) {
          errors.push(
            `Failed to process booking ${event.uid}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Update last_synced timestamp
      await supabase
        .from('property_icals')
        .update({
          last_synced: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', icalSource.id);

      return {
        success: errors.length === 0,
        propertyId: icalSource.property_id,
        icalSourceId: icalSource.id,
        newBookings,
        updatedBookings,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error syncing iCal URL:', error);
      return {
        success: false,
        propertyId: icalSource.property_id,
        icalSourceId: icalSource.id,
        newBookings: 0,
        updatedBookings: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Insert or update a booking in the database
   */
  static async upsertBooking(
    event: ParsedIcalEvent,
    icalSource: PropertyIcalUrls
  ): Promise<{ isNew: boolean }> {
    const supabase = await createClient();

    // Detect platform and extract guest name
    const platform = IcalParser.detectPlatform(event.description || '');
    const guestName = IcalParser.extractGuestName(event);

    const bookingData = {
      property_id: icalSource.property_id,
      ical_source_id: icalSource.id,
      booking_uid: event.uid,
      platform,
      start_date: event.start.toISOString().split('T')[0], // Convert to date string
      end_date: event.end.toISOString().split('T')[0],
      guest_name: guestName,
      updated_at: new Date().toISOString(),
    };

    // Try to update existing booking first
    const { data: existingBooking, error: selectError } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_uid', event.uid)
      .eq('ical_source_id', icalSource.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(
        `Failed to check existing booking: ${selectError.message}`
      );
    }

    if (existingBooking) {
      // Update existing booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', existingBooking.id);

      if (updateError) {
        throw new Error(`Failed to update booking: ${updateError.message}`);
      }

      return { isNew: false };
    } else {
      // Insert new booking
      const { error: insertError } = await supabase.from('bookings').insert({
        ...bookingData,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        throw new Error(`Failed to insert booking: ${insertError.message}`);
      }

      return { isNew: true };
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
          `Failed to fetch user properties: ${propertiesError.message}`
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

      // Sync each property
      for (const property of properties) {
        const results = await this.syncProperty(property.id);
        allResults.push(...results);
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
        `
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
