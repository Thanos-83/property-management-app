// Utility function to test authentication in different contexts
import { createClient } from './supabase/server';
import { createApiClient } from './supabase/api';
import { cookies } from 'next/headers';

export async function testServerAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function testApiAuth(request?: Request) {
  const supabase = await createApiClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function testApiCallFromServer() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const response = await fetch(`http://localhost:3000/api/properties`, {
      headers: {
        Cookie: cookieHeader,
      },
    });

    const data = await response.json();

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error, status: 500 };
  }
}
