import type { Metadata } from 'next';
import '@/assets/styles/globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { ChatWidget } from '@/components/shared/chat-widget';
import PageViewTracker from '@/components/analytics/page-view-tracker';

export const metadata: Metadata = {
  title: {
    template: `%s | Rocken My Vibe`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='bg-gradient-to-br from-slate-950 via-violet-800/60 to-slate-900 text-foreground flex flex-col min-h-screen overflow-x-hidden'>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={false}
          forcedTheme='dark'
          disableTransitionOnChange
        >
          <PageViewTracker />
          {children}
          <Toaster />
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}

