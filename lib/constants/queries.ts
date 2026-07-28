export const TASK_DETAILS_QUERY = `
  *,
  team_members (
    id,
    email,
    first_name,
    last_name,
    phone
  ),
  property:properties!property_id (
    id,
    title
  ),
  task_list_item (
    id,
    is_completed,
    description,
    sort_order,
    completed_by_member,
    completed_datetime
  ),
  priority:task_priorities (
    id,
    priority,
    priority_color
  ),
  task_activity (
    id,
    user_id,
    activity_type,
    content,
    created_at
  ),
  attachments:task_attachments (
    id,
    file_name,
    file_url,
    file_type,
    created_at
  )
`;
