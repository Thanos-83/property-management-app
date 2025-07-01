// Utility function to test authentication in different contexts
import { createClient } from './supabase/server';
import { createApiClient } from './supabase/api';
import { cookies } from 'next/headers';

export async function testServerAuth() {
  console.log('=== Testing Server Auth ===');
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log('Server Auth - User:', user?.email || 'No user');
  console.log('Server Auth - Error:', error?.message || 'No error');

  return { user, error };
}

export async function testApiAuth(request?: Request) {
  console.log('=== Testing API Auth ===');
  const supabase = await createApiClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log('API Auth - User:', user?.email || 'No user');
  console.log('API Auth - Error:', error?.message || 'No error');

  return { user, error };
}

export async function testApiCallFromServer() {
  console.log('=== Testing API Call from Server ===');

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
    console.log('API Call from Server - Status:', response.status);
    console.log('API Call from Server - Response:', data);

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log('API Call from Server - Error:', error);
    return { success: false, error, status: 500 };
  }
}
