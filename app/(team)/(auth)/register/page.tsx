import RegisterTeamMemberForm from '@/components/collaborators/auth/RegisterTeamMemberForm';
import { updateMemberInvitationAction } from '@/lib/actions/taskMemberActions';
import { redirect } from 'next/navigation';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

export default async function MemberRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  if (params.token && params.email) {
    const tokenValue = Array.isArray(params.token) ? params.token[0] : params.token;

    // Validate the token and increment clicks securely
    const response = await updateMemberInvitationAction({
      token: tokenValue,
    });

    // 1. Used Token -> Send to login
    if (response?.status === 4) {
      redirect('/login');
    }

    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        {response?.status === 1 ? (
          // ONLY SHOW THE FORM IF STATUS IS EXACTLY 1
          <RegisterTeamMemberForm />
        ) : response?.status === 2 ? (
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-border p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className='text-xl font-bold text-foreground'>Link Security Locked</h1>
            <p className='text-sm text-muted-foreground'>
              This invitation link has been clicked too many times and has been automatically disabled for your security.
            </p>
            <p className='text-sm font-medium text-foreground pt-4 border-t border-border'>
              Please contact your property manager to request a new invitation.
            </p>
          </div>
        ) : response?.status === 3 ? (
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-border p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className='text-xl font-bold text-foreground'>Invitation Expired</h1>
            <p className='text-sm text-muted-foreground'>
              This invitation link has expired. Invitation links are only valid for 48 hours to protect your security.
            </p>
            <p className='text-sm font-medium text-foreground pt-4 border-t border-border'>
              Please contact your property manager to request a new invitation.
            </p>
          </div>
        ) : (
          // ANY OTHER STATUS (e.g. 5: Invalid Token)
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-border p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6" />
            </div>
            <h1 className='text-xl font-bold text-foreground'>Invalid Link</h1>
            <p className='text-sm text-muted-foreground'>
              {response?.message || "The link you followed is missing required security information or has been revoked."}
            </p>
          </div>
        )}
      </div>
    );
  } else {
    // Missing Token or Email Params completely
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-border p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6" />
          </div>
          <h1 className='text-xl font-bold text-foreground'>Invalid Link</h1>
          <p className='text-sm text-muted-foreground'>
            The link you followed is incomplete. Please make sure you copied the full link from your email.
          </p>
        </div>
      </div>
    );
  }
}