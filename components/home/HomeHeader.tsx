'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Menu, LogOut, LayoutDashboard, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/lib/actions/authActions';

type UserType = {
  name: string;
  email: string;
  avatar: string;
};

const navLinks = [
  { title: 'Features', url: '#features' },
  { title: 'Workflow', url: '#how-it-works' },
  { title: 'Pricing', url: '#pricing' },
  { title: 'FAQ', url: '#faq' },
];

export const HeaderHome = ({ user }: { user: UserType | null }) => {
  return (
    // 1. The Outer Wrapper: Fixed to top, slight margin, centered
    <header className='fixed inset-x-0 top-4 z-[50] mx-auto w-full max-w-6xl px-4 transition-all duration-300'>
      {/* 2. The "Pill": Glassmorphism, rounded-full, subtle shadow */}
      <div className='relative flex h-14 items-center justify-between rounded-full border border-zinc-200/60 bg-white/70 px-4 shadow-sm backdrop-blur-2xl sm:px-6'>
        {/* --- LEFT: LOGO --- */}
        <div className='flex shrink-0 items-center'>
          <Link
            href='/'
            className='flex items-center gap-2 font-bold text-lg text-zinc-950 tracking-tight transition-transform hover:scale-105'>
            <div className='flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white shadow-sm'>
              <Home size={16} strokeWidth={2.5} />
            </div>
            HostOS
          </Link>
        </div>

        {/* --- CENTER: NAVIGATION (Hidden on Mobile) --- */}
        {/* Absolute positioning ensures it is always perfectly centered */}
        <nav className='flex-1 justify-center hidden md:flex items-center gap-8'>
          {navLinks.map((link) => (
            <Link
              key={link.title}
              href={link.url}
              className='text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors'>
              {link.title}
            </Link>
          ))}
        </nav>

        {/* --- RIGHT: AUTH / USER MENU --- */}
        <div className='flex shrink-0 items-center gap-3'>
          {!user ? (
            <div className='hidden sm:flex items-center gap-2'>
              <Button
                asChild
                variant='ghost'
                size='sm'
                className='h-9 px-4 text-sm font-semibold text-zinc-600 hover:text-zinc-950 rounded-full'>
                <Link href='/auth/login'>Log in</Link>
              </Button>
              <Button
                asChild
                size='sm'
                className='h-9 rounded-full px-5 shadow-sm transition-all hover:shadow-md'>
                <Link href='/auth/register'>Sign up</Link>
              </Button>
            </div>
          ) : (
            <div className='hidden sm:flex'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-9 w-9 rounded-full p-0 ring-1 ring-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all'>
                    <Avatar className='h-full w-full'>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className='bg-zinc-100 text-zinc-600 font-bold text-xs'>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-56 rounded-xl border-zinc-200 mt-2'
                  align='end'>
                  <div className='flex items-center justify-start gap-2 p-2'>
                    <div className='flex flex-col space-y-0.5 leading-none'>
                      <p className='font-semibold text-sm text-zinc-900'>
                        {user.name}
                      </p>
                      <p className='text-xs text-zinc-500 truncate w-[180px]'>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link
                        href='https://app.myapp.site:3000/dashboard'
                        className='w-full flex items-center'>
                        <LayoutDashboard className='mr-2 h-4 w-4 text-zinc-500' />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link
                        href='https://app.myapp.site:3000/dashboard/pricing'
                        className='w-full flex items-center'>
                        <CreditCard className='mr-2 h-4 w-4 text-zinc-500' />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className='cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50'>
                    <LogOut className='mr-2 h-4 w-4' />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* --- MOBILE MENU TRIGGER --- */}
          <div className='md:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 rounded-full text-zinc-600'>
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side='right'
                className='w-full max-w-xs border-l border-zinc-200 p-6 flex flex-col'>
                <SheetHeader className='text-left mb-8'>
                  <SheetTitle>
                    <Link
                      href='/'
                      className='flex items-center gap-2 font-bold text-xl text-zinc-950'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white'>
                        <Home size={18} />
                      </div>
                      HostOS
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Links */}
                <div className='flex flex-col gap-6 flex-1'>
                  {navLinks.map((link) => (
                    <Link
                      key={link.title}
                      href={link.url}
                      className='text-lg font-semibold text-zinc-800 hover:text-primary transition-colors'>
                      {link.title}
                    </Link>
                  ))}
                </div>

                {/* Mobile Auth */}
                <div className='flex flex-col gap-3 mt-auto pt-6 border-t border-zinc-100'>
                  {!user ? (
                    <>
                      <Button
                        asChild
                        variant='outline'
                        className='w-full rounded-xl border-zinc-200 h-12'>
                        <Link href='/auth/login'>Log in</Link>
                      </Button>
                      <Button asChild className='w-full rounded-xl h-12'>
                        <Link href='/auth/register'>Start free trial</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className='flex items-center gap-3 mb-4 p-2 rounded-lg bg-zinc-50'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className='bg-zinc-200'>
                            {user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                          <span className='text-sm font-bold text-zinc-900'>
                            {user.name}
                          </span>
                          <span className='text-xs text-zinc-500 truncate max-w-[150px]'>
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant='outline'
                        className='w-full justify-start h-11 border-zinc-200 rounded-xl'>
                        <Link href='https://app.myapp.site:3000/dashboard'>
                          <LayoutDashboard className='mr-2 h-4 w-4' /> Dashboard
                        </Link>
                      </Button>
                      <Button
                        variant='ghost'
                        onClick={() => signOut()}
                        className='w-full justify-start h-11 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50'>
                        <LogOut className='mr-2 h-4 w-4' /> Log out
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
