
import '../../globals.css';
import TeamMembersHeader from '@/components/team-members/TeamMembersHeader';
import BottomNavigationMenu from '@/components/team-members/BottomNavigationMenu';
import { Toaster } from 'sonner';
export default function TeamDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
    <body>
    <div className="flex flex-col h-screen bg-slate-50">
      {/* TOP HEADER */}
      <TeamMembersHeader />

      {/* MAIN CONTENT AREA (Scrollable) */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* BOTTOM NAVIGATION (Mobile App Style) */}
      <BottomNavigationMenu />
    </div>
    <Toaster richColors position='top-right'/>
    </body>
    </html>
  );
}