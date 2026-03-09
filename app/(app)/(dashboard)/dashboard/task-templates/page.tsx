import { getTaskTemplatesAction } from "@/lib/actions/taskTemplateActions";
import TaskTemplatesClient from "@/components/task-templates/TaskTemplatesClient";
import { createClient } from "@/lib/utils/supabase/server";

export default async function TaskTemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch the main templates
  const templates = await getTaskTemplatesAction();

  // 2. Fetch auxiliary data needed for the Create/Edit form
  // We use Promise.all to fetch them simultaneously for better performance
  const [
    { data: properties },
    { data: teamMembers },
    { data: priorities },
    { data: taskTypes }
  ] = await Promise.all([
    supabase.from('properties').select('id, title').eq('owner_id', user?.id),
    supabase.from('team_members').select('id, first_name, last_name').eq('inviter_id', user?.id).eq('has_portal_access', true),
    supabase.from('task_priorities').select('id, name:priority, priority_color'),
    supabase.from('task_types').select('id, name, icon_name, theme_color').eq('is_active', true)
  ]);

  // Pass data to the interactive client component
  return (
    <TaskTemplatesClient 
      initialTemplates={templates} 
      properties={properties || []}
      teamMembers={teamMembers || []}
      priorities={priorities || []}
      taskTypes={taskTypes || []}
    />
  );
}