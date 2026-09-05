'use client';

import * as React from 'react';
import {
  Bot,
  Command,
  Frame,
  LayoutDashboard,
  Map,
  PieChart,
  // Send,
  // Settings2,
  // BookOpen,
  SquareTerminal,
  CalendarRange,
  HouseIcon,
  NotebookPen,
  MessagesSquareIcon,
  SettingsIcon,
} from 'lucide-react';

import { NavMain } from '@/components/dashboard/nav-main';
// import { NavProjects } from '@/components/dashboard/nav-projects';
import { NavSecondary } from '@/components/dashboard/nav-secondary';
import { NavUser } from '@/components/dashboard/nav-user';
import { User } from '@supabase/supabase-js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import {
  SidebarUsageWidget,
  UsageMetrics,
} from '@/components/dashboard/SidebarUsageWidget';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
  usageMetrics?: UsageMetrics;
}

export function AppSidebar({ user, usageMetrics, ...props }: AppSidebarProps) {
  const data = {
    navMain: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        isActive: false,
        items: [],
      },
      {
        title: 'Listings',
        url: '/dashboard/listings',
        icon: SquareTerminal,
        isActive: true,
        items: [],
      },
      {
        title: 'Bookings',
        url: '/dashboard/bookings',
        icon: NotebookPen,
        isActive: true,
        items: [],
      },
      {
        title: 'Chats',
        url: '/dashboard/chat',
        icon: MessagesSquareIcon,
        isActive: true,
        items: [],
      },
      {
        title: 'Calendar',
        url: '/dashboard/calendar',
        icon: CalendarRange,
        isActive: true,
        items: [],
      },
      {
        title: 'Task Management',
        url: '#',
        icon: Bot,
        items: [
          {
            title: 'Tasks',
            url: '/dashboard/tasks',
          },
          {
            title: 'Task Members',
            url: '/dashboard/members',
          },
          {
            title: 'Task Templates',
            url: '/dashboard/task-templates',
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: 'Home',
        url: `${process.env.NEXT_PUBLIC_URL}`,
        icon: HouseIcon,
      },
      {
        title: 'Settings',
        url: '/dashboard/settings/profile',
        icon: SettingsIcon,
      },
    ],
    projects: [
      {
        name: 'Design Engineering',
        url: '#',
        icon: Frame,
      },
      {
        name: 'Sales & Marketing',
        url: '#',
        icon: PieChart,
      },
      {
        name: 'Travel',
        url: '#',
        icon: Map,
      },
    ],
  };
  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <a href='#'>
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Command className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Acme Inc</span>
                  <span className='truncate text-xs'>Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className='mt-auto'>
          {/* <NavProjects projects={data.projects} /> */}
          <SidebarUsageWidget metrics={usageMetrics} />
          <NavSecondary items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
