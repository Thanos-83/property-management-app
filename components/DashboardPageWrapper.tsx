'use client';

import { useAppSelector } from '@/lib/storeHooks';
import { RootState } from '@/store/store';

function DashboardPageWrapper({ children }: { children: React.ReactNode }) {
  const open = useAppSelector((state: RootState) => state.sidebar.open);

  return (
    <div
      className={`flex min-h-screen transition-all duration-200  ${
        open ? 'ml-[var(--sidebar-width)]' : 'ml-0'
      } `}>
      {children}
    </div>
  );
}

export default DashboardPageWrapper;
