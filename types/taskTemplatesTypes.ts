export interface UpdateTemplateParams {
  id: string; // The ID of the template being updated
  name: string;
  task_type: string; // Will be a UUID from the new table
  priority?: string; 
  team_member_id?: string | null; 
  description_notes?: string;
  offset_minutes: number; 
  checklist: { id?: string; description: string; order: number }[]; 
  property_ids: string[];
  is_active?: boolean;
}