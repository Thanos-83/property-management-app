import AddTaskModal from '@/components/tasks/AddTaskModal';
import TasksTable from '@/components/tasks/TasksTable';
// import TestTable from '@/components/tasks/TestTable';
import { fetchTasksAction, fetchTaskPrioritiesAction } from '@/lib/actions/taskActions';
import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';

async function TasksPage() {
  /* Fetch tasks and auxiliary data for AddTaskModal in parallel */
  const [tasksResult, propertiesResult, membersResult, prioritiesResult] =
    await Promise.all([
      fetchTasksAction(),
      getPropertiesDataAction(),
      getTaskMembersAction(),
      fetchTaskPrioritiesAction(),
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
        <TasksTable tableTasks={tasks} />
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
