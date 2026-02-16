'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Provider } from '@supabase/supabase-js';
import { getAurinkoAuthUrl as getAuthUrl } from '../aurinko';

/**
 * Sign In with Email/Password
 */
export async function signIn(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return redirect('/dashboard');
}

/**
 * Sign Up with Email/Password
 */
export async function signUp(formData: { email: string; password: string; fullName?: string }) {
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Check email to continue sign in process' };
}

/**
 * Sign In with OAuth Provider
 */
export async function signInWithProvider(provider: Provider) {
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error);
    return { success: false, error: error.message, message: error.message };
  }

  if (data.url) {
    return { success: true, data: { redirectUrl: data.url } };
  }

  return { success: false, error: 'No redirect URL returned' };
}

/**
 * Sign Out
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * Get Aurinko OAuth URL (Added for Email Connection)
 */
export async function getAurinkoAuthUrl(provider: 'Google' | 'Office365' = 'Google'): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const authUrl = getAuthUrl(provider);
    console.log('Aurinko Auth URL:', authUrl);
    return { success: true, data: authUrl };
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return { success: false, error: 'Failed to generate authentication URL' };
  }
}
