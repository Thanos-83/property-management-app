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

export interface TaskTemplateProperty {
  id: string;
  title: string;
}

export interface TaskTemplatePriority {
  id: string;
  name: string;
  priority_color: string;
}

export interface TaskTemplateTaskType {
  id: string;
  name: string;
  icon_name: string;
  theme_color: string;
}

export interface TaskTemplateChecklistItem {
  id: string;
  sort_order: number;
  description: string;
}

export interface TaskTemplateLinkedProperty {
  id: string;
  is_active: boolean;
  property_id: string;
  offset_minutes: number;
}

export interface TaskTemplatePrioritySingle {
  priority: string;
  priority_color: string;
}

export interface TaskTemplateTeamMember {
  id: string;
  first_name: string;
  last_name: string;
}

export interface TaskTemplate {
  id: string;
  host_id: string;
  name: string;
  task_type: string;
  default_priority_id: number | null;
  default_team_member_id: string | null;
  description_notes: string;
  is_active: boolean;
  created_at: string;
  checklist_items: TaskTemplateChecklistItem[];
  linked_properties: TaskTemplateLinkedProperty[];
  team_member: TaskTemplateTeamMember | null;
  priority: TaskTemplatePrioritySingle | null;
  checklistCount: number;
  propertiesCount: number;
}
