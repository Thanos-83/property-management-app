import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';
import { processInboundEmail } from '@/lib/services/ai/emailParsingService';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(req: Request) {
  try {
    // 1. Catch the incoming JSON payload from Resend
    const payload = await req.json();

    // 2. Safely extract Resend's nested "data" object
    const emailData = payload.data || {};

    console.log('📥 Incoming Email Payload:', emailData);
    // Map Resend's lowercase fields to our variables
    const fromAddress = emailData.from || '';
    const subject = emailData.subject || '';
    // Resend sends 'text' and 'html' for the body
    // const textBody = emailData.text || '';
    // const htmlBody = emailData.html || '';
    const attachments = emailData.attachments || [];
    const emailId = emailData.email_id || '';

    // Resend sends 'to' as an array, so we grab the first item [0]
    const toAddress = Array.isArray(emailData.to)
      ? emailData.to[0]
      : emailData.to || '';

    console.log(`Incoming mapped email to: ${toAddress}`);

    // 3. Extract the User ID from the 'To' address
    const match = toAddress.match(/reservations-(.*?)(?=@)/);
    const authMemberId = match ? match[1] : null;

    if (!authMemberId) {
      console.error('Could not identify user from To address:', toAddress);
      return NextResponse.json(
        { error: 'Unknown recipient format' },
        { status: 200 },
      );
    }

    let textBody = '';
    let htmlBody = '';

    const { data, error } = await resend.emails.receiving.get(emailId);

    console.log('📥 Incoming Email Data:', data);
    if (error) {
      console.error('Error fetching email:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email' },
        { status: 200 },
      );
    }

    textBody = data.text || '';
    htmlBody = data.html || '';

    // 4. Initialize Supabase Admin Client
    const supabaseAdmin = createServiceClient();

    // ==========================================
    // NEW: THREAD STITCHING (Waterfall Lookup)
    // ==========================================
    // Check if we already have a booking for this sender email
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('auth_member_id', authMemberId)
      .eq('guest_email', fromAddress)
      .order('created_at', { ascending: false }) // Get their most recent booking
      .limit(1)
      .single();

    const matchedBookingId = existingBooking?.id || null;

    // 5. Save the raw email to the new unified messages table
    const { data: savedEmail, error: dbError } = await supabaseAdmin
      .from('messages') // <-- NEW TABLE NAME
      .insert({
        auth_member_id: authMemberId,
        booking_id: matchedBookingId, // Automatically links to Timeline if found!
        direction: 'inbound', // <-- NEW FIELD
        channel: 'email', // <-- NEW FIELD
        sender_contact: fromAddress, // <-- RENAMED FIELD
        recipient_contact: toAddress, // <-- RENAMED FIELD
        subject: subject,
        text_body: textBody,
        status: 'pending_ai_extraction',
        metadata: {
          // <-- NEW JSONB FIELD
          html_body: htmlBody, // We store HTML here to keep the main schema clean
          resend_email_id: emailId,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database Error saving inbound email:', dbError);
      throw dbError;
    }

    console.log(
      `Successfully caught email for user ${authMemberId}. Saved as ID: ${savedEmail.id}. Linked to Booking: ${matchedBookingId}`,
    );

    // ==========================================
    // NEW: HANDLE ATTACHMENTS (If provided by the email service)
    // ==========================================
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      console.log(`Processing ${attachments.length} attachments...`);
      for (const file of attachments) {
        // Usually sent as { Name: "doc.pdf", Content: "base64...", ContentType: "application/pdf" }
        if (file.Content && file.Name) {
          try {
            // Convert Base64 string from webhook back to a binary buffer
            const fileBuffer = Buffer.from(file.Content, 'base64');
            const fileExt = file.Name.split('.').pop();
            const uniqueFileName = `${savedEmail.id}/${crypto.randomUUID()}.${fileExt}`;

            // Upload to a dedicated 'inbound_attachments' Supabase Storage bucket
            const { error: uploadError } = await supabaseAdmin.storage
              .from('inbound_attachments')
              .upload(uniqueFileName, fileBuffer, {
                contentType: file.ContentType || 'application/octet-stream',
                upsert: false,
              });

            if (uploadError) {
              console.error(
                `Failed to upload attachment ${file.Name}:`,
                uploadError,
              );
            } else {
              console.log(`Successfully uploaded attachment: ${file.Name}`);
            }
          } catch (attError) {
            console.error(
              `Error processing attachment ${file.Name}:`,
              attError,
            );
          }
        }
      }
    }

    // ==========================================
    // STEP 2: The LLM Trigger
    // ==========================================
    // We pass the saved ID, subject, text, and user ID to the parsing service.
    // We await it so the extraction finishes before the serverless function spins down.
    await processInboundEmail(
      savedEmail.id,
      subject || '',
      textBody || htmlBody || '',
      authMemberId,
    );

    // 5. Respond with 200 OK so the email provider knows we caught it
    return NextResponse.json(
      { success: true, message: 'Email received, logged, and processed' },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Inbound Email Webhook Error:', errorMessage);
    // If our server actually crashes, we return 500 so the email provider tries sending it again later.
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
