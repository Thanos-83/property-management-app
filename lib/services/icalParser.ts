import ICAL from 'ical.js';
import { ParsedIcalEvent } from '@/types/bookingTypes';

export class IcalParser {
  /**
   * Parse iCal data from a string and extract booking events
   */
  static parseIcalData(icalData: string): ParsedIcalEvent[] {
    try {
      const jcalData = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      return vevents.map((vevent) => {
        const event = new ICAL.Event(vevent);

        return {
          uid: event.uid,
          start: event.startDate.toJSDate(),
          end: event.endDate.toJSDate(),
          summary: event.summary || 'Reserved',
          description: event.description || '',
          location: event.location || '',
        };
      });
    } catch (error) {
      console.error('Error parsing iCal data:', error);
      throw new Error(
        `Failed to parse iCal data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Fetch and parse iCal data from a URL
   */
  /**
   * Fetch and parse iCal data from a URL
   */
  static async fetchAndParseIcal(icalUrl: string): Promise<ParsedIcalEvent[]> {
    try {
      let icalData: string | undefined;

      // Handle local files directly from filesystem when running on server
      if (typeof window === 'undefined') {
        let relativePath: string | null = null;

        if (icalUrl.startsWith('/')) {
          relativePath = icalUrl;
        } else if (icalUrl.startsWith('http')) {
          try {
            const urlObj = new URL(icalUrl);
            // If the path points to our local 'icals' directory, read it directly
            // This is a robust way to handle 'localhost', '127.0.0.1', or custom domains like 'myapp.site'
            if (urlObj.pathname.startsWith('/icals/')) {
              relativePath = urlObj.pathname;
            }
          } catch (e) {
            // Invalid URL, ignore and proceed to fetch
          }
        }

        if (relativePath) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            
            // Construct absolute path to the file in public directory
            // Ensure relativePath doesn't start with / to avoid double slashes issues with path.join sometimes, 
            // though path.join usually handles it. strict public folder access.
            const filePath = path.join(process.cwd(), 'public', relativePath);
            
            // Read file directly
            icalData = fs.readFileSync(filePath, 'utf-8');
            // console.log(`[IcalParser] Read local file: ${filePath}`);
          } catch (err) {
            console.warn(`[IcalParser] Could not read local file ${relativePath} (${icalUrl}), falling back to fetch. Error:`, err);
            // icalData remains undefined, will fall through to fetch
          }
        }
      }

      // If we haven't read the data yet (client-side or fallback), fetch it
      if (!icalData) {
        const url = icalUrl.startsWith('/')
          ? `${
              process.env.NEXT_PUBLIC_BASE_URL || 'https://app.myapp.site:3000'
            }${icalUrl}`
          : icalUrl;

        // console.log(`[IcalParser] Fetching URL: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        icalData = await response.text();
      }

      return this.parseIcalData(icalData);
    } catch (error) {
      console.error('Error fetching iCal data:', error);
      throw new Error(
        `Failed to fetch iCal data from ${icalUrl}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Extract platform name from iCal data
   */
  static detectPlatform(description: string, prodId?: string): string {
    const desc = description.toLowerCase();
    const prod = prodId?.toLowerCase() || '';

    if (desc.includes('airbnb') || prod.includes('airbnb')) {
      return 'Airbnb';
    }
    if (desc.includes('booking') || prod.includes('booking')) {
      return 'Booking';
    }
    if (desc.includes('vrbo') || prod.includes('vrbo')) {
      return 'Vrbo';
    }
    if (desc.includes('expedia') || prod.includes('expedia')) {
      return 'Expedia';
    }

    // Fallback: try to extract from description
    const platformMatch = desc.match(/(airbnb|booking|vrbo|expedia)/i);
    if (platformMatch) {
      return (
        platformMatch[1].charAt(0).toUpperCase() + platformMatch[1].slice(1)
      );
    }

    return 'Unknown';
  }

  /**
   * Extract guest name from iCal event data
   */
  static extractGuestName(event: ParsedIcalEvent): string | undefined {
    // Try to extract guest name from location field (common in Booking.com)
    if (event.location && event.location.includes('Guest:')) {
      const guestMatch = event.location.match(/Guest:\s*([^,\n]+)/i);
      if (guestMatch) {
        return guestMatch[1].trim();
      }
    }

    // Try to extract from description
    if (event.description) {
      const guestMatch = event.description.match(/guest:\s*([^,\n]+)/i);
      if (guestMatch) {
        return guestMatch[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Validate if dates overlap
   */
  static datesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Calculate overlap days between two date ranges
   */
  static calculateOverlapDays(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): number {
    if (!this.datesOverlap(start1, end1, start2, end2)) {
      return 0;
    }

    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

    const diffTime = overlapEnd.getTime() - overlapStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }
}
