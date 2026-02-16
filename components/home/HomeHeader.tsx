'use client';

import {
  BadgeCheck,
  Bell,
  Book,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Menu,
  Sparkles,
  Sunset,
  Trees,
  Zap,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
// import { NavUser } from '../dashboard/nav-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { signOut } from '@/lib/actions/authActions';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  auth?: {
    login: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

type UserType = {
  name: string;
  email: string;
  avatar: string;
};

const HeaderHome = ({
  logo = {
    url: '/',
    src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg',
    alt: 'logo',
    title: 'Shadcnblocks.com',
  },
  menu = [
    { title: 'Home', url: '/' },
    {
      title: 'Products',
      url: '#',
      items: [
        {
          title: 'Blog',
          description: 'The latest industry news, updates, and info',
          icon: <Book className='size-5 shrink-0' />,
          url: '#',
        },
        {
          title: 'Company',
          description: 'Our mission is to innovate and empower the world',
          icon: <Trees className='size-5 shrink-0' />,
          url: '#',
        },
        {
          title: 'Careers',
          description: 'Browse job listing and discover our workspace',
          icon: <Sunset className='size-5 shrink-0' />,
          url: '#',
        },
        {
          title: 'Support',
          description:
            'Get in touch with our support team or visit our community forums',
          icon: <Zap className='size-5 shrink-0' />,
          url: '#',
        },
      ],
    },
    {
      title: 'Resources',
      url: '#',
      items: [
        {
          title: 'Help Center',
          description: 'Get all the answers you need right here',
          icon: <Zap className='size-5 shrink-0' />,
          url: '#',
        },
        {
          title: 'Contact Us',
          description: 'We are here to help you with any questions you have',
          icon: <Sunset className='size-5 shrink-0' />,
          url: '#',
        },
        {
          title: 'Status',
          description: 'Check the current status of our services and APIs',
          icon: <Trees className='size-5 shrink-0' />,
          url: '#',
        },
        {
          title: 'Terms of Service',
          description: 'Our terms and conditions for using our services',
          icon: <Book className='size-5 shrink-0' />,
          url: '#',
        },
      ],
    },
    {
      title: 'Pricing',
      url: '#',
    },
    {
      title: 'Blog',
      url: '/blog',
    },
  ],
  auth = {
    login: { title: 'Login', url: '/auth/login' },
    signup: { title: 'Sign up', url: '/auth/register' },
  },
  user,
}: Navbar1Props & { user: UserType | null }) => {
  

 
  return (
    <section className='px-6 py-2 sticky top-0 bg-background shadow z-[9999]'>
      <div className='container mx-auto'>
        {/* Desktop Menu */}
        <nav className='hidden py-1 justify-between lg:flex'>
          <div className='flex flex-1 items-center gap-6'>
            {/* Logo */}
            <Link href={logo.url} className='flex items-center gap-2'>
              <Image
                src={logo.src}
                // className='max-h-8 w-12'
                width={24}
                height={12}
                alt={logo.alt}
              />
              <span className='text-lg font-semibold tracking-tighter'>
                {logo.title}
              </span>
            </Link>
            <div className='flex mx-auto items-center'>
              <NavigationMenu>
                <NavigationMenuList >
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className='flex gap-4'>
            {!user?.email ? (
              <>
                <Button className='flex-1' asChild variant='outline' size='lg'>
                  <Link href={auth.login.url}>{auth.login.title}</Link>
                </Button>
                <Button className='flex-1' asChild size='lg'>
                  <Link href={auth.signup.url}>{auth.signup.title}</Link>
                </Button>
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size='lg'
                      variant='ghost'
                      className='py-6 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
                      <Avatar className='h-8 w-8 rounded-lg'>
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name}
                        />
                        <AvatarFallback className='rounded-lg'>
                          CN
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid flex-1 text-left text-sm leading-tight'>
                        <span className='truncate font-medium'>
                          {user.name}
                        </span>
                        <span className='truncate text-xs'>
                          {user.email}
                        </span>
                      </div>
                      <ChevronsUpDown className='ml-auto size-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className='w-(--radix-dropdown-menu-trigger-width) z-[10000] min-w-56 rounded-lg'
                    side={true ? 'bottom' : 'right'}
                    align='end'
                    sideOffset={4}>
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Sparkles />
                        Upgrade to Pro
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link
                          className='cursor-pointer flex items-center gap-2 w-full'
                          href='https://app.myapp.site:3000/dashboard'>
                          <BadgeCheck />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          className='cursor-pointer flex items-center gap-2 w-full'
                          href='https://app.myapp.site:3000/dashboard/pricing'>
                          <CreditCard />
                          Billing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bell />
                        Notifications
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Button
                        className='w-full  flex items-center justify-start'
                        variant='ghost'
                        onClick={() => signOut()}>
                        <LogOut />
                        Log out
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className='block lg:hidden'>
          <div className='flex items-center justify-between'>
            {/* Logo */}
            <Link href={logo.url} className='flex items-center gap-2'>
              <Image
                src={logo.src}
                className='max-h-8'
                width={24}
                height={12}
                alt={logo.alt}
              />
            </Link>
            <div className='flex items-center gap-2'>
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.name}
                />
                <AvatarFallback className='rounded-lg'>
                  CN
                </AvatarFallback>
              </Avatar>
              <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline' size='icon'>
                  <Menu className='size-4' />
                </Button>
              </SheetTrigger>
              <SheetContent className='overflow-y-auto'>
                <SheetHeader>
                  <SheetTitle>
                    <Link href={logo.url} className='flex items-center gap-2'>
                      <Image
                        src={logo.src}
                        className='max-h-8'
                        width={24}
                        height={12}
                        alt={logo.alt}
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className='flex flex-col gap-6 p-4'>
                  <Accordion
                    type='single'
                    collapsible
                    className='flex w-full flex-col gap-4'>
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  {user ? (
                    <div className='flex flex-col gap-3'>
                      <DropdownMenuSeparator/>
                      <Link className='flex items-center gap-2' href='https://app.myapp.site:3000/dashboard'>
                          <BadgeCheck />
                           <span> Dashboard</span>
                      </Link>
                    </div>
                ) : (
                  <div className='flex flex-col gap-3'>
                    <Button asChild variant='outline'>
                      <a href={auth.login.url}>{auth.login.title}</a>
                    </Button>
                    <Button asChild>
                      <a href={auth.signup.url}>{auth.signup.title}</a>
                    </Button>
                  </div>
                )}
                </div>
              </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className=' bg-popover text-popover-foreground'>
          {item.items.map((subItem) => (
            <NavigationMenuLink asChild key={subItem.title} className='w-80 '>
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <Link
        href={item.url}
        className='group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground'>
        {item.title}
      </Link>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className='border-b-0'>
        <AccordionTrigger className='text-md py-0 font-semibold hover:no-underline'>
          {item.title}
        </AccordionTrigger>
        <AccordionContent className='mt-2'>
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a key={item.title} href={item.url} className='text-md font-semibold'>
      {item.title}
    </a>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <Link
      className='flex flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground'
      href={item.url}>
      <div className='text-foreground'>{item.icon}</div>
      <div>
        <div className='text-sm font-semibold'>{item.title}</div>
        {item.description && (
          <p className='text-sm leading-snug text-muted-foreground'>
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export { HeaderHome };
