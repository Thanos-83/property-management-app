'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { Conversation } from '@/types/chatTypes';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Fetch conversations from the database

export async function getInboxConversations() {
  try {
    const supabase = await createClient();

    // 1. Authenticate the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized access');
    }

    // 2. Fetch all messages (both inbound and outbound) for this specific host
    // We join the bookings table to get the guest's name and email for the UI
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(
        `
        id, 
        booking_id, 
        direction, 
        channel, 
        sender_contact, 
        text_body, 
        created_at, 
        status,
        guestInfo:bookings(guest_name, guest_email),
        propertyInfo:bookings(property:properties(title))
      `,
      )
      .eq('auth_member_id', user.id)
      .neq('status', 'pending_ai_extraction')
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Failed to fetch inbox data');
    }

    // 3. Group messages into distinct "Conversations" by Booking ID
    const conversationsMap = new Map<string, Conversation>();

    messages?.forEach((msg) => {
      // The true identifier of a thread is the Booking ID.
      // If it's null (e.g., a pre-booking inquiry), we fall back to the sender contact.
      const threadId = msg.booking_id || msg.sender_contact;

      if (!threadId) return; // Skip malformed rows

      // Because the SQL query is ordered by date descending, the FIRST time
      // we see a threadId, it is guaranteed to be the absolute newest message.
      if (!conversationsMap.has(threadId)) {
        // Handle Supabase's array vs object typing quirk for joins
        const guestInfoRaw = msg.guestInfo as unknown;
        const guestData = Array.isArray(guestInfoRaw)
          ? guestInfoRaw[0]
          : (guestInfoRaw as
              | { guest_email?: string; guest_name?: string }
              | undefined);

        const propertyInfoRaw = msg.propertyInfo as unknown;
        const propertyData = Array.isArray(propertyInfoRaw)
          ? propertyInfoRaw[0]
          : (propertyInfoRaw as
              | { property?: { title?: string } | { title?: string }[] }
              | undefined);
        const property = propertyData?.property;
        const extractedPropertyTitle = Array.isArray(property)
          ? property[0]?.title
          : property?.title;

        conversationsMap.set(threadId, {
          id: threadId, // Using booking_id as the unique conversation ID
          bookingId: msg.booking_id,
          // If guestData exists, use it. Otherwise fallback to the contact info from the message
          guestEmail: guestData?.guest_email || msg.sender_contact,
          guestName: guestData?.guest_name || 'Unknown Guest',

          // Add a little context if the latest message was sent BY the host
          latestMessage:
            msg.direction === 'outbound'
              ? `You: ${msg.text_body ? msg.text_body.substring(0, 55) + '...' : 'Sent a message'}`
              : msg.text_body
                ? msg.text_body.substring(0, 60) + '...'
                : 'Open to view message',

          lastMessageAt: msg.created_at,
          status: msg.status,
          channel: msg.channel, // Pass the channel so you can show an SMS/Email icon in the Left Pane!
          isUnread: msg.direction === 'inbound' && msg.status !== 'read', // Example logic for unread dots
          propertyTitle: extractedPropertyTitle,
        });
      }
    });

    // Convert the Map back into a clean array for the React frontend
    return {
      success: true,
      data: Array.from(conversationsMap.values()),
      error: null,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('getInboxConversations Error:', errorMessage);
    return { success: false, error: errorMessage, data: [] };
  }
}

