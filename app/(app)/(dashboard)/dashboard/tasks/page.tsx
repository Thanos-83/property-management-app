import AddTaskModal from '@/components/tasks/AddTaskModal';
import TasksTable from '@/components/tasks/TasksTable';
import {
  fetchTasksAction,
  fetchTaskPrioritiesAction,
  fetchTaskStatusDataAction,
} from '@/lib/actions/taskActions';
import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';
import { createClient } from '@/lib/utils/supabase/server';
import { CurrentUserDisplayInfo } from '@/types/taskTypes';

async function TasksPage() {
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

  // 2. Fetch tasks and auxiliary data for AddTaskModal in parallel
  const [
    tasksResult,
    propertiesResult,
    membersResult,
    prioritiesResult,
    statusesResult,
  ] = await Promise.all([
    fetchTasksAction(),
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
        <AddTaskModal
          properties={properties}
          members={members}
          priorities={priorities}
        />
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
