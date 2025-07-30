import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create a Supabase admin client for JWT verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify the JWT token using the service role client
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Get user error: ', userError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Invalid user token',
          details: userError?.message,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Authenticated user:', user.id, user.email);

    // Parse request body
    const { email, role } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Missing email or role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify that the authenticated user is admin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (profileError || !adminProfile) {
      return new Response(JSON.stringify({ error: 'Admin user not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (adminProfile.role_id !== 6) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Not an admin' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Invite user by email using admin client
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { role },
        redirectTo: `${Deno.env.get('APP_URL')}/invitation-accept`,
      }
    );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert invited member into team_members table
    const { error: teamMemberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        email,
        role_id: role,
        invited_by: user.id,
        status: 'invited',
      });

    if (teamMemberError) {
      return new Response(JSON.stringify({ error: teamMemberError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Invitation sent and team member created',
        user: data.user,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
