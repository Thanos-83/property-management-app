import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'https';
export const rootDomain =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  `${process.env.NEXT_PUBLIC_DEV_DOMAIN!}:${process.env.NEXT_PUBLIC_PORT!}`;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
