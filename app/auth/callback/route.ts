import { NextResponse } from 'next/server';
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/utils/supabase/server';
// import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // create a new profile, when signing up.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // console.log('Origin URL: ', origin);

      console.log('User in the in auth->callback route: ', user);

      const userProfile = await supabase
        .from('profiles')
        .select()
        .eq('id', user?.id)
        .single();

      console.log('User profile in auth->callback route: ', userProfile);
      if (!userProfile.data) {
        if (user) {
          const newUser = {
            id: user.id,
            email: user.user_metadata.email,
            role_id: 6,
            name: user.user_metadata.full_name,
          };
          const response = await supabase.from('profiles').insert([newUser]);
          console.log(
            'Response creating new user in auth->callback: ',
            response
          );
          if (!response.error) return NextResponse.redirect(`${origin}/login`);
        }
      }
      //
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
