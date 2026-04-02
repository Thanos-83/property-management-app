import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });



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


// ============================================================================
// Legacy code of using Aurinko - to be removed in version 2.0
// ============================================================================


export async function extractBookingDetails(
  emailBody: string,
  subject: string
): Promise<ExtractedBookingDetails | null> {
  try {
    const prompt = `
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
      - check_in_date: Format DD-MM-YYYY. If minutes and hours are shown include them.
      - check_out_date: Format DD-MM-YYYY. If minutes and hours are shown include them.
      - platform: One of "Airbnb", "Booking.com", "Vrbo", "Expedia", or "Other".

      Subject: ${subject}
      Body:
      ${emailBody.substring(0, 15000)} // Truncate to avoid token limits if extremely large, though Flash handles 1M+ context.
      
      Respond ONLY with the JSON object. Do not format as markdown code block.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('Gemini response:', response);
    console.log('Gemini response text:', response.text());
    // Clean up potential markdown formatting (```json ... ```)
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(jsonString) as ExtractedBookingDetails;
    console.log('Gemini response data:', data);

    if (!data.confirmation_code || !data.guest_email) {
      console.log('No confirmation code found in email:', subject);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Gemini Extraction Error:', error);
    return null;
  }
}

// =================================================================================
