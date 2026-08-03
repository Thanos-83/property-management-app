import TasksTable from '@/components/tasks/TasksTable';
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton'; // NEW IMPORT
import {
  fetchTasksAction,
  fetchTaskPrioritiesAction,
  fetchTaskStatusDataAction,
} from '@/lib/actions/taskActions';
import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';
import { createClient } from '@/lib/utils/supabase/server';
import { CurrentUserDisplayInfo } from '@/types/taskTypes';
import { TaskTimeframeFilter } from '@/components/tasks/TaskTimeframeFilter';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function TasksPage({ searchParams }: PageProps) {
  const resolveParams = await searchParams;

  // 1. Fetch the current authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserInfo: CurrentUserDisplayInfo = {
    id: user?.id || '',
    full_name: user?.user_metadata?.full_name || 'Unknown',
    avatar: user?.user_metadata?.avatar_url,
  };

  // 2. Validate the timeframe parameter to ensure it is one of our allowed literal types
  const rowTimeframe = resolveParams?.timeframe;
  const timeframeString = Array.isArray(rowTimeframe)
    ? rowTimeframe[0]
    : rowTimeframe;

  const validTimeframes = ['upcoming', 'past', 'all'];
  const timeframeParam = timeframeString || 'upcoming';
  const timeframe = validTimeframes.includes(timeframeParam)
    ? (timeframeParam as 'upcoming' | 'past' | 'all')
    : 'upcoming';

  // 3. Fetch tasks and auxiliary data in parallel
  const [
    tasksResult,
    propertiesResult,
    membersResult,
    prioritiesResult,
    statusesResult,
  ] = await Promise.all([
    fetchTasksAction(timeframe),
    getPropertiesDataAction(),
    getTaskMembersAction(),
    fetchTaskPrioritiesAction(),
    fetchTaskStatusDataAction(),
  ]);

  // Check if the result is an array (successful fetch)
  const tasks = Array.isArray(tasksResult) ? tasksResult : [];

  const properties =
    propertiesResult.status === 200 && propertiesResult.properties
      ? propertiesResult.properties
      : [];

  const members =
    membersResult.status === 200 && membersResult.members
      ? membersResult.members.map((m) => ({
          id: m.id,
          name: m.first_name + ' ' + m.last_name,
        }))
      : [];

  const priorities =
    !prioritiesResult.error && prioritiesResult.data
      ? prioritiesResult.data
      : [];

  const statuses =
    !statusesResult.error && statusesResult.data ? statusesResult.data : [];

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold mb-4'>Tasks</h1>
        <div className='flex items-center gap-4'>
          <TaskTimeframeFilter />

          <CreateTaskButton
            properties={properties}
            members={members}
            priorities={priorities}
            statuses={statuses}
            currentUserId={user?.id || ''}
            currentUserInfo={currentUserInfo}
          />
        </div>
      </div>

      <div className='mt-6'>
        <TasksTable
          tableTasks={tasks}
          taskStatuses={statuses}
          taskPriorities={priorities}
          properties={properties}
          members={members}
          currentUserId={user?.id || ''}
          currentUserInfo={currentUserInfo}
        />
      </div>

      {!Array.isArray(tasksResult) && tasksResult.error && (
        <div className='mt-4 p-4 bg-red-100 text-red-800 rounded-md'>
          Error loading tasks: {tasksResult.error}
        </div>
      )}
    </div>
  );
}

export default TasksPage;
