import { getTaskTemplatesAction } from '@/lib/actions/taskTemplateActions';
import TaskTemplatesClient from '@/components/task-templates/TaskTemplatesClient';
import { createClient } from '@/lib/utils/supabase/server';
import { checkAccess } from '@/lib/utils/gatekeeper'; // 1. Import Gatekeeper

export default async function TaskTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Ask the Gatekeeper
  const access = await checkAccess('task_templates');

  // Fetch the main templates
  const templates = await getTaskTemplatesAction();

  // Fetch auxiliary data needed for the Create/Edit form
  const [
    { data: properties },
    { data: teamMembers },
    { data: priorities },
    { data: taskTypes },
  ] = await Promise.all([
    supabase.from('properties').select('id, title').eq('owner_id', user?.id),
    supabase
      .from('team_members')
      .select('id, first_name, last_name')
      .eq('inviter_id', user?.id)
      .eq('has_portal_access', true),
    supabase
      .from('task_priorities')
      .select('id, name:priority, priority_color'),
    supabase
      .from('task_types')
      .select('id, name, icon_name, theme_color')
      .eq('is_active', true),
  ]);

  return (
    <TaskTemplatesClient
      initialTemplates={templates}
      properties={properties || []}
      teamMembers={teamMembers || []}
      priorities={priorities || []}
      taskTypes={taskTypes || []}
      canAdd={access.allowed}
      reason={access.reason}
      currentTier={access.currentTier}
    />
  );
}
