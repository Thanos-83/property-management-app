'use server';
import { taskTemplateSchema, TaskTemplateSchemaType } from "../schemas/task-template";
import { createClient } from "@/lib/utils/supabase/server";
import { UpdateTemplateParams } from "@/types/taskTemplatesTypes";
import { revalidatePath } from "next/cache";
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
    const { checklist, ...cleanTaskData } = parsed.data;

    // ---------------------------------------------------------
    // FORMAT DATA BEFORE INSERT
    // ---------------------------------------------------------
    
    // 1. Translate the task_type UUID back to a text string for the database
    let finalTaskType = cleanTaskData.task_type;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTaskData.task_type);
    
    if (isUUID) {
      const { data: typeData } = await supabase
        .from('task_types')
        .select('name')
        .eq('id', cleanTaskData.task_type)
        .single();
        
      if (typeData) {
        finalTaskType = typeData.name;
      }
    }

    // 2. Handle 'unassigned' and empty fields properly
    const safePriorityId = (cleanTaskData.priority === 'undefined' || !cleanTaskData.priority) ? null : cleanTaskData.priority;
    const safeAssigneeId = (cleanTaskData.team_member_id === 'unassigned' || !cleanTaskData.team_member_id) ? null : cleanTaskData.team_member_id;

    // ---------------------------------------------------------
    // Step A: Insert the Parent Template
    // ---------------------------------------------------------
    const { data: template, error: tmplError } = await supabase
      .from('task_templates')
      .insert({
        host_id: user.id,
        name: cleanTaskData.name,
        task_type: finalTaskType,
        description_notes: cleanTaskData.description_notes,
        default_priority_id: safePriorityId,
        default_team_member_id: safeAssigneeId,
        is_active: cleanTaskData.is_active ?? true // Take from form, default to true
      })
      .select('id')
      .single();

    if (tmplError) throw new Error(`Template Error: ${tmplError.message}`);
    const templateId = template.id;

    // ---------------------------------------------------------
    // Step B: Insert Checklist Items (The Recipe)
    // ---------------------------------------------------------
    if (checklist && checklist.length > 0) {
      const checklistRows = checklist.map((item) => ({
        template_id: templateId,
        description: item.description,
        sort_order: item.order 
      }));

      const { error: itemsError } = await supabase
        .from('task_template_items')
        .insert(checklistRows);

      if (itemsError) throw new Error(`Checklist Error: ${itemsError.message}`);
    }

    // ---------------------------------------------------------
    // Step C: Insert Property Links (The Automation)
    // ---------------------------------------------------------
    if (cleanTaskData.property_ids && cleanTaskData.property_ids.length > 0) {
      const linkRows = cleanTaskData.property_ids.map((propId) => ({
        template_id: templateId,
        property_id: propId,
        offset_minutes: cleanTaskData.offset_minutes,
        is_active: true
      }));

      const { error: linksError } = await supabase
        .from('property_template_link')
        .insert(linkRows);

      if (linksError) throw new Error(`Linking Error: ${linksError.message}`);
    }    
    
    // Refresh the UI
    revalidatePath('/dashboard/task-templates');
    return { success: true, data: templateId };
    
  } catch (error: any) {
    console.error('Error adding task:', error);
    return { success: false, error: error.message || 'Error adding task', status: 500, data: null };
  }
};

