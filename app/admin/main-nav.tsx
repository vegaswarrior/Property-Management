'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { Building2, FileText, Wrench, CreditCard, Settings2, Wallet, Palette, TrendingUp, MessageCircle } from 'lucide-react';

const links = [
  {
    title: 'Properties',
    description: 'Manage buildings and units',
    href: '/admin/products',
    icon: Building2,
  },
  {
    title: 'Applications',
    description: 'Review rental applications',
    href: '/admin/applications',
    icon: FileText,
  },
  {
    title: 'Maintenance',
    description: 'Track work tickets',
    href: '/admin/maintenance',
    icon: Wrench,
  },
  {
    title: 'Rents & Evictions',
    description: 'Monthly rent status and notices',
    href: '/admin/revenue',
    icon: CreditCard,
  },
  {
    title: 'Payouts',
    description: 'Cash out collected rent',
    href: '/admin/payouts',
    icon: Wallet,
  },
  {
    title: 'Analytics',
    description: 'Financial reports & insights',
    href: '/admin/analytics',
    icon: TrendingUp,
  },
  {
    title: 'Contact Inbox',
    description: 'Support & contact requests',
    href: '/admin/messages',
    icon: MessageCircle,
  },
  {
    title: 'Tenant Comms',
    description: 'Tenant communications',
    href: '/admin/tenant-messages',
    icon: MessageCircle,
  },
  {
    title: 'Branding',
    description: 'Logo, subdomain & custom domain',
    href: '/admin/branding',
    icon: Palette,
  },
  {
    title: 'Settings',
    description: 'Team & property settings',
    href: '/admin/settings',
    icon: Settings2,
  },
];

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex flex-col gap-2 text-base text-white',
        className
      )}
      {...props}
    >
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2',
              isActive ? 'text-emerald-300' : 'text-white'
            )}
          >
            <Icon className='h-5 w-5 shrink-0' />
            <div className='flex flex-col'>
              <span className='font-medium text-sm'>{item.title}</span>
              <span className='text-xs text-slate-200'>{item.description}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNav;
