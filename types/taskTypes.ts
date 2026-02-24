export type TaskStatus = 'pending' | 'accepted' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  propertyId: string;
  bookingId?: string; // Optional link to booking
  assigneeId?: string; // Optional user assigned to task
  type: string; // e.g., 'cleaning', 'maintenance'
  status: TaskStatus;
  scheduledDate: string; // ISO date string
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type TableTeamMemberInfo = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
};

export type TableTask = {
  id: string;
  property_id: string;
  booking_id?: string; // Optional link to booking
  assigner_id?: string; // Optional user assigned to task
  type: string; // e.g., 'cleaning', 'maintenance'
  status: TaskStatus;
  scheduled_date: string; // ISO date string
  notes?: string;
  createdAt: string;
  updatedAt: string;
  team_member_id: string;
  team_members: TableTeamMemberInfo | null;
  property: {
    title: string;
  };
};

export interface TaskPriority {
  id: number;
  created_at: string;
  priority: string;
  priority_color: string;
}

export interface TaskTodo {
  id: string;
  description: string;
  is_completed: boolean;
  sort_order: number;
  completed_by_member: string | null;
  completed_datetime: string | null;
}

export interface TaskBookingInfo {
  start_date: string;
  end_date: string;
  guest_name: string | null;
  platform: string;
}

export interface TaskPropertyInfo {
  title: string;
}

export interface SingleTask {
  id: string;
  assigner_id: string | null;
  booking_id: string | null;
  property_id: string;
  team_member_id: string | null;
  type: string;        // e.g., "Cleaning", "Maintenance"
  status: string;      // e.g., "pending", "completed"
  priority: number;    // e.g., 1, 2, 3
  scheduled_date: string; // "YYYY-MM-DD"
  notes: string | null;  
  created_at: string;
  updated_at: string;
  // Nested relational data from Supabase joins
  booking: TaskBookingInfo | null;
  property: TaskPropertyInfo | null;
  taskTodos: TaskTodo[];
  // Optional safety fallbacks based on how the calendar passes data
  title?: string;
  resource?: any; 
}

export interface TaskPrioritiesOption {
  id: number;
  priority: string;
  priority_color: string;
  created_at: string;
}

export interface TaskStatusOption {
  id: number;
  status: string;
  status_color: string;
  created_at: string;
}

