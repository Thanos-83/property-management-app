import { getMyAssignedTasksAction } from '@/lib/actions/teamMemberActions';
import { TeamTasksClient } from '@/components/team-members/TeamTasksClient';

export default async function TeamDashboardPage() {
  // Fetch data on the server! No useEffect or loading spinners needed.
  const response = await getMyAssignedTasksAction();

  const tasks = response.data || [];
  const memberName = response.member?.first_name || 'Team Member';

  return (
    <div className='p-4 max-w-md mx-auto'>
      {/* Welcome Section */}
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">Hello, {memberName}</h1>
        <p className="text-sm text-muted-foreground">
          Let's look at your schedule for today.
        </p>
      </div>

      {/* Pass the prefetched data to the interactive client component */}
      <TeamTasksClient initialTasks={tasks} />
    </div>
  );
}