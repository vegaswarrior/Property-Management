import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';
import CredentialsSignInForm from './credentials-signin-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';

export const metadata: Metadata = {
  title: 'Sign In',
};

const SignInPage = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  const { callbackUrl } = await props.searchParams;

  const session = await auth();

  // Only redirect if there's a session AND a valid callback URL
  // This prevents redirect loops when signing out
  if (session && callbackUrl && callbackUrl !== '/sign-in') {
    return redirect(callbackUrl);
  }

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const apex = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  let landlordName: string | null = null;

  if (apex) {
    const bareHost = host.split(':')[0].toLowerCase();
    const apexLower = apex.toLowerCase();

    if (bareHost !== apexLower && bareHost.endsWith(`.${apexLower}`)) {
      const subdomain = bareHost.slice(0, bareHost.length - apexLower.length - 1);
      if (subdomain) {
        const landlord = await prisma.landlord.findUnique({ where: { subdomain } });
        if (landlord) {
          landlordName = landlord.name;
        }
      }
    }
  }

  const title = landlordName ? `Sign in to ${landlordName}` : 'Sign In';
  const description = landlordName
    ? `Access your ${landlordName} resident or landlord account.`
    : 'Sign in to your account';

  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader className='space-y-4'>
          <Link href='/' className='flex-center'>
            <Image
              src='/images/logo.svg'
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </Link>
          <CardTitle className='text-center'>{title}</CardTitle>
          <CardDescription className='text-center'>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <CredentialsSignInForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
