import React from 'react';

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='team-portal-layout'>
      <div className='team-content-wrapper'>
        <main className='team-main-content'>{children}</main>
      </div>
    </div>
  );
}
