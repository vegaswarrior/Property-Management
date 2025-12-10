import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import { SessionProvider } from 'next-auth/react';
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <div className='flex h-screen flex-col'>
        <Header />
        <main className='flex-1 wrapper'>{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
