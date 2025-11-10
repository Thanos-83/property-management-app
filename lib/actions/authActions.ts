'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/utils/supabase/server';
import { headers } from 'next/headers';
import type { Provider } from '@supabase/supabase-js';
import {
  authSignInSchema,
  AuthSigninSchemaType,
  authSignUpSchema,
  AuthSignupSchemaType,
} from '../schemas/auth';
import { createServiceClient } from '../utils/supabase/supabaseDB';

export async function signIn(formData: AuthSigninSchemaType) {
  const supabase = await createClient();

  // create Admin client, using the SERVICE_ROLE_SECRET_KEY,  to bypass the RLS Policies
  const supabaseAdminClient = createServiceClient();

  const result = authSignInSchema.safeParse(formData);

  console.log('Result signin: ', result);

  if (!result.success) {
    return { success: result.success, error: result.error.issues };
  }

  try {
    const { data: profileData, error: profileError } = await supabaseAdminClient
      .from('profiles')
      .select('*')
      .eq('email', result.data.email)
      .single();

    if (!profileData) {
      return {
        success: false,
        error: `No User with email: "${result.data.email}". `,
      };
    }
    const { error } = await supabase.auth.signInWithPassword(result.data);

    if (error) {
      return {
        Success: false,
        error: 'Invalid login password. Please try again!',
      };
    }

    if (profileError) {
      throw new Error('Supabase error finding profile data!!');
    }

    return { success: true, error: '' };
  } catch (error) {
    console.error('Unexpected signin error:', error);
    return { success: false, error: `Unexpected signin error: ${error} ` };
  }
}

export async function signOut() {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect('/error');
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUp(formData: AuthSignupSchemaType) {
  const supabase = await createClient();

  // create Admin client, using the SERVICE_ROLE_SECRET_KEY,  to bypass the RLS Policies
  const supabaseAdminClient = createServiceClient();

  await new Promise((resolve) => setTimeout(resolve, 1000));
  const result = authSignUpSchema.safeParse(formData);

  if (!result.success) {
    return { success: result.success, error: result.error.issues };
  }

  try {
    const { data: profileData } = await supabaseAdminClient
      .from('profiles')
      .select('*')
      .eq('email', result.data.email)
      .single();
    console.log('Profile data: ', profileData);
    if (profileData) {
      return {
        success: false,
        error: `User with email: "${profileData.email}" already exists`,
      };
    }

    console.log('REsult data: ', result.data);
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: 'http://myapp.site:3000/auth/callback',
        data: {
          full_name: result.data.fullName,
          name: result.data.fullName,
          role: 'admin',
        },
      },
    });
    console.log('Error: ', error);
    if (error) {
      console.error('Signup error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      return { success: false, error: error.message };
    }
    console.log('User data 2: ', user);
  } catch (error) {
    console.error('Unexpected signup error:', error);
    return { success: false, error: `Unexpected signup error: ${error} ` };
  }
}

export async function signInWithProvider(provider: Provider) {
  //  Get  Headers
  const headersList = await headers();
  const origin = headersList.get('origin');
  // console.log('headers: ', [...headersList.entries()]);
  const redirectUrl = `${origin}/auth/callback`;
  console.log('🔍 Full redirect URL being sent:', redirectUrl);
  console.log('🔍 Origin header value:', origin);
  console.log('🔍 Host header value:', headersList.get('host'));
  // console.log('ORIGIN in Google Action: ', origin);
  // 1. Create supabase client
  const supabase = await createClient();

  // 2. Signin or Signup with Provider (creates a user in auth.users table)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.log('Error signing in with Google provider: ', error);
    return {
      status: 'fail',
      message: `Error creating account with ${provider}`,
      error: error,
      data: null,
    };
  } else {
    // return redirect(data.url);
    return {
      status: 'success',
      message: 'User successfully created',
      error: null,
      data: {
        redirectUrl: data.url,
      },
    };
  }
}

// ===================
