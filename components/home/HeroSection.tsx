import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { TextEffect } from '@/components/ui/text-effect';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { Variants } from 'motion/react';

const transitionVariants: { item: Variants; container?: Variants } = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  return (
    <div className=' relative'>
      <div className='absolute inset-0 h-full w-full bg-[radial-gradient(125%_125%_at_50%_25%,#ffffff_0%,#d9bfff_120%,#F5F8FC_10%)]'>
        <div
          className='absolute inset-0 h-[75%] w-full bg-[linear-gradient(to_right,#8444d31a_1px,transparent_1px),linear-gradient(to_bottom,#8444d31a_1px,transparent_1px)] bg-[size:4rem_4rem]'
          style={{
            maskImage:
              'radial-gradient(ellipse 100% 100% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 100% 100% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />
        <div className='absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-b from-transparent to-white' />
      </div>

      <section>
        <div className='relative pt-16 md:pt-32'>
          <div className='mx-auto max-w-7xl px-6 relative z-10'>
            <div className='text-center sm:mx-auto lg:mr-auto lg:mt-0'>
              <AnimatedGroup variants={transitionVariants}>
                <Link
                  href='#features'
                  className='hover:bg-background dark:hover:border-t-border bg-white group mx-auto flex w-fit items-center gap-4 rounded-full border border-zinc-200 p-1 pl-4 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-zinc-900 dark:border-zinc-800'>
                  <span className='text-foreground text-sm font-semibold tracking-tight'>
                    ✨ Introducing AI-Powered Parsing
                  </span>
                  <span className='dark:border-zinc-800 block h-4 w-px bg-zinc-200'></span>

                  <div className='bg-zinc-100 group-hover:bg-primary/10 dark:bg-zinc-800 size-6 overflow-hidden rounded-full duration-500 flex items-center justify-center'>
                    <div className='flex w-12 -translate-x-1/4 duration-500 ease-in-out group-hover:translate-x-1/4'>
                      <span className='flex size-6 text-zinc-500 group-hover:text-primary'>
                        <ArrowRight className='m-auto size-3' />
                      </span>
                      <span className='flex size-6 text-zinc-500 group-hover:text-primary'>
                        <ArrowRight className='m-auto size-3' />
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedGroup>

              <TextEffect
                preset='fade-in-blur'
                speedSegment={0.3}
                as='h1'
                className='mx-auto mt-8 max-w-4xl text-balance text-5xl font-extrabold tracking-tight md:text-7xl lg:mt-12 xl:text-[5.25rem] text-zinc-950 dark:text-white'>
                The AI-Powered Operating System for Modern Hosts
              </TextEffect>

              <TextEffect
                per='line'
                preset='fade-in-blur'
                speedSegment={0.3}
                delay={0.5}
                as='p'
                className='mx-auto mt-6 max-w-2xl text-balance text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed'>
                Unify your Airbnb, Booking.com, and Vrbo reservations. Let AI
                extract booking data, sync your calendars, and automate your
                field operations in one seamless platform.
              </TextEffect>

              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className='mt-10 flex flex-col items-center justify-center gap-4 md:flex-row'>
                <div key={1} className='relative group'>
                  <div className='absolute -inset-1 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                  <Button
                    asChild
                    size='lg'
                    className='relative rounded-xl px-8 h-12 text-base font-bold shadow-md'>
                    <Link href='/auth/login'>
                      <span className='text-nowrap'>Start your free trial</span>
                    </Link>
                  </Button>
                </div>

                <Button
                  key={2}
                  asChild
                  size='lg'
                  variant='outline'
                  className='h-12 rounded-xl px-8 text-base font-bold bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm'>
                  <Link href='#how-it-works'>
                    <span className='text-nowrap'>See how it works</span>
                  </Link>
                </Button>
              </AnimatedGroup>

              <div className='mt-8'>
                <p className='text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest'>
                  No credit card required • Setup in 15 minutes
                </p>
              </div>
            </div>
          </div>

          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.75,
                  },
                },
              },
              ...transitionVariants,
            }}>
            <div className='mask-b-from-55% relative mt-16 overflow-hidden px-4 sm:mt-20 md:mt-24 pb-12 z-10'>
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none' />

              <div className='inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-zinc-200/50 p-2 md:p-4 shadow-2xl shadow-zinc-950/10 ring-1 dark:border-zinc-800'>
                <div className='bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner'>
                  <Image
                    className='aspect-[16/10] md:aspect-auto object-cover relative hidden dark:block w-full h-auto'
                    src='/mail2.png'
                    alt='HostOS Application Interface'
                    width={2700}
                    height={1440}
                    priority
                  />
                  <Image
                    className='aspect-[16/10] md:aspect-auto object-cover relative block dark:hidden w-full h-auto'
                    src='/images/hero-image.webp'
                    alt='HostOS Application Interface'
                    width={2700}
                    height={1440}
                    priority
                  />
                </div>
              </div>
            </div>
          </AnimatedGroup>
        </div>
      </section>
    </div>
  );
}
