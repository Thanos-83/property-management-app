import { SettingsNav } from '@/components/settings/SettingsNav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col h-full bg-slate-50/50 min-h-screen'>
      {/* HEADER SECTION */}
      <div className='bg-white border-b border-border shadow-sm'>
        <div className='p-6 w-full'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>
            Settings
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage your account details, security, and subscription billing.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className='p-6 w-full flex-1'>
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 mt-4'>
          {/* LEFT COLUMN: NAVIGATION */}
          <aside className='shrink-0'>
            <SettingsNav />
          </aside>

          {/* RIGHT COLUMN: NESTED PAGES */}
          <div className='flex-1 '>
            <div className='bg-white rounded-xl border border-border shadow-sm p-6 lg:p-8'>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
