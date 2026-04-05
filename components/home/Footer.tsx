'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Twitter, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-white border-t border-zinc-200 pt-20 pb-10'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* --- MAIN FOOTER CONTENT --- */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16'>
          {/* Brand & Newsletter Column (Spans 2 columns on large screens) */}
          <div className='lg:col-span-2 space-y-8'>
            <div>
              {/* Replace with your actual Logo */}
              <Link
                href='/'
                className='flex items-center gap-2 font-bold text-2xl text-zinc-950 tracking-tight'>
                <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white'>
                  <Home size={18} strokeWidth={2.5} />
                </div>
                HostOS
              </Link>
              <p className='mt-4 text-zinc-500 text-sm leading-relaxed max-w-xs'>
                The modern operating system for property managers. Automate your
                inbox, sync your calendars, and scale your portfolio
                effortlessly.
              </p>
            </div>

            {/* Newsletter Subscribe */}
            <div className='space-y-3'>
              <h4 className='text-sm font-bold text-zinc-900'>
                Subscribe to our newsletter
              </h4>
              <p className='text-xs text-zinc-500'>
                Get the latest product updates and hosting tips.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className='flex gap-2 max-w-sm'>
                <Input
                  type='email'
                  placeholder='Enter your email'
                  className='bg-zinc-50 border-zinc-200 focus-visible:ring-primary h-10'
                  required
                />
                <Button type='submit' size='sm' className='h-10 px-4 shrink-0'>
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div className='lg:col-span-1'>
            <h4 className='font-bold text-zinc-900 mb-5'>Product</h4>
            <ul className='space-y-4'>
              {[
                'Features',
                'Pricing',
                'Integrations',
                'Changelog',
                'API Documentation',
              ].map((item) => (
                <li key={item}>
                  <Link
                    href='#'
                    className='text-sm text-zinc-500 hover:text-primary transition-colors'>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Resources */}
          <div className='lg:col-span-1'>
            <h4 className='font-bold text-zinc-900 mb-5'>Resources</h4>
            <ul className='space-y-4'>
              {[
                'Help Center',
                'Blog',
                'Community Forum',
                'Hosting Guides',
                'System Status',
              ].map((item) => (
                <li key={item}>
                  <Link
                    href='#'
                    className='text-sm text-zinc-500 hover:text-primary transition-colors'>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Company */}
          <div className='lg:col-span-1'>
            <h4 className='font-bold text-zinc-900 mb-5'>Company</h4>
            <ul className='space-y-4'>
              {[
                'About Us',
                'Careers',
                'Contact Sales',
                'Partners',
                'Brand Kit',
              ].map((item) => (
                <li key={item}>
                  <Link
                    href='#'
                    className='text-sm text-zinc-500 hover:text-primary transition-colors'>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- SUB-FOOTER --- */}
        <div className='pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-6'>
          {/* Copyright */}
          <div className='text-sm text-zinc-500'>
            &copy; {currentYear} HostOS Inc. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className='flex items-center gap-6'>
            <Link
              href='#'
              className='text-sm text-zinc-500 hover:text-zinc-900 transition-colors'>
              Privacy Policy
            </Link>
            <Link
              href='#'
              className='text-sm text-zinc-500 hover:text-zinc-900 transition-colors'>
              Terms of Service
            </Link>
            <Link
              href='#'
              className='text-sm text-zinc-500 hover:text-zinc-900 transition-colors'>
              Cookie Settings
            </Link>
          </div>

          {/* Social Icons */}
          <div className='flex items-center gap-4'>
            <Link
              href='#'
              className='text-zinc-400 hover:text-zinc-900 transition-colors'>
              <span className='sr-only'>Twitter</span>
              <Twitter size={20} />
            </Link>
            <Link
              href='#'
              className='text-zinc-400 hover:text-zinc-900 transition-colors'>
              <span className='sr-only'>GitHub</span>
              <Github size={20} />
            </Link>
            <Link
              href='#'
              className='text-zinc-400 hover:text-zinc-900 transition-colors'>
              <span className='sr-only'>LinkedIn</span>
              <Linkedin size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
