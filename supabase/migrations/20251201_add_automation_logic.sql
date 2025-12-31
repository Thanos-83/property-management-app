-- Migration script to add automation logic extracted from Gemini conversation

-- 1. The Final PostgreSQL Function (create_tasks_from_template_copy_update)
CREATE OR REPLACE FUNCTION public.create_tasks_from_template_copy_update()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
  property_automation_template_id UUID;
  new_task_id UUID;
  offset_interval INTERVAL;
  calculated_scheduled_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- On DELETE (Booking Cancellation)
  IF TG_OP = 'DELETE' THEN
    -- Option 2: Mark tasks as 'cancelled' or update notes
    UPDATE public.tasks
    SET status = 'cancelled', notes = COALESCE(notes, '') || E'\nBooking cancelled on ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE booking_id = OLD.id AND status != 'completed';

    RETURN OLD;
  END IF;

  -- On INSERT or UPDATE
  -- Only proceed if it's a new booking or if relevant fields (start_date, end_date) changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.end_date IS DISTINCT FROM OLD.end_date)) THEN
    -- Get the automation_template_id for the property
    SELECT automation_template_id INTO property_automation_template_id
    FROM public.properties
    WHERE id = NEW.property_id;

    -- If a template is linked to the property
    IF property_automation_template_id IS NOT NULL THEN
      -- Loop through task templates associated with the property's automation template
      FOR template_record IN
        SELECT *
        FROM public.tasks -- Assuming 'tasks' table holds the templates
        WHERE property_id = property_automation_template_id AND is_template = TRUE
      LOOP
        -- Calculate the offset
        offset_interval := template_record.schedule_offset_days * INTERVAL '1 day';

        -- Calculate scheduled_date based on booking start_date or end_date and offset
        IF template_record.schedule_relative_to = 'start_date' THEN
          calculated_scheduled_date := NEW.start_date + offset_interval;
        ELSE -- Default to end_date
          calculated_scheduled_date := NEW.end_date + offset_interval;
        END IF;

        -- Check if a task for this booking and template already exists (to avoid duplicates on UPDATE)
        IF TG_OP = 'UPDATE' THEN
          SELECT id INTO new_task_id FROM public.tasks
          WHERE booking_id = NEW.id
          AND template_task_id = template_record.id; -- Link to the template
        ELSE
          new_task_id := NULL;
        END IF;

        IF new_task_id IS NULL THEN -- Insert new task
          INSERT INTO public.tasks (
            property_id,
            booking_id,
            team_member_id,
            assigner_id,
            type,
            status,
            priority,
            scheduled_date,
            notes,
            is_template,
            template_task_id,
            schedule_offset_days,
            schedule_relative_to
          )
          VALUES (
            NEW.property_id, -- Link to the actual property
            NEW.id,          -- Link to the booking
            template_record.team_member_id,
            template_record.assigner_id,
            template_record.type,
            'pending',       -- Initial status for new tasks
            template_record.priority,
            calculated_scheduled_date,
            template_record.notes,
            FALSE,           -- This is not a template
            template_record.id, -- Link to the template it came from
            template_record.schedule_offset_days,
            template_record.schedule_relative_to
          )
          RETURNING id INTO new_task_id;

          -- Copy checklist items if they exist for the template
          INSERT INTO public.task_list_item (task_id, description, completed)
          SELECT new_task_id, description, FALSE
          FROM public.task_list_item
          WHERE task_id = template_record.id;

        ELSE -- Update existing task
          UPDATE public.tasks
          SET scheduled_date = calculated_scheduled_date,
              team_member_id = template_record.team_member_id, -- Re-apply template assignment
              assigner_id = template_record.assigner_id,
              priority = template_record.priority,
              notes = template_record.notes,
              status = 'pending' -- Reset status if date changed
          WHERE id = new_task_id AND status != 'completed';
        END IF;

      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. The Trigger (Updated for DELETE)
DROP TRIGGER IF EXISTS task_automation_trigger ON public.bookings;

CREATE TRIGGER task_automation_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_tasks_from_template_copy_update();

-- 3. Updated PostgreSQL Function (notify_team_of_task_change)
CREATE OR REPLACE FUNCTION public.notify_team_of_task_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Construct the payload including old_status if available
  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'new_record', row_to_json(NEW),
    'old_record', row_to_json(OLD),
    'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
  );

  -- Call the Edge Function via pg_net (no Authorization header for anon)
  -- REPLACE <YOUR_SUPABASE_PROJECT_REF> with your actual project ref or use an env var if possible in your setup
  -- For local dev it might be different, but keeping the structure
  PERFORM net.http_post(
    url:='https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/task-notification',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body:=payload
  );

  RETURN COALESCE(NEW, OLD); -- Return NEW for INSERT/UPDATE, OLD for DELETE
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.notify_team_of_task_change() TO postgres;
GRANT USAGE ON SCHEMA net TO postgres;

-- 4. The Notification Trigger
DROP TRIGGER IF EXISTS task_notification_trigger ON public.tasks;

CREATE TRIGGER task_notification_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_team_of_task_change();

-- 5. Function to securely get service role key (for Edge Function bypass)
CREATE OR REPLACE FUNCTION public.get_service_role_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault
AS $$
DECLARE
  service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE EXCEPTION 'Service role key not found in vault';
  END IF;

  RETURN service_key;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_service_role_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_role_key() TO anon;
