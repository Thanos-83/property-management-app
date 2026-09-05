'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { User, Shield, Bell, CreditCard, Blocks } from 'lucide-react';

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/dashboard/settings/profile',
    icon: User,
  },
  {
    title: 'Billing',
    href: '/dashboard/settings/billing',
    icon: CreditCard,
  },
  {
    title: 'Security',
    href: '/dashboard/settings/security',
    icon: Shield,
  },
  {
    title: 'Notifications',
    href: '/dashboard/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Integrations',
    href: '/dashboard/settings/integrations',
    icon: Blocks,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className='flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1'>
      {sidebarNavItems.map((item) => {
        // Check if the current route matches the href to highlight it
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              isActive
                ? 'bg-muted hover:bg-muted font-semibold text-primary'
                : 'hover:bg-transparent hover:underline text-muted-foreground',
              'justify-start h-10 px-4 transition-colors',
            )}>
            <item.icon
              className={cn(
                'mr-2 h-4 w-4',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