// Update task template action
export async function updateTaskTemplateAction(params: UpdateTemplateParams) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // ---------------------------------------------------------
    // Step A: Format Data & Update Template Header (Parent)
    // ---------------------------------------------------------
    
    let finalTaskType = params.task_type;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.task_type);
    
    if (isUUID) {
      const { data: typeData } = await supabase
        .from('task_types')
        .select('name')
        .eq('id', params.task_type)
        .single();
        
      if (typeData) {
        finalTaskType = typeData.name;
      }
    }

    const safePriorityId = (params.priority === 'undefined' || params.priority === undefined || params.priority === '') 
      ? null 
      : params.priority;
      
    const safeAssigneeId = (params.team_member_id === 'unassigned' || params.team_member_id === 'undefined' || params.team_member_id === undefined || params.team_member_id === '') 
      ? null 
      : params.team_member_id;

    const { error: tmplError } = await supabase
      .from('task_templates')
      .update({
        name: params.name,
        task_type: finalTaskType, 
        description_notes: params.description_notes,
        default_priority_id: safePriorityId,
        default_team_member_id: safeAssigneeId,
        is_active: params.is_active,
      })
      .eq('id', params.id)
      .eq('host_id', user.id); 

    if (tmplError) throw new Error(`Template Error: ${tmplError.message}`);

    // ---------------------------------------------------------
    // Step B: Manage Checklist Items (The Recipe)
    // ---------------------------------------------------------
    
    const { data: existingItems } = await supabase
      .from('task_template_items')
      .select('id')
      .eq('template_id', params.id);

    const existingIds = new Set(existingItems?.map(item => item.id) || []);
    const incomingIds = new Set(params.checklist.map(item => item.id).filter(Boolean));

    const idsToDelete = [...existingIds].filter(id => !incomingIds.has(id));
    
    if (idsToDelete.length > 0) {
      await supabase
        .from('task_template_items')
        .delete()
        .in('id', idsToDelete);
    }

    if (params.checklist.length > 0) {
      const itemsToUpsert = params.checklist.map(item => {
        const row: any = {
          id: item.id || crypto.randomUUID(),
          template_id: params.id,
          description: item.description,
          sort_order: item.order // Mapping 'order' from form to 'sort_order' in DB
        };
        return row;
      });

      const { error: itemsError } = await supabase
        .from('task_template_items')
        .upsert(itemsToUpsert, { onConflict: 'id' });

      if (itemsError) throw new Error(`Updating Checklist Error: ${itemsError.message}`);
    }

    // ---------------------------------------------------------
    // Step C: Manage Property Links (The Automations)
    // ---------------------------------------------------------
    
    const { data: existingLinks } = await supabase
      .from('property_template_link')
      .select('id, property_id')
      .eq('template_id', params.id);

    const existingPropIds = new Set(existingLinks?.map(link => link.property_id) || []);
    const incomingPropIds = new Set(params.property_ids);

    const propIdsToDelete = [...existingPropIds].filter(id => !incomingPropIds.has(id));
    
    if (propIdsToDelete.length > 0) {
      await supabase
        .from('property_template_link')
        .delete()
        .eq('template_id', params.id)
        .in('property_id', propIdsToDelete);
    }

    if (params.property_ids.length > 0) {
      // FIX: We omit the 'id' completely and rely on the composite unique constraint!
      const linksToUpsert = params.property_ids.map(propId => ({
        template_id: params.id,
        property_id: propId,
        offset_minutes: params.offset_minutes,
        is_active: true
      }));

      const { error: linksError } = await supabase
        .from('property_template_link')
        .upsert(linksToUpsert, { onConflict: 'property_id,template_id' });

      if (linksError) throw new Error(`Property Linking Error: ${linksError.message}`);
    }

    // revalidatePath('/dashboard/task-templates');
    return { success: true };

  } catch (error: any) {
    console.error('Update Template Failed:', error);
    return { success: false, error: error.message || 'Failed to update template' };
  }
}

// Get task templates action
export const getTaskTemplatesAction = async () => {
  try {
    const supabase = await createClient();
    
    // We use Supabase's relation syntax to fetch the associated IDs 
    // so we can count how many checklist items and linked properties exist.
    // (We order by created_at to keep the list consistent)
    const { data: templates, error } = await supabase
      .from('task_templates')
      .select(`
        *,
        checklist_items:task_template_items(id, description, sort_order),
        linked_properties:property_template_link(id, property_id, offset_minutes, is_active),
        team_member:team_members(first_name, last_name),
        priority:task_priorities(priority, priority_color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the data to make it easy for the UI to consume
    const formattedTemplates = templates.map((template) => ({
      ...template,
      // Calculate the lengths of the returned arrays to get our counts
      checklistCount: template.checklist_items?.length || 0,
      propertiesCount: template.linked_properties?.length || 0,
      checklist_items: template.checklist_items?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [],
      linked_properties: template.linked_properties || []
    }));

    return formattedTemplates;
  } catch (error) {
    console.error('Error fetching task templates:', error);
    return []; // Return an empty array on fail so the UI doesn't crash
  }
};

// Delete task template action
export const deleteTaskTemplateAction = async (templateId: string) => {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', templateId)
      .eq('host_id', user.id); // Security: Ensure they own the template

    if (error) {
      throw new Error(`Delete Error: ${error.message}`);
    }

    // Refresh the UI
    // revalidatePath('/dashboard/task-templates');
    return { success: true, error: null };
    
  } catch (error: any) {
    console.error('Error deleting task template:', error);
    return { success: false, error: error.message || 'Error deleting task template' };
  }
};
