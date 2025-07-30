import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/utils/supabase/middleware';
import { NextResponse } from 'next/server';

import { createClient } from './lib/utils/supabase/server';

export async function middleware(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // console.log('Loggedin User Data in Middleware: ', user);
  // If accessing team routes and not logged in
  if (req.nextUrl.pathname.startsWith('/team') && !user) {
    return NextResponse.redirect(new URL('/login?redirect=/team', req.url));
  }

  // If logged in, check if user has team member access for team routes
  if (req.nextUrl.pathname.startsWith('/team') && user) {
    try {
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('id, has_portal_access')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking team access:', error);
        // Could redirect to an error page or fall back to a safe default
      }

      if (!teamMember || !teamMember.has_portal_access) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch (err) {
      console.error('Unexpected error in middleware:', err);
      // Handle unexpected errors
      return NextResponse.redirect(new URL('/error', req.url));
    }
  }

  return await updateSession(req);
}

export const config = {
  matcher: [
    /*
     * Match all req paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/dashboard/:path*',
    // '/api/:path*',
    '/team/:path*',
  ],
};
