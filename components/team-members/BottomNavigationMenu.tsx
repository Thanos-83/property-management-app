'use client'
import { CheckSquare, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavigationMenu() {
  const pathname = usePathname();
  const isTasksActive = pathname === '/member/tasks';
  const isProfileActive = pathname === '/member/profile';
    return (
        <nav className="bg-white border-t border-border fixed bottom-0 w-full pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <Link 
            href="/member/tasks" 
            className={`flex flex-col items-center justify-center w-full h-full ${isTasksActive ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'}`}
          >
            <CheckSquare className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold tracking-wider uppercase">My Tasks</span>
          </Link>
          
          <Link 
            href="/member/profile" 
            className={`flex flex-col items-center justify-center w-full h-full ${isProfileActive ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'}`}
          >
            <UserCircle className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Profile</span>
          </Link>
        </div>
      </nav>
    );
}