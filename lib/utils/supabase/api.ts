import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For API routes - handles request cookies properly
export async function createApiClient(request?: Request) {
  if (request) {
    // When called from API route with request object
    const cookieHeader = request.headers.get('cookie') || '';

    // Parse cookies from the request header
    const parsedCookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.entries(parsedCookies).map(([name, value]) => ({
              name,
              value,
            }));
          },
          setAll(cookiesToSet) {
            // In API routes, we can't set cookies directly
            // They should be set in the response
            console.log('Cookies to set in API route:', cookiesToSet);
          },
        },
      }
    );
  } else {
    // Fallback to standard server client
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.log('Error setting cookies in API client:', error);
            }
          },
        },
      }
    );
  }
}
