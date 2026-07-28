// 1. Core / UI Option Types
export type TaskStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | string;

export interface TaskStatusOption {
  id: number;
  status: string;
  status_color: string;
  created_at?: string;
}

export interface TaskPrioritiesOption {
  id: number;
  priority: string;
  priority_color: string;
  created_at?: string;
}

export interface CurrentUserDisplayInfo {
  id: string;
  full_name: string;
  avatar?: string;
}

// 2. Relational Entity Types (Matches Supabase Tables exactly)
export interface TaskActivity {
  id: string;
  user_id: string;
  activity_type: 'system_log' | 'comment' | string;
  content: string;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  created_at?: string;
}

export interface TaskListItem {
  id: string;
  description: string;
  is_completed: boolean;
  sort_order: number;
  completed_by_member?: string | null;
  completed_datetime?: string | null;
}

export interface TaskBookingInfo {
  start_date: string;
  end_date: string;
  guest_name: string | null;
  platform: string;
}

// 3. 🌟 THE SINGLE SOURCE OF TRUTH 🌟
export interface DetailedTask {
  // Base columns
  id: string;
  property_id: string;
  booking_id?: string | null;
  assigner_id?: string | null;
  team_member_id?: string | null;
  type: string;
  status: TaskStatus;
  scheduled_date: string; // ISO date string
  notes?: string | null;
  created_at?: string;
  updated_at?: string;

  // Optional calendar UI fallbacks
  title?: string;
  resource?: string;

  // Relational Joins (Mapped perfectly to TASK_DETAILS_QUERY)
  team_members?: {
    id?: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  } | null;

  property?: {
    id: string;
    title: string;
    location?: string;
  } | null;

  priority?: {
    id: number | string;
    priority: string;
    priority_color: string;
  } | null;

  booking?: TaskBookingInfo | null;
  task_list_item?: TaskListItem[]; // Official database array
  taskTodos?: TaskListItem[]; // UI fallback array (optional)
  task_activity?: TaskActivity[];
  attachments?: TaskAttachment[];
}

// 4. Backward Compatibility Aliases
// By exporting these aliases, you won't have to rewrite imports in 20 different files.
// All your components that ask for TableTask or SingleTask will magically get the perfect DetailedTask!
export type TableTask = DetailedTask;
export type SingleTask = DetailedTask;

// Legacy alias just in case some old component is still looking for TaskTodo or TaskPriority
export type TaskTodo = TaskListItem;
export type TaskPriority = TaskPrioritiesOption;
