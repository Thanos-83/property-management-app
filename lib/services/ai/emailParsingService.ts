import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';

export interface ExtractedBookingDetails {
  confirmation_code: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_count: number | null;
  adults: number | null;
  total_payout: number | null;
  currency: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  platform: string | null;
}

export async function processInboundEmail(
  emailId: string,
  subject: string,
  bodyText: string,
  authMemberId: string,
) {
  const supabaseAdmin = createServiceClient();

  try {
    if (!bodyText || bodyText.length < 5) {
      console.log(`⏩ Skipping "${subject}" - Body is too short.`);
      await supabaseAdmin
        .from('messages') // <-- CHANGED
        .update({ status: 'skipped_too_short' })
        .eq('id', emailId);
      return;
    }

    console.log(`🤖 Sending to Gemini: "${subject}"`);

    const systemPrompt = `
      You are an AI specialized in parsing booking emails from platforms like Airbnb, Booking.com, Expedia, and Vrbo that include the booking details, such as the confirmation code, guest name, guest email, guest phone, guest count, total payout, currency, check-in date, check-out date, and platform.
      
      Analyze the following email content (HTML or Text) and extract the booking details into a valid JSON object.
      
      Required Fields (return null if not found):
      - confirmation_code: The platform's unique reservation ID (e.g., HM12345678, 1234.567.890).
      - guest_name: Full name of the guest.
      - guest_email: Email address of the guest (if available).
      - guest_phone: Phone number (if available).
      - guest_count: Number of guests (integer).
      - total_payout: The net amount paid to the host (numeric). If only "Total Price" is shown, use that.
      - currency: The 3-letter currency code (e.g., USD, EUR).
      - check_in_date: Format exactly as YYYY-MM-DD. Include time ONLY if present, formatted as YYYY-MM-DD HH:mm:ss.
      - check_out_date: Format exactly as YYYY-MM-DD. Include time ONLY if present, formatted as YYYY-MM-DD HH:mm:ss.
      - platform: One of "Airbnb", "Booking.com", "Vrbo", "Expedia", or "Other".

      Subject: ${subject}
      Body:
      ${bodyText.substring(0, 15000)}
      
      Respond ONLY with the JSON object. Do not format as markdown code block.
    `;

    const resultFromGemini = await model.generateContent(systemPrompt);
    const responseFromGemini = resultFromGemini.response;
    const textResult = responseFromGemini.text();

    if (!textResult) throw new Error('No text returned from Gemini');

    const jsonString = textResult
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const extractedData = JSON.parse(jsonString) as ExtractedBookingDetails;
    console.log('🎉 BOOKING DETECTED:', extractedData);

    if (
      !extractedData.confirmation_code ||
      extractedData.confirmation_code.trim() === ''
    ) {
      console.log('No confirmation code to match against.');
      return;
    }

    // --- Step D: Link to Booking (Cascade Strategy) ---
    let bookingId = null;
    const cleanBookingConfirmationCode = extractedData.confirmation_code.trim();

    // 1. Primary Match: By UID, ensuring it belongs to THIS host
    const { data: match, error: matchError } = await supabaseAdmin
      .from('bookings')
      .select('id, properties!inner(owner_id)')
      .ilike('booking_uid', cleanBookingConfirmationCode)
      .eq('properties.owner_id', authMemberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (matchError) {
      console.error('Database match error:', matchError);
    }

    if (match) {
      bookingId = match.id;
      console.log('🔗 Matched by UID:', bookingId);
    }

    console.log('Extracted Data:', extractedData);

    if (bookingId) {
      // --- Step E: Update (Enrich) the Booking ---
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          guest_name: extractedData.guest_name,
          guest_email: extractedData.guest_email,
          guest_phone: extractedData.guest_phone,
          adults: extractedData.adults,
          total_payout: extractedData.total_payout,
          start_date: extractedData.check_in_date,
          end_date: extractedData.check_out_date,
          booking_notes: extractedData.currency
            ? `Currency: ${extractedData.currency}`
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('❌ Failed to update booking:', updateError);
        await supabaseAdmin
          .from('messages') // <-- CHANGED
          .update({ status: 'failed_db_update' })
          .eq('id', emailId);
      } else {
        console.log('✅ Booking enriched successfully!');
        await supabaseAdmin
          .from('messages') // <-- CHANGED
          .update({
            status: 'processed_success',
            booking_id: bookingId, // <-- CRITICAL FIX: Use the UUID, not the confirmation code string!
          })
          .eq('id', emailId);
      }
    } else {
      console.log(
        '⚠️ Could not link email to any existing booking. (Awaiting iCal sync to catch up)',
      );
      await supabaseAdmin
        .from('messages') // <-- CHANGED
        .update({ status: 'unlinked_pending_ical' })
        .eq('id', emailId);
    }
  } catch (error) {
    console.error('Extraction Error:', error);
    await supabaseAdmin
      .from('messages') // <-- CHANGED
      .update({ status: 'failed_extraction' })
      .eq('id', emailId);
  }
}
