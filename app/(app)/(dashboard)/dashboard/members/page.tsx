import { createClient } from '@/lib/utils/supabase/server';
import TaskMembersClient from '@/components/members/TaskMembersClient';
import { redirect } from 'next/navigation';
import { fetchTeamMembersAction } from '@/lib/actions/taskMemberActions';
import { fetchTaskTypesAction } from '@/lib/actions/taskActions';

export default async function TaskMembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

   
const [teamMembersData, taskTypesData] = await Promise.all([
  fetchTeamMembersAction(),
  fetchTaskTypesAction()
])

const teamMembers = teamMembersData.members;
const taskTypes = taskTypesData.data;

  return (
    <div className='flex-1 bg-slate-50/50'>
      <TaskMembersClient 
        initialMembers={teamMembers || []} 
        taskTypes={taskTypes || []} 
      />
    </div>
  );
}