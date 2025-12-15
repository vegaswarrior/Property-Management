'use client';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNavLinks } from '@/lib/constants/admin-nav';
import { cn } from '@/lib/utils';

export default function AdminMobileDrawer() {
  const pathname = usePathname();

  return (
    <Drawer direction='left'>
      <DrawerTrigger asChild>
        <Button variant='outline' size='sm' className='md:hidden'>
          <MenuIcon className='h-5 w-5' />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='h-full max-w-sm bg-gradient-to-br from-slate-900 via-violet-900/40 to-slate-900 border-r border-white/10'>
        <DrawerHeader>
          <DrawerTitle className='text-white text-lg'>Admin Dashboard</DrawerTitle>
        </DrawerHeader>
        <div className='px-4 py-2 space-y-1 overflow-y-auto'>
          {adminNavLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <DrawerClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                      : 'text-white hover:bg-white/10'
                  )}
                >
                  <Icon className='h-5 w-5 shrink-0' />
                  <div className='flex flex-col'>
                    <span className='font-medium text-sm'>{item.title}</span>
                    <span className='text-xs text-slate-300/80'>{item.description}</span>
                  </div>
                </Link>
              </DrawerClose>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
