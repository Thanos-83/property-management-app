import AddTaskMemberModal from '@/components/members/AddTaskMemberModal';
import { createClient } from '@/lib/utils/supabase/server';
import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';
import { unstable_cache } from 'next/cache';

async function MembersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log('User Data in Members Page: ', user ? user.email : 'No user');

  const getMembers = unstable_cache(
    async (userId: string) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('inviter_id', userId);
      if (error) throw error;
      return data;
    },
    ['team_members'],
    { tags: ['members'] }
  );

  const members = user ? await getMembers(user.id) : [];
  console.log('Members: ', members);

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold mb-4'>Team Members</h1>
        <AddTaskMemberModal />
      </div>

      <div className=''>
        <h4>List with all team members will go here!</h4>
        {members && members.length > 0 ? (
          <div>
            <ul>
              {members.map((member) => {
                return (
                  <li key={member.id}>
                    {member.email}
                    <span className='ml-4'>{member.member_role}</span>

                    <span className='ml-4'>{member.status}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          'No members yet!'
        )}
      </div>
    </div>
  );
}

export default MembersPage;
