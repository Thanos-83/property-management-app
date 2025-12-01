import React from 'react';
import '../../globals.css';
import { Toaster } from '@/components/ui/sonner';

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <div className='team-portal-layout'>
          <div className='team-content-wrapper'>
            <main className='team-main-content'>{children}</main>
          </div>
        </div>
        <Toaster richColors position='top-right' />
      </body>
    </html>
  );
}
