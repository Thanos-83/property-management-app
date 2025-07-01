'use client';
import { useAppDispatch } from '@/lib/storeHooks';
import { toggleSidebar } from '@/store/features/general/sidebarSlice';
import { Menu } from 'lucide-react';

export default function SidebarToggle() {
  const dispatch = useAppDispatch();
  return (
    <button
      className='text-xl'
      onClick={() => dispatch(toggleSidebar())}
      aria-label='Toggle sidebar'>
      <Menu />
    </button>
  );
}
