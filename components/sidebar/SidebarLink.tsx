import Link from 'next/link';
import { ReactNode } from 'react';

type SidebarLinkProps = {
  tag: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: string | number;
};
export function SidebarLink({
  tag,
  label,
  icon,
  active,
  badge,
}: SidebarLinkProps) {
  return (
    <div className='mb-2 px-0.5'>
      <Link
        href={`/dashboard/${tag}`}
        className={[
          'group flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors',
          active
            ? 'bg-primary-main text-white font-semibold'
            : 'text-dark hover:bg-secondary hover:text-primary-main focus:outline  focus:outline-primary-accent',
        ].join(' ')}>
        <span className='flex items-center gap-2'>
          {icon}
          {label}
        </span>
        {!!badge && (
          <span className='ml-2 bg-primary-accent text-white text-xs px-2 py-0.5 rounded-full'>
            {badge}
          </span>
        )}
      </Link>
    </div>
  );
}
