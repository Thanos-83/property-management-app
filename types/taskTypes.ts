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
  properties: {
    title: string;
  };
};
