'use client';

import SidebarToggle from '@/components/sidebar/SidebarToogle';
import UserDropdownMenu from '@/components/sidebar/UserDropdownMenu';
import { Search, Filter, Share2 } from 'lucide-react';
import { useAppSelector } from '@/lib/storeHooks';
import { RootState } from '@/store/store';

export default function Header() {
  const open = useAppSelector((state: RootState) => state.sidebar.open);
  return (
    <header
      className={`sticky top-0 z-20 flex items-center px-6 h-16 bg-white border-b-2 transition-all duration-200 border-neutral/20  ${
        open ? 'ml-[var(--sidebar-width)]' : 'ml-0'
      }`}>
      <SidebarToggle />
      <div className='flex-1 flex ml-2'>
        <div className='relative w-full max-w-2xl'>
          <input
            className='rounded-lg border border-secondary px-4 py-2 w-full bg-bg text-dark focus:outline-primary'
            placeholder='Search anything here...'
          />
          <Search
            className='absolute right-3 top-2.5 text-secondary'
            size={16}
          />
        </div>
      </div>
      <div className='flex items-center gap-2 ml-4'>
        <button className='bg-secondary rounded p-2 hover:bg-primary-accent'>
          <Share2 size={16} />
        </button>
        <button className='bg-secondary rounded p-2 hover:bg-primary-accent'>
          <Filter size={16} />
        </button>
        <UserDropdownMenu />
      </div>
    </header>
  );
}
