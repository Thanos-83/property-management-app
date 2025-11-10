import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/utils/supabase/middleware';

import { createClient } from './lib/utils/supabase/server';

import { rootDomain } from '@/lib/utils';

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Local development environment
  if (url.includes('myapp.site') || url.includes('127.0.0.1')) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.myapp\.site/);
    console.log('Full url match: ', fullUrlMatch);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes('.myapp.site')) {
      return hostname.split('.')[0];
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] : null;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  console.log('=== MIDDLEWARE START ===');
  console.log('Pathname:', pathname);
  console.log('Search:', search);
  console.log('Subdomain:', subdomain);
  console.log('Url:', request.url);

  const sessionResponse = await updateSession(request);
  // Get user AFTER updateSession
  const supabase = await createClient();
  const {
    data: { user: userInfo },
  } = await supabase.auth.getUser();
  // console.log(
  //   'User Metadata AFTER updateSession:',
  //   userInfo?.user_metadata || 'No user'
  // );

  // console.log(
  //   'App Metadata AFTER updateSession:',
  //   userInfo?.app_metadata || 'No user'
  // );

  if (!subdomain) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/member')) {
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      if (pathname.startsWith('/auth')) {
        return NextResponse.redirect(
          new URL('http://app.myapp.site:3000/auth/login', request.url)
        );
      }
      return NextResponse.next();
    }
  }

  if (subdomain === 'app') {
    if (userInfo && userInfo.app_metadata.role === 'admin') {
      // Admin is logged in
      if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/register'
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    } else {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      console.log('Error: ', error);
      if (!pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      return NextResponse.next();
    }
  }

  // Add this AFTER the app subdomain logic:
  if (subdomain === 'collaborators') {
    console.log('User info in collaborators tenant: ', userInfo?.app_metadata);
    if (userInfo && userInfo.app_metadata.role === 'member') {
      // Keep the original pathname - don't force it to /dashboard
      if (
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register')
      ) {
        // Only redirect root to dashboard
        return NextResponse.redirect(new URL('/member/tasks', request.url));
      }
      // For all other paths, let them through as-is
      return NextResponse.next();
    } else {
      // Not authenticated or not a member - REDIRECT to login
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        return NextResponse.redirect(new URL('/login', request.url)); // Changed to redirect
      }
      return NextResponse.next();
    }
  }
  return sessionResponse;
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

    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|[\\w-]+\\.\\w+).*)',
    // '/dashboard/:path*',
    // '/api/:path*',
    // '/team/:path*',
  ],
};
