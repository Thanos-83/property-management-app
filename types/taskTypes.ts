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
