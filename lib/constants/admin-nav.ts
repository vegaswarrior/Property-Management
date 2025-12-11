import { Building2, FileText, Wrench, CreditCard, Settings2, Wallet, Palette, TrendingUp, MessageCircle, LucideIcon } from 'lucide-react';

export interface AdminNavLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const adminNavLinks: AdminNavLink[] = [
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

