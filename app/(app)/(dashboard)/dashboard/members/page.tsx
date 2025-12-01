import AddTaskMemberModal from '@/components/members/AddTaskMemberModal';
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

async function MembersPage() {
  // You can modify this to pass a default or selected propertyId as needed
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // console.log('User Session: ', session);
  console.log('User Data in Members Page: ', user ? user.email : 'No user');

  // Test API call with proper cookie forwarding from server component
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  // const members = await getMembers(user ? user.id : '');
  const response = await fetch('http://myapp.site:3000/api/members', {
    headers: {
      Cookie: cookieHeader,
    },
    next: {
      tags: ['members'],
    },
  });

  const { data: members } = await response.json();
  console.log('Members: ', members);

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold mb-4'>Team Members</h1>
        <AddTaskMemberModal />
      </div>

      {/* Test Edge Function Component */}
      <div className=''>
        <h4>List with all team members will go here!</h4>
        {members ? (
          <div>
            <ul>
              {members &&
                members?.map((member) => {
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
