'use client';

import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    variant: 'default' | 'ghost';
    folder: string; // Added folder identifier
  }[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onCompose: () => void;
}

export function Nav({ links, isCollapsed, selectedFolder, onSelectFolder, onCompose }: NavProps) {

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 flex-1"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) => {
          const isSelected = selectedFolder === link.folder;
          const variant = isSelected ? 'default' : 'ghost';

          return isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectFolder(link.folder)}
                  className={cn(
                    buttonVariants({ variant: variant, size: 'icon' }),
                    'h-9 w-9',
                    variant === 'default' &&
                      'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && (
                  <span className="ml-auto text-muted-foreground">
                    {link.label}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={index}
              onClick={() => onSelectFolder(link.folder)}
              className={cn(
                buttonVariants({ variant: variant, size: 'sm' }),
                variant === 'default' &&
                  'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
                'justify-start'
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    'ml-auto',
                    variant === 'default' &&
                      'text-background dark:text-white'
                  )}
                >
                  {link.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Compose Button at Bottom */}
      <div className="mt-auto px-2 group-[[data-collapsed=true]]:px-2 group-[[data-collapsed=true]]:justify-center flex">
          {isCollapsed ? (
             <Tooltip delayDuration={0}>
               <TooltipTrigger asChild>
                 <Button
                   onClick={onCompose}
                   variant="secondary"
                   className={cn(
                     buttonVariants({ variant: 'secondary', size: 'icon' }),
                     "h-9 w-9 rounded-md shadow-md mx-auto"
                   )}
                 >
                   <span className="sr-only">Compose</span>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                 </Button>
               </TooltipTrigger>
               <TooltipContent side="right">New Email</TooltipContent>
             </Tooltip>
          ) : (
             <Button
                onClick={onCompose}
                variant="secondary"
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'lg' }),
                  "w-full justify-start gap-2 shadow-md rounded-md"
                )}
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                New Email
             </Button>
          )}
      </div>
    </div>
  );
}
