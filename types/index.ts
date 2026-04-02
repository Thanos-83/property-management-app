// Add this to your types file
export type MessageStatus =
  // Processing States
  | 'pending_ai_extraction'
  | 'processed_success'
  | 'unlinked_pending_ical'
  | 'skipped_too_short'
  | 'failed_extraction'
  | 'failed_db_update'
  // Delivery States
  | 'received'
  | 'read'
  | 'sent'
  | 'delivered'
  | 'failed';
