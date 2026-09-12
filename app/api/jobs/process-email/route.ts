// app/api/jobs/process-email/route.ts
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { processInboundEmail } from '@/lib/services/ai/emailParsingService';
import { NextResponse } from 'next/server';

// QStash verifies the cryptographic signature before executing
export const POST = verifySignatureAppRouter(async (req: Request) => {
  try {
    const { emailId, retryCount } = await req.json();

    if (!emailId) {
      return NextResponse.json({ error: 'Missing emailId' }, { status: 400 });
    }

    // Hand off to our updated AI service
    await processInboundEmail(emailId, retryCount);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('QStash Background Job Error:', error);
    // Throwing an error tells QStash to retry automatically based on your Upstash settings
    throw error;
  }
});
