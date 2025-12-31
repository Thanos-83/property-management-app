import { subscribeToWebhooks } from '@/lib/actions/webhookActions';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated. Please log in first.',
        details: authError?.message 
      }, { status: 401 });
    }

    // Get email accounts for the authenticated user
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('id, email_address')
      .eq('user_id', user.id)
      .limit(1);

    if (accountsError) {
      return NextResponse.json({ 
        error: 'Database error',
        details: accountsError.message 
      }, { status: 500 });
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ 
        error: 'No email accounts found. Please connect an account first.',
        userId: user.id
      }, { status: 404 });
    }

    const accountId = accounts[0].id;
    
    // Register webhook
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || 
      'https://parametric-angie-semischolastically.ngrok-free.dev/api/webhooks/aurinko';
    
    const result = await subscribeToWebhooks(accountId, webhookUrl);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook registered successfully!',
        account: accounts[0].email_address,
        webhookUrl: webhookUrl,
        subscription: result.data
      });
    } else {
      return NextResponse.json({ 
        success: false,
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
