// supabase/functions/task-notification/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    const { type, new_record, old_record, old_status } = payload;
    const task = new_record || old_record; // Use new_record for insert/update, old_record for delete

    if (!task) {
      return new Response(JSON.stringify({ error: 'No task data found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = task.id;
    const taskType = task.type;
    const taskStatus = task.status;
    const propertyId = task.property_id;
    const teamMemberId = task.team_member_id;
    const previousStatus = old_status || (old_record ? old_record.status : null);

    console.log(`Task ID: ${taskId}, Type: ${taskType}, Status: ${taskStatus}, Prev Status: ${previousStatus}, Property: ${propertyId}, Member: ${teamMemberId}`);

    let message = '';
    if (type === 'INSERT') {
      message = `New task "${taskType}" created for property ${propertyId} and assigned. Status: ${taskStatus}.`;
    } else if (type === 'UPDATE') {
      message = `Task "${taskType}" (ID: ${taskId}) for property ${propertyId} updated. Status changed from ${previousStatus} to ${taskStatus}.`;
    } else if (type === 'DELETE') {
      message = `Task "${taskType}" (ID: ${taskId}) for property ${propertyId} was deleted. Last status: ${previousStatus}.`;
    } else {
      message = `Task "${taskType}" (ID: ${taskId}) changed.`;
    }

    // Create a Supabase client with the ANON key (it's safe here)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Call the DB function to get the service role key securely
    const { data: keyData, error: keyError } = await supabaseClient.rpc('get_service_role_key');

    if (keyError || !keyData) {
      console.error('Error fetching service role key:', keyError);
      return new Response(JSON.stringify({ error: 'Could not get service key' }), { status: 500 });
    }
    const SERVICE_ROLE_KEY = keyData;

    // Now create a client with the fetched service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      SERVICE_ROLE_KEY
    );

    if (teamMemberId) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('email, first_name, last_name')
        .eq('id', teamMemberId)
        .single();

      if (memberError) {
        console.error('Error fetching team member:', memberError);
        // Don't stop, just log, maybe the member was deleted
      } else if (member) {
        console.log(`Assigned to: ${member.first_name} ${member.last_name} (${member.email})`);
        message += ` Assigned to: ${member.first_name} ${member.last_name}.`;
        // Here you would integrate with an email service like Resend or SendGrid
        // await sendEmail(member.email, `Task Update: ${taskType}`, message);
        console.log(`Email simulated to ${member.email}: ${message}`);
      } else {
        console.log(`Team member with ID ${teamMemberId} not found.`);
      }
    } else {
      console.log('Task is not assigned to a specific team member.');
      // Maybe notify a default admin or property manager
    }

    return new Response(JSON.stringify({ success: true, message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error processing request:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
