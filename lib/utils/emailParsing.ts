import { createClient } from '@/lib/utils/supabase/server';
import { extractBookingDetails } from '@/lib/ai/gemini';

export async function processEmailForBookings(
  messageSummary: any,
  accessToken: string,
  userId: string
) {
  const supabase = await createClient();

  // Step A: Fetch the FULL Email Content
  // The summary often omits the body or truncates it. We need the full HTML for the AI.
  const response = await fetch(
    `https://api.aurinko.io/v1/email/messages/${messageSummary.id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    console.warn(`⚠️ Failed to fetch full body for ${messageSummary.id}`);
    return;
  }

  const fullEmail = await response.json();

  // Step B: Select the best content for AI
  // Aurinko sometimes returns body as a string (direct HTML) or an object { content: "...", contentType: "html" }
  let emailBody = '';
  if (typeof fullEmail.body === 'string') {
     emailBody = fullEmail.body;
  } else if (fullEmail.body?.content) {
     emailBody = fullEmail.body.content;
  } else if (fullEmail.body?.text) {
     emailBody = fullEmail.body.text;
  }

  // console.log('Email body in emailParsing function:', emailBody.substring(0, 100) + '...');

  if (!emailBody || emailBody.length < 5) {
    console.log(`⏩ Skipping "${fullEmail.subject}" - Body length ${emailBody.length} is too short.`);
    return;
  }

  console.log(`🤖 Sending to Gemini: "${fullEmail.subject}"`);

  // Step C: AI Extraction
  const extractedData = await extractBookingDetails(
    emailBody,
    fullEmail.subject
  );

  if (!extractedData) {
    console.log(`⚪ No booking data in: "${fullEmail.subject}"`);
    return;
  }

  // --- SUCCESS! We found a booking. ---
  console.log('🎉 BOOKING DETECTED:', extractedData);

  // Step D: Link to Booking (Cascade Strategy)
  // 1. Primary: Match by Booking UID (Confirmation Code)
  let bookingId = null;

  if (extractedData.confirmation_code) {
    const { data: match } = await supabase
      .from('bookings')
      .select('id')
      .ilike('booking_uid', `%${extractedData.confirmation_code}%`)
      .single();
    
    if (match) {
      bookingId = match.id;
      console.log('🔗 Matched by UID:', bookingId);
    }
  }

  // 2. Secondary: Match by Dates + Property (Fallback)
  // (Not implemented consistently yet as agreed)

  if (bookingId) {
    // Step E: Update (Enrich) the Booking
    const { error } = await supabase
      .from('bookings')
      .update({
        guest_name: extractedData.guest_name,
        guest_email: extractedData.guest_email,
        guest_phone: extractedData.guest_phone,
        guest_count: extractedData.guest_count,
        total_payout: extractedData.total_payout,
        currency: extractedData.currency,
        platform_confirmation_code: extractedData.confirmation_code,
        is_enriched: true,
        source_message_id: messageSummary.id
      })
      .eq('id', bookingId);

    if (error) {
       console.error('❌ Failed to update booking:', error);
    } else {
       console.log('✅ Booking enriched successfully!');
    }
  } else {
    console.log('⚠️ Could not link email to any existing booking.');
  }
}
