import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import DOMPurify from 'isomorphic-dompurify';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string; messageId: string }> }
) {
  try {
    const { accountId, messageId } = await params;
    const supabase = await createClient();

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account with access token (verify ownership)
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('access_token')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Fetch email body from Aurinko
    const response = await fetch(
      `https://api.aurinko.io/v1/email/messages/${messageId}`,
      {
        headers: { Authorization: `Bearer ${account.access_token}` },
        cache: 'no-store', // Don't cache email content
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch email' }, { status: response.status });
    }

    const emailData = await response.json();

    // Sanitize HTML (server-side)
    const cleanBody = DOMPurify.sanitize(emailData.body || emailData.bodyHtml || '', {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'div', 'span', 'ul', 'ol', 'li', 'img', 'h1', 'h2', 'h3', 'table', 'tr', 'td', 'th'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'target'],
      FORBID_TAGS: ['script', 'style', 'iframe'],
      FORBID_ATTR: ['onmouseover', 'onclick', 'onerror', 'onload'],
    });

    return NextResponse.json({ success: true, data: cleanBody });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