export async function getConversationMessages(threadId: string) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized access');
    }

    if (!threadId) {
      throw new Error('Thread ID is required to fetch the conversation');
    }

    console.log('Fetching thread:', threadId);

    // 2. Check if the threadId is a Booking UUID or a raw Email string
    // This regex perfectly identifies Postgres UUIDs
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        threadId,
      );

    // 3. Build the Base Query
    let query = supabase
      .from('messages')
      .select(
        `id, sender_contact, recipient_contact, subject, text_body, direction, channel, created_at
        `,
      )
      .eq('auth_member_id', user.id)
      .order('created_at', { ascending: true }); // Oldest first for chat timeline

    let bookingInfo = null;
    // 4. Smart Routing based on the Thread Type
    if (isUuid) {
      // It's a booking! Fetch every message anchored to this booking UUID.
      // We don't care about sender/recipient emails anymore, the booking_id is the truth.
      query = query.eq('booking_id', threadId);
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`guest_name, guest_email, propertyInfo:properties(title)`)
        .eq('id', threadId)
        .single();
      if (bookingError) {
        console.error('Error fetching booking:', bookingError);
        throw new Error('Failed to fetch booking');
      }

      // Normalize propertyInfo correctly so that the title is retrieved
      // whether Supabase returns the relationship as an array or a single object.
      const propInfo = booking.propertyInfo as
        | { title: string }
        | { title: string }[];
      bookingInfo = {
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        propertyInfo: {
          title: Array.isArray(propInfo) ? propInfo[0]?.title : propInfo?.title,
        },
      };
    } else {
      // It's an inquiry! Fetch messages where booking_id is null AND it matches the contact.
      query = query
        .is('booking_id', null)
        .or(`sender_contact.eq.${threadId},recipient_contact.eq.${threadId}`);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching conversation messages:', messagesError);
      throw new Error('Failed to fetch conversation history');
    }

    // 5. Format the data perfectly for the Shadcn Chat UI
    const formattedMessages = messages.map((msg) => {
      // Look how easy this is now! We don't have to compare emails.
      // The database 'direction' column tells us exactly where to align the bubble.
      const isFromGuest = msg.direction === 'inbound';

      return {
        id: msg.id,
        text: msg.text_body || 'No plain text content available.',
        timestamp: msg.created_at,
        isFromGuest: isFromGuest, // true = Left side (Gray), false = Right side (Orange)
        senderEmail: msg.sender_contact,
        subject: msg.subject,
        channel: msg.channel, // 'email' or 'sms' - great for UI icons
      };
    });

    return { success: true, data: formattedMessages, bookingInfo };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('getConversationMessages Error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function getGuestBooking(bookingId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    if (!bookingId) return { success: false, error: 'No booking ID provided' };

    // Find the booking linked to this guest email
    // Adjust 'bookings' and column names to match your actual database schema
    console.log('Booking ID:', bookingId);
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        'id, guest_name, start_date, end_date, total_payout, guest_email, guest_phone, guest_count, adults, children, booking_uid, property_id, platform, custom_check_in_time, custom_check_out_time, status, booking_notes',
      )
      //   .eq('owner_id', user.id)
      // Assuming you saved the proxy email or real email to the booking:
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      // It's normal for a guest not to match perfectly yet if it's a new test,
      // so we don't throw, we just return null.
      console.log('No booking found for booking id:', bookingId);
      console.log('Booking error:', bookingError);
      return { success: true, data: null };
    }

    return { success: true, data: booking };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('getGuestBooking Error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Send email to guest
export async function sendHostReply(
  threadId: string, // <-- Changed from guestEmail to threadId!
  messageText: string,
  propertyName: string = 'Property Host',
) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the host
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    if (!threadId || !messageText) {
      throw new Error('Missing required fields');
    }

    // 2. The Smart Recipient Lookup
    let recipientEmail = '';
    let bookingId: string | null = null;

    // Check if the threadId is a Booking UUID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        threadId,
      );

    if (isUuid) {
      bookingId = threadId;

      // Look up the guest's email from the bookings table
      const { data: booking } = await supabase
        .from('bookings')
        .select('guest_email')
        .eq('id', bookingId)
        .single();

      if (booking?.guest_email) {
        recipientEmail = booking.guest_email;
      } else {
        // Fallback: If the booking doesn't have an email yet, grab the
        // sender_contact from the most recent inbound message in this thread
        const { data: latestMsg } = await supabase
          .from('messages')
          .select('sender_contact')
          .eq('booking_id', bookingId)
          .eq('direction', 'inbound')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        recipientEmail = latestMsg?.sender_contact || '';
      }
    } else {
      // If it's not a UUID, the threadId IS the email address (Unlinked inquiry)
      recipientEmail = threadId;
    }

    if (!recipientEmail) {
      throw new Error('Could not determine recipient email for this thread.');
    }

    // 3. Send the email via Resend
    const { error: resendError } = await resend.emails.send({
      from: `${propertyName} <reservations-1250f76d-47a6-4892-8d90-dcf96b5c1c41@cloudplatforms.space>`,
      to: [recipientEmail],
      subject: `Re: Your stay at ${propertyName}`,
      text: messageText,
    });

    if (resendError) {
      console.error('Resend failed to send reply:', resendError);
      throw new Error('Failed to send email through provider');
    }

    // 4. Save the outgoing message to the unified 'messages' table
    const { data: savedMessage, error: dbError } = await supabase
      .from('messages') // <-- NEW TABLE
      .insert({
        auth_member_id: user.id,
        booking_id: bookingId, // <-- Links to the timeline perfectly
        direction: 'outbound', // <-- Tells the UI to align this right (orange)
        channel: 'email', // <-- Ready for SMS later!
        sender_contact: `reservations-1250f76d-47a6-4892-8d90-dcf96b5c1c41@cloudplatforms.space`,
        recipient_contact: recipientEmail,
        subject: `Re: Your stay at ${propertyName}`,
        text_body: messageText,
        status: 'sent',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save outbound message to DB:', dbError);
      throw new Error('Message sent, but failed to save to history');
    }

    return { success: true, data: savedMessage, error: null };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('sendHostReply Error:', errorMessage);
    return { success: false, error: errorMessage, data: null };
  }
}
