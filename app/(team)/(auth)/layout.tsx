import React from 'react';
import '../../globals.css';

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
      </body>
    </html>
  );
}
