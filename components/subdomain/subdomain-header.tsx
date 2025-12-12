import Image from 'next/image';
import Link from 'next/link';
import { Landlord, User } from '@prisma/client';

interface SubdomainHeaderProps {
  landlord: Landlord & {
    owner?: User | null;
  };
}

export default function SubdomainHeader({ landlord }: SubdomainHeaderProps) {
  const ownerEmail = landlord.owner?.email;
  const ownerPhone = landlord.owner?.phoneNumber;

  return (
    <header className="w-full bg-slate-900/60 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Company Name */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {landlord.logoUrl ? (
              <div className="relative h-12 w-12 md:h-16 md:w-16">
                <Image
                  src={landlord.logoUrl}
                  alt={`${landlord.name} logo`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-400/30">
                <span className="text-2xl font-bold text-violet-300">
                  {landlord.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-bold text-white">{landlord.name}</h1>
              <p className="text-xs text-slate-300/80">Property Management</p>
            </div>
          </Link>

          {/* Contact Info */}
          <div className="flex items-center gap-4 md:gap-6">
            {ownerPhone && (
              <a
                href={`tel:${ownerPhone}`}
                className="hidden md:flex items-center gap-2 text-sm text-slate-200 hover:text-violet-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{ownerPhone}</span>
              </a>
            )}
            {ownerEmail && (
              <a
                href={`mailto:${ownerEmail}`}
                className="hidden md:flex items-center gap-2 text-sm text-slate-200 hover:text-violet-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{ownerEmail}</span>
              </a>
            )}
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
