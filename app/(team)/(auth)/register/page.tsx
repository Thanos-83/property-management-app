import RegisterTeamMemberForm from '@/components/collaborators/auth/RegisterTeamMemberForm';
import { updateMemberInvitationAction } from '@/lib/actions/taskActions';

async function MemberRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  console.log('Member Register Page search params: ', params);

  if (params.token && params.email) {
    // Ensure token is a string by taking the first item if it's an array
    const tokenValue = Array.isArray(params.token)
      ? params.token[0]
      : params.token;

    // Ensure email is a string by taking the first item if it's an array
    // const email = Array.isArray(params.email) ? params.email[0] : params.email;

    const response = await updateMemberInvitationAction({
      token: tokenValue,
    });
    console.log('Response calling update member invitation: ', response);

    return (
      <div>
        {response?.status === 2 ? (
          <div className='bg-amber-300 h-screen grid place-content-center'>
            <div>
              <h1 className='text-2xl font-bold text-center'>
                Template #{response.status}
              </h1>
              <h3 className='text-lg font-medium'>
                This is the template for the case where user have used the link
                more times than it is allowed
              </h3>
            </div>
          </div>
        ) : response?.status === 3 ? (
          <div className='bg-indigo-300 h-screen grid place-content-center'>
            <div>
              <h1 className='text-2xl font-bold text-center'>
                Template #{response.status}
              </h1>
              <h3 className='text-lg font-medium'>
                This is the template for the case where the token has expired!
              </h3>
            </div>
          </div>
        ) : (
          <div className='bg-slate-100 h-screen grid place-content-center'>
            <div>
              <h1 className='text-2xl font-bold text-center'>
                Main Template #{response?.status}
              </h1>
              <h3 className='text-lg font-medium'>
                This is the template for the case where the invited member
                finally creates their account!!!!!!
              </h3>
              <RegisterTeamMemberForm />
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className='bg-amber-200 h-screen grid place-content-center'>
        <div>
          <h1 className='text-2xl font-bold text-center'>Default Template</h1>
          <h3 className='text-lg font-medium'>
            This is the template for the case where no token or email exist
          </h3>
        </div>
      </div>
    );
  }
}

export default MemberRegisterPage;
