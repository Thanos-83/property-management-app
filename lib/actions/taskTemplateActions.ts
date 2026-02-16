'use server';
import { taskTemplateSchema, TaskTemplateSchemaType } from "../schemas/task-template";
import { createClient } from "@/lib/utils/supabase/server";
import { redirect } from "next/navigation";



// Create task template action
export const createTaskTemplateAction = async (taskData: TaskTemplateSchemaType) => {
  const parsed = taskTemplateSchema.safeParse(taskData);
  if (!parsed.success) {
    return { success: false, error: parsed.error, status: 400, data: null };
  }

  try {
    const supabase = await createClient();

    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not found', status: 401, data: null };
    }
    const { checklist, ...taskData } = parsed.data;


    // Step A: Insert the Parent Template
    // ---------------------------------------------------------
    const { data: template, error: tmplError } = await supabase
      .from('task_templates')
      .insert({
        host_id: user.id,
        name: taskData.name,
        task_type: taskData.task_type,
        description_notes: taskData.description_notes,
        default_priority_id: Number(taskData.priority) || null, // Handle 0 or undefined
        default_team_member_id: taskData.team_member_id || null, // Handle empty string
        is_active: true
      })
      .select('id')
      .single();

    if (tmplError) throw new Error(`Template Error: ${tmplError.message}`);
    const templateId = template.id;

    // ---------------------------------------------------------
    // Step B: Insert Checklist Items (The Recipe)
    // ---------------------------------------------------------
    if (checklist.length > 0) {
      const checklistRows = checklist.map((item) => ({
        template_id: templateId,
        description: item.description,
        sort_order: item.order // Preserve the order from UI
      }));

      const { error: itemsError } = await supabase
        .from('task_template_items')
        .insert(checklistRows);

      if (itemsError) throw new Error(`Checklist Error: ${itemsError.message}`);
    }
        // ---------------------------------------------------------
    // Step C: Insert Property Links (The Automation)
    // ---------------------------------------------------------
    if (taskData.property_ids.length > 0) {
      const linkRows = taskData.property_ids.map((propId) => ({
        template_id: templateId,
        property_id: propId,
        offset_minutes: taskData.offset_minutes,
        is_active: true
      }));

      const { error: linksError } = await supabase
        .from('property_template_link')
        .insert(linkRows);

      if (linksError) throw new Error(`Linking Error: ${linksError.message}`);
    }    
    
  } catch (error) {
    console.error('Error adding task:', error);
    return { success: false, error: 'Error adding task', status: 500, data: null };
  }

    // Redirect on success
  redirect('/dashboard/task-templates');
};


// Get task templates action
export const getTaskTemplatesAction = async () => {
  try {
    const supabase = await createClient();
    const { data: templates, error } = await supabase
      .from('task_templates')
      .select('*');
    if (error) throw error;
    return templates;
  } catch (error) {
    console.error('Error fetching task templates:', error);
    return [];
  }
};
