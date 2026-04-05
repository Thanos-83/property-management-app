'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextEffect } from '@/components/ui/text-effect';

export default function CtaSection() {
  return (
    <section className='relative py-16 md:py-24 overflow-hidden bg-zinc-950 text-zinc-50'>
      {/* --- BACKGROUND EFFECTS --- */}
      {/* Subtle Grid Pattern */}
      <div className='absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]' />

      {/* Center Glow */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none' />

      <div className='relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center'>
        {/* Social Proof Badge */}
        <div className='flex items-center gap-4 mb-8 bg-white/5 border border-white/10 rounded-full pr-4 pl-1 py-1 backdrop-blur-sm shadow-xl'>
          <div className='flex -space-x-3'>
            {/* Fake Avatars - You can replace src with real images later */}
            <div className='w-8 h-8 rounded-full border-2 border-zinc-950 bg-rose-200' />
            <div className='w-8 h-8 rounded-full border-2 border-zinc-950 bg-blue-200' />
            <div className='w-8 h-8 rounded-full border-2 border-zinc-950 bg-emerald-200' />
            <div className='w-8 h-8 rounded-full border-2 border-zinc-950 bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-900'>
              +
            </div>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='flex text-amber-400'>
              <Star className='w-3.5 h-3.5 fill-current' />
              <Star className='w-3.5 h-3.5 fill-current' />
              <Star className='w-3.5 h-3.5 fill-current' />
              <Star className='w-3.5 h-3.5 fill-current' />
              <Star className='w-3.5 h-3.5 fill-current' />
            </div>
            <span className='text-xs font-medium text-zinc-300'>
              Loved by modern hosts
            </span>
          </div>
        </div>

        {/* Main Copy */}
        <TextEffect
          as='h3'
          preset='fade-in-blur'
          className='text-4xl md:text-6xl font-extrabold tracking-tight text-balance mb-6 bg-clip-text  bg-gradient-to-b from-white to-zinc-400'>
          Stop managing 15 browser tabs just to answer a guest.
        </TextEffect>

        <TextEffect
          as='p'
          preset='fade-in-blur'
          delay={0.2}
          className='text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed'>
          Join the professional hosts who are putting their property management
          on autopilot. Start your free trial today—no credit card required.
        </TextEffect>

        {/* Call to Action Buttons */}
        <div className='flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto'>
          <Button
            asChild
            size='lg'
            className='w-full sm:w-auto h-14 px-8 text-base font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.2)]'>
            <Link href='/auth/login'>
              Get Started for Free <ArrowRight className='ml-2 w-5 h-5' />
            </Link>
          </Button>

          <Button
            asChild
            size='lg'
            variant='outline'
            className='w-full sm:w-auto h-14 px-8 text-base font-bold bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors rounded-xl'>
            <Link href='#pricing'>View Pricing</Link>
          </Button>
        </div>

        <p className='mt-6 text-xs text-zinc-500 font-medium'>
          Set up in minutes. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
