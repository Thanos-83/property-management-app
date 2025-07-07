import StoreProvider from '@/components/providers/ReduxProvider';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <NuqsAdapter>
        <div className='flex min-h-screen'>
          <Sidebar />
          <div className='flex-1 flex flex-col'>
            <Header />
            <main className={`flex-1 overflow-y-auto bg-main-gray`}>
              {children}
            </main>
          </div>
        </div>
      </NuqsAdapter>
    </StoreProvider>
  );
}
