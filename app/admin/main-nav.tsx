'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const links = [
  {
    title: 'Overview',
    href: '/admin/overview',
  },
  {
    title: 'Products',
    href: '/admin/products',
  },
  {
    title: 'Orders',
    href: '/admin/orders',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
  },
  {
    title: 'Users',
    href: '/admin/users',
  },
  {
    title: 'Messages',
    href: '/admin/messages',
  },
  {
    title: 'Create Blog',
    href: '/admin/blog/create',
  },
];

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();

  const activeLabel =
    links.find((l) => pathname.startsWith(l.href))?.title || 'Overview';

  return (
    <nav className={cn('flex items-center', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 px-3"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">{activeLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Admin Navigation
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {links.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  'w-full text-sm',
                  pathname.startsWith(item.href)
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {item.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default MainNav;
