import AddTaskModal from '@/components/tasks/AddTaskModal';
import TasksTable from '@/components/tasks/TasksTable';
// import TestTable from '@/components/tasks/TestTable';
import { fetchTasksAction } from '@/lib/actions/taskActions';

async function TasksPage() {
  const tasksResult = await fetchTasksAction();
  // Check if the result is an array (successful fetch)
  const tasks = Array.isArray(tasksResult) ? tasksResult : [];
  console.log('tasks: ', tasks?.length);

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold mb-4'>Tasks</h1>
        <AddTaskModal />
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
