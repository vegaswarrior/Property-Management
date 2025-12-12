import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import CredentialsSignInForm from '@/app/(auth)/sign-in/credentials-signin-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

/**
 * Sign-in page for subdomains
 */
export default async function SubdomainSignInPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  const session = await auth();

  if (session) {
    redirect('/');
  }

  // Get landlord information for branding
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
  });

  const title = landlord ? `Sign in to ${landlord.name}` : 'Sign In';
  const description = landlord
    ? `Access your ${landlord.name} resident or landlord account.`
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
}
