import { getSingleAssignedTaskAction } from '@/lib/actions/teamMemberActions';
import { redirect } from 'next/navigation';
import { TaskExecutionClient } from '@/components/team-members/TaskExecutionClient';

export default async function TaskExecutionPage({ params }: { params: Promise<{ taskID: string }> }) {
  const { taskID } = await params;
  
  const response = await getSingleAssignedTaskAction(taskID);

  // console.log('response fetching task: ', response)
  if (response.error || !response.data) {
    redirect('/member/tasks');
  }

  console.log('Response fetching task: ', response.data.task_activity)

  return ( 
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TaskExecutionClient initialTask={response.data} />

    </div>
  );
}