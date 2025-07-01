# Supabase Authentication Fix for Next.js Server-Side API Routes

## Problem Description

You were experiencing an issue where Supabase authentication worked in server pages and server actions using `supabase.auth.getUser()`, but failed when calling API routes from server components/actions. The authentication only worked when calling API routes from client components.

## Root Cause

The issue was caused by two main problems:

1. **Middleware not running for API routes**: The `/api/:path*` matcher was commented out in your middleware configuration, so authentication tokens weren't being refreshed for API routes.

2. **Cookie forwarding**: When calling API routes from server components/actions, the authentication cookies weren't being properly forwarded in the request headers.

## Solution Implemented

### 1. Fixed Middleware Configuration

**File: `middleware.ts`**

- Uncommented `/api/:path*` in the matcher configuration
- This ensures middleware runs for all API routes, refreshing auth tokens

### 2. Created API-Specific Supabase Client

**File: `lib/utils/supabase/api.ts`**

- Created `createApiClient()` function that properly handles request cookies
- Parses cookies from the request headers when called with a request object
- Falls back to standard server client when no request is provided

### 3. Updated API Routes

**File: `app/api/properties/route.ts`**

- Updated both GET and POST methods to use `createApiClient(request)`
- This ensures proper cookie handling in API routes

### 4. Fixed Server-to-API Communication

**Files: `app/dashboard/listings/page.tsx` and `lib/actions/propertiesActions.ts`**

- When calling API routes from server components/actions, now properly forward cookies
- Extract cookies using `cookies()` from Next.js
- Format cookies as header string and include in fetch requests

## Key Changes Made

### 1. Middleware Configuration

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*', // ✅ Uncommented this line
  ],
};
```

### 2. API Client for Request Handling

```typescript
export async function createApiClient(request?: Request) {
  if (request) {
    // Parse cookies from request headers
    const cookieHeader = request.headers.get('cookie') || '';
    // ... cookie parsing logic
  } else {
    // Fallback to standard server client
  }
}
```

### 3. Proper Cookie Forwarding

```typescript
// In server components/actions
const cookieStore = await cookies();
const cookieHeader = cookieStore
  .getAll()
  .map((cookie) => `${cookie.name}=${cookie.value}`)
  .join('; ');

const response = await fetch(`http://localhost:3000/api/properties`, {
  headers: {
    Cookie: cookieHeader,
  },
});
```

## Testing the Solution

### 1. Test Authentication in Different Contexts

Use the test utility functions in `lib/utils/test-auth.ts`:

```typescript
import {
  testServerAuth,
  testApiAuth,
  testApiCallFromServer,
} from '@/lib/utils/test-auth';

// Test server authentication
await testServerAuth();

// Test API authentication
await testApiAuth(request);

// Test API call from server with cookie forwarding
await testApiCallFromServer();
```

### 2. Check Console Logs

When you visit `/dashboard/listings`, you should see console logs showing:

- Server authentication working
- API authentication working when called from server components
- Successful API responses with user data

### 3. Verify in Browser Network Tab

1. Open browser dev tools
2. Go to Network tab
3. Visit `/dashboard/listings`
4. Check that API calls include proper Cookie headers
5. Verify API responses return user data instead of 401 errors

## Expected Behavior After Fix

✅ **Server Pages/Actions**: `supabase.auth.getUser()` returns authenticated user
✅ **API Routes from Client**: Authentication works (was already working)
✅ **API Routes from Server**: Authentication now works with proper cookie forwarding
✅ **Middleware**: Runs for all routes including API routes, refreshing tokens

## Files Modified

1. `middleware.ts` - Uncommented API routes matcher
2. `lib/utils/supabase/api.ts` - New API-specific Supabase client
3. `app/api/properties/route.ts` - Updated to use new API client
4. `app/dashboard/listings/page.tsx` - Added proper cookie forwarding
5. `lib/actions/propertiesActions.ts` - Added proper cookie forwarding
6. `lib/utils/test-auth.ts` - Test utilities for verification

## Important Notes

- The middleware now runs for all API routes, ensuring tokens are refreshed
- When calling API routes from server components/actions, always forward cookies
- The new `createApiClient()` function handles both scenarios (with/without request)
- All authentication contexts now work consistently

## Usage Examples

### In API Routes

```typescript
import { createApiClient } from '@/lib/utils/supabase/api';

export async function GET(request: Request) {
  const supabase = await createApiClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // User will now be properly authenticated
}
```

### In Server Components/Actions

```typescript
import { cookies } from 'next/headers';

// When calling API routes
const cookieStore = await cookies();
const cookieHeader = cookieStore
  .getAll()
  .map((cookie) => `${cookie.name}=${cookie.value}`)
  .join('; ');

const response = await fetch('http://localhost:3000/api/endpoint', {
  headers: { Cookie: cookieHeader },
});
```

This solution ensures consistent authentication behavior across all parts of your Next.js application.
