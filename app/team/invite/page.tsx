import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/auth';
import { acceptTeamInvite } from '@/lib/actions/team.actions';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function TeamInvitePage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await props.searchParams;

  if (!token) {
    return (
      <div className='w-full max-w-md mx-auto'>
        <Card>
          <CardHeader>
            <CardTitle className='text-center'>Invalid invite</CardTitle>
            <CardDescription className='text-center'>
              The invite link is missing a token.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Link href='/sign-in' className='link block text-center'>
              Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = await auth();
  const callbackUrl = `/team/invite?token=${encodeURIComponent(token)}`;

  if (!session?.user?.id) {
    return (
      <div className='w-full max-w-md mx-auto'>
        <Card>
          <CardHeader className='space-y-2'>
            <CardTitle className='text-center'>Team invite</CardTitle>
            <CardDescription className='text-center'>
              Sign in or create an account to accept your invite on {APP_NAME}.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className='w-full inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
            >
              Sign in to accept
            </Link>
            <Link
              href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className='w-full inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50'
            >
              Create account
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await acceptTeamInvite(token);
  if (result.success) {
    redirect('/admin/team');
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader>
          <CardTitle className='text-center'>Could not accept invite</CardTitle>
          <CardDescription className='text-center'>{result.message}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Link href='/sign-in' className='link block text-center'>
            Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
