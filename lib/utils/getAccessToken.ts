import { createClient } from '@/lib/utils/supabase/server';

/**
 * Server-side utility to get the current user's access token
 * Use this in server components or API routes to get a fresh token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const session = await supabase.auth.getSession();

    if (session.error || !session.data.session) {
      console.error('No active session:', session.error);
      return null;
    }

    const accessToken = session.data.session.access_token;

    // Log token info for debugging (first 50 chars only)
    console.log(
      'Access token retrieved:',
      accessToken.substring(0, 50) + '...'
    );
    console.log(
      'Token expires at:',
      new Date(session.data.session.expires_at! * 1000).toISOString()
    );

    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Client-side utility to get access token (for use in client components)
 */
export async function getAccessTokenClient(): Promise<string | null> {
  try {
    const response = await fetch('/api/get-access-token');
    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.accessToken || null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
