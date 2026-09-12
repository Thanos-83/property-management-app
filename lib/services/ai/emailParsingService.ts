// lib/services/ai/emailParsingService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';
import { Client } from '@upstash/qstash';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
// Force native JSON output to guarantee schema compliance
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
});

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

export interface ExtractedBookingDetails {
  confirmation_code: string | null;
  guest_name: string | null;
  gross_amount: number | null;
  payout_amount: number | null;
  currency: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  platform: string | null;
}

export async function processInboundEmail(
  emailId: string,
  retryCount: number = 0,
) {
  const supabaseAdmin = createServiceClient();

  try {
    // 1. Fetch the raw email data using the ID
    const { data: messageData, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('subject, text_body, metadata, auth_member_id')
      .eq('id', emailId)
      .single();

    if (msgError || !messageData) throw new Error('Message not found');

    const bodyText =
      messageData.text_body || messageData.metadata.html_body || '';
    if (bodyText.length < 5) return;

    // 2. The Updated AADE-Compliant Prompt
    const systemPrompt = `
      Extract the booking details into a valid JSON object.
      Required Fields (return null if not found):
      - confirmation_code: The platform's unique reservation ID.
      - guest_name: Full name of the guest.
      - gross_amount: The TOTAL amount the guest paid (numeric). Critical for tax.
      - payout_amount: The NET amount deposited to the host after platform fees (numeric).
      - currency: 3-letter code (e.g., USD, EUR).
      - check_in_date: YYYY-MM-DD
      - check_out_date: YYYY-MM-DD
      - platform: "Airbnb", "Booking.com", etc.

      Subject: ${messageData.subject}
      Body: ${bodyText.substring(0, 15000)}
    `;

    const result = await model.generateContent(systemPrompt);
    const extractedData = JSON.parse(
      result.response.text(),
    ) as ExtractedBookingDetails;

    if (!extractedData.confirmation_code) return; // Exit if not a booking email

    // 3. Fallback Matching Strategy
    let match = null;

    // Attempt A: Match by UID (Best for Airbnb)
    const { data: uidMatch, error: uidError } = await supabaseAdmin
      .from('bookings')
      .select(
        `
        id,
        properties!inner ( 
          owner_id  
        )
      `,
      )
      .ilike('booking_uid', extractedData.confirmation_code.trim())
      .eq('properties.owner_id', messageData.auth_member_id)
      .maybeSingle();

    if (uidError) console.error('⚠️ DB Query Error (Attempt A):', uidError);
    match = uidMatch;

    // Attempt B: Match by Dates (Fallback for Booking.com)
    if (!match && extractedData.check_in_date && extractedData.check_out_date) {
      const { data: dateMatch, error: dateError } = await supabaseAdmin
        .from('bookings')
        .select(
          `
          id,
          properties!inner (
            owner_id
          )
        `,
        )
        .eq('properties.owner_id', messageData.auth_member_id)
        .eq('start_date', extractedData.check_in_date)
        .eq('end_date', extractedData.check_out_date)
        .maybeSingle();

      if (dateError) console.error('⚠️ DB Query Error (Attempt B):', dateError);
      match = dateMatch;
    }

    // 4. The Race Condition Solver (Time Travel!)
    if (!match) {
      if (retryCount < 3) {
        console.log(
          `Booking not found. Queuing retry ${retryCount + 1} in 30 minutes...`,
        );
        // Tell QStash to try again after the iCal has had time to sync!
        const baseUrl =
          process.env.QSTASH_CALLBACK_URL || process.env.NEXT_PUBLIC_APP_URL;
        await qstash.publishJSON({
          url: `${baseUrl}/api/jobs/process-email`,
          body: { emailId, retryCount: retryCount + 1 },
          delay: '2m',
        });
      } else {
        await supabaseAdmin
          .from('messages')
          .update({ status: 'failed_unlinked' })
          .eq('id', emailId);
      }
      return;
    }

    const bookingId = match.id;

    // 5. Enrich the Booking Table
    await supabaseAdmin
      .from('bookings')
      .update({
        guest_name: extractedData.guest_name,
        total_payout: extractedData.payout_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    // 6. Enrich the AADE Skeleton Invoice!
    await supabaseAdmin
      .from('invoices')
      .update({
        total_gross_amount: extractedData.gross_amount || 0.0,
        net_amount: extractedData.payout_amount || 0.0,
        client_name: extractedData.guest_name,
      })
      .eq('booking_id', bookingId)
      .eq('status', 'draft'); // The RLS Tax Safeguard - never update if transmitted!

    await supabaseAdmin
      .from('messages')
      .update({ status: 'processed_success', booking_id: bookingId })
      .eq('id', emailId);
  } catch (error) {
    console.error('Extraction Error:', error);
    await supabaseAdmin
      .from('messages')
      .update({ status: 'failed_extraction' })
      .eq('id', emailId);
  }
}
