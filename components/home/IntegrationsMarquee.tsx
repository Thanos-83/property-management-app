'use client';

import React from 'react';
import Image from 'next/image';

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children?: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

const logos = [
  { name: 'Airbnb', src: '/icons/airbnb.svg', width: 160, height: 40 },
  { name: 'Booking.com', src: '/icons/booking.svg', width: 160, height: 40 },
  { name: 'Vrbo', src: '/icons/vrbo.svg', width: 160, height: 40 },
  // { name: 'Stripe', src: '/icons/stripe.svg', width: 75, height: 32 },
  { name: 'Expedia', src: '/icons/expedia.svg', width: 160, height: 40 },
  // { name: 'Google Travel', src: '/icons/google.svg', width: 120, height: 30 },
  {
    name: 'TripAdvisor',
    src: '/icons/tripadvisor-logo.png',
    width: 160,
    height: 40,
  },
];

function Marquee({
  className,
  reverse,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 5, // Defaulting to a higher number to ensure screen overflow
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={`group flex overflow-hidden bg-white p-4 [--duration:40s] [--gap:4rem] [gap:var(--gap)] ${
        vertical ? 'flex-col' : 'flex-row'
      } ${className}`}>
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            // THE FIX: Using Tailwind arbitrary values for bulletproof dynamic animations
            className={`flex shrink-0 justify-around [gap:var(--gap)] ${
              vertical
                ? 'animate-[marquee-vertical_var(--duration)_linear_infinite] flex-col'
                : 'animate-[marquee_var(--duration)_linear_infinite] flex-row'
            } ${reverse ? '[animation-direction:reverse]' : ''} ${
              pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
            }`}>
            {children}
          </div>
        ))}
    </div>
  );
}

export default function IntegrationsMarquee() {
  return (
    <section id='integrations' className='py-16 bg-white relative'>
      <div className='absolute bottom-0 left-0 right-0 h-[3rem] bg-gradient-to-b from-white to-[#F6F8FC]' />
      <div className='mx-auto max-w-7xl px-6 text-center'>
        <p className='text-base font-semibold text-zinc-400 uppercase tracking-widest mb-10'>
          Syncs seamlessly with your favorite channels
        </p>

        <div className='relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background'>
          {/* THE FIX: Explicitly passing a high repeat count because we only have 4 logos */}
          <Marquee pauseOnHover className='[--duration:50s]' repeat={2}>
            {logos.map((logo) => (
              <div
                key={logo.name}
                className='flex items-center justify-center px-6 transition-all duration-300 group hover:scale-105'>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={logo.width}
                  height={logo.height}
                  className='grayscale opacity-90 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100'
                  priority={false}
                />
              </div>
            ))}
          </Marquee>

          <div className='pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background'></div>
          <div className='pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background'></div>
        </div>
      </div>
    </section>
  );
}
