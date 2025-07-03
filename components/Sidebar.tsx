'use client';

import { useAppSelector } from '@/lib/storeHooks';
import { RootState } from '@/store/store';
import { SidebarLink } from './sidebar/SidebarLink';
import {
  LayoutGrid,
  BarChart,
  TrendingUp,
  ShoppingCart,
  Mail,
  // Store,
  LoaderCircle,
  MessageCircle,
  HelpCircle,
  CalendarDays,
} from 'lucide-react';
import FooterUpgradeCard from './sidebar/FooterUpgradeCard';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Sidebar() {
  const open = useAppSelector((state: RootState) => state.sidebar.open);
  const pathname = usePathname();
  const links = [
    {
      tag: '/',
      label: 'Overview',
      icon: <LayoutGrid size={18} />,
      active:
        pathname.split('/')[pathname.split('/').length - 1] === 'dashboard',
    },
    {
      tag: 'listings',
      label: 'Listings',
      icon: <TrendingUp size={18} />,
      active:
        pathname.split('/')[pathname.split('/').length - 1] === 'listings',
    },
    {
      tag: 'calendar',
      label: 'Calendars',
      icon: <CalendarDays size={18} />,
      active:
        pathname.split('/')[pathname.split('/').length - 1] === 'calendar',
    },
    {
      tag: 'bookings',
      label: 'Bookings',
      icon: <BarChart size={18} />,
      badge: 'NEW',
      active:
        pathname.split('/')[pathname.split('/').length - 1] === 'bookings',
    },
    {
      tag: '#',
      label: 'Orders',
      icon: <ShoppingCart size={18} />,
      badge: 2,
      active: pathname.split('/')[pathname.split('/').length - 1] === 'orders',
    },

    {
      tag: '#',
      label: 'Message',
      icon: <Mail size={18} />,
      badge: 5,
      active:
        pathname.split('/')[pathname.split('/').length - 1] === 'messages',
    },
    // { tag: '#', label: 'Sales Platform', icon: <Store size={18} /> },
  ];
  const miscLinks = [
    { tag: '#', label: 'Demo Mode', icon: <LoaderCircle size={18} /> },
    {
      tag: '#',
      label: 'Feedback',
      icon: <MessageCircle size={18} />,
      active:
        pathname.split('/')[pathname.split('/').length - 1] === 'feedback',
    },
    {
      tag: '#',
      label: 'Help and docs',
      icon: <HelpCircle size={18} />,
      active: pathname.split('/')[pathname.split('/').length - 1] === 'docs',
    },
  ];

  return (
    <aside
      className={[
        'fixed z-40 flex flex-col h-full transition-all duration-200 bg-white border-r-2 border-r-neutral/20',
        open ? 'w-[var(--sidebar-width)]' : '-translate-x-full',
      ].join(' ')}
      aria-label='Sidebar'>
      <div className='flex flex-col h-full px-4'>
        {/* Logo/Header */}
        <div className='flex items-center h-16 px-4 '>
          <Link className='font-bold text-primary text-xl underline' href='/'>
            LOGO Here
          </Link>
        </div>
        {/* Scrollable nav area */}
        <nav className='flex-1 overflow-y-auto py-2'>
          <div className='px-4 text-xs text-neutral mb-2 mt-2'>MAIN MENU</div>
          {links.map((l) => (
            <SidebarLink key={l.label} {...l} />
          ))}
          <div className='border-t border-neutral/20 my-2' />
          {miscLinks.map((l) => (
            <SidebarLink key={l.label} {...l} />
          ))}
        </nav>
        <div className='mb-4'>
          <FooterUpgradeCard />
        </div>
      </div>
    </aside>
  );
}
