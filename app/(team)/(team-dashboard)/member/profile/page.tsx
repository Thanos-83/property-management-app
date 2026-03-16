import { getMemberProfileAction } from '@/lib/actions/teamMemberActions';
import { MemberProfileClient } from '@/components/team-members/MemberProfileClient';
import { redirect } from 'next/navigation';

export default async function MemberProfilePage() {
  const response = await getMemberProfileAction();

  // If unauthorized or not found, kick them back to login
  if (response.error || !response.data) {
    redirect('/login');
  }

  return <MemberProfileClient profile={response.data} />;
}