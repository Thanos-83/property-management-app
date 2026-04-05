'use client';

import React, { useState } from 'react';
import { Link2, Sparkles, LayoutDashboard, Check } from 'lucide-react';
import { TextEffect } from '@/components/ui/text-effect';

const steps = [
  {
    id: '01',
    title: 'Connect your channels',
    description:
      'Link your Airbnb, Booking.com, and Vrbo accounts in seconds. Paste your iCal links and set up your unique AI-forwarding email to bring all your data home.',
    icon: Link2,
    accent: 'bg-blue-500',
    illustration: 'channels', // Key for controlling the right visual
  },
  {
    id: '02',
    title: 'AI Analysis & Extraction',
    description:
      'Our Gemini-powered engine goes to work immediately. It parses every incoming reservation email, extracts guest details, and builds your database with zero manual input.',
    icon: Sparkles,
    accent: 'bg-purple-500',
    illustration: 'ai',
  },
  {
    id: '03',
    title: 'Scale your operations',
    description:
      'Your dashboard is live. Automate cleaning tasks based on check-outs, reply to guests from the omnichannel inbox, and watch your occupancy grow.',
    icon: LayoutDashboard,
    accent: 'bg-emerald-500',
    illustration: 'scale',
  },
];

export default function HowItWorksSection() {
  // Use state to track the active step (defaults to the first one)
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  return (
    <section
      id='how-it-works'
      className='py-24 relative bg-gradient-to-b from-slate-50 via-indigo-200/40 to-[#FAFAFA] isolate'>
      {/* --- MESH GRADIENT BACKGROUND --- */}
      {/* <div className='absolute top-1/3 right-[5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[80px]  pointer-events-none' /> */}
      {/* <div className='absolute top-0 left-1/4 w-[600px] h-[600px] bg-rose-400/10 rounded-full blur-[120px]  animate-pulse pointer-events-none' />
      <div className='absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px]  pointer-events-none' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-400/5 rounded-full blur-[120px] pointer-events-none' /> */}
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* --- 1. NEW CORRECTLY ALIGNED HEADER --- */}
        <div className='text-center max-w-3xl mx-auto mb-24'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-4 shadow-sm'>
            Workflow
          </div>
          <TextEffect
            as='h2'
            preset='fade-in-blur'
            className='text-4xl md:text-5xl font-black tracking-tight text-zinc-950 mb-6'>
            Automate in 3 Simple Steps
          </TextEffect>
          <p className='text-lg text-zinc-600 font-medium max-w-xl mx-auto leading-relaxed'>
            Connect your accounts and let AI handle the heavy lifting while you
            focus on scaling your business.
          </p>
        </div>

        {/* --- 2. THE ASYMMETRIC GRID (Balanced proportions) --- */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-20 items-center'>
          {/* --- LEFT COLUMN: THE INTERACTIVE STEPS --- */}
          <div className='lg:col-span-6 md:col-span-1 space-y-12 relative'>
            {/* Thicker, More Subtle Vertical Line Connector */}
            <div className='absolute left-[26px] md:left-[27px] top-6 bottom-6 w-0.5 bg-zinc-500/20 -z-10' />

            {steps.map((step, index) => {
              const isActive = index === activeStepIndex;
              return (
                <button
                  key={index}
                  onClick={() => setActiveStepIndex(index)} // Make the whole title clickable
                  className='relative flex gap-6 text-left group w-full'>
                  {/* Step Circle & Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-white border-2 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 relative z-10 ${isActive ? 'border-zinc-900 shadow-md scale-105' : 'border-zinc-100 group-hover:border-zinc-300'}`}>
                    <step.icon
                      className={`w-6 h-6 transition-colors ${isActive ? 'text-zinc-950' : 'text-zinc-300 group-hover:text-zinc-500'}`}
                    />

                    {/* Smaller, Cleaner Step Number Overlay */}
                    <div
                      className={`absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-4 ring-white ${step.accent}`}>
                      {step.id}
                    </div>
                  </div>

                  <div
                    className={`pt-1 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    <h3
                      className={`text-xl md:text-2xl font-black text-zinc-950 mb-2 transition-colors duration-300 ${isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-700'}`}>
                      {step.title}
                    </h3>
                    <p className='text-zinc-600 leading-relaxed font-normal text-sm md:text-base'>
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* --- RIGHT COLUMN: THE CONTAINED, POLISHED VISUAL --- */}
          <div className='lg:col-span-6 md:col-span-1 relative flex items-center justify-center'>
            {/* The Outer Wrapper that creates the whitespace */}
            <div className='relative group w-full max-w-[550px] ml-auto'>
              {' '}
              {/* Limiting width to ~80% and centering it */}
              {/* Outer Decorative Gradient Border */}
              <div className='absolute -inset-4 bg-gradient-to-tr from-zinc-100 to-zinc-50 rounded-[2rem] -z-10' />
              {/* Main Container - Added aspect ratio for proportional sizing */}
              <div className='relative bg-zinc-50 border border-zinc-200 rounded-[1.75rem] p-3 md:p-4 shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center'>
                {/* --- THE MICRO-UI (Simplified Dashboard) --- */}
                <div className='w-full h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col'>
                  {/* Fake Browser Top Bar */}
                  <div className='h-9 border-b border-zinc-100 bg-zinc-50/50 flex items-center px-4 gap-1.5'>
                    <div className='w-2 h-2 rounded-full bg-zinc-300' />
                    <div className='w-2 h-2 rounded-full bg-zinc-300' />
                    <div className='w-2 h-2 rounded-full bg-zinc-300' />
                    <div className='mx-auto w-1/3 h-4 bg-zinc-200/50 rounded-md' />
                  </div>

                  {/* Content Area - Abstracted Dashboard view */}
                  <div className='p-5 flex gap-5 h-full'>
                    {/* Fake Sidebar */}
                    <div className='w-10 space-y-3.5 pt-1'>
                      <div className='w-7 h-7 rounded-lg bg-zinc-100' />
                      <div className='w-7 h-7 rounded-lg bg-zinc-100' />
                      <div className='w-7 h-7 rounded-lg bg-zinc-900' />
                      <div className='w-7 h-7 rounded-lg bg-zinc-100' />
                    </div>
                    {/* Main Body */}
                    <div className='flex-1 space-y-5 pt-1'>
                      <div className='flex justify-between items-center'>
                        <div className='h-5 w-1/3 bg-zinc-100 rounded' />
                        <div className='h-7 w-20 bg-primary/10 border border-primary/20 rounded-full' />
                      </div>
                      <div className='grid grid-cols-3 gap-3'>
                        <div className='h-20 bg-zinc-50 border border-zinc-100 rounded-xl' />
                        <div className='h-20 bg-zinc-50 border border-zinc-100 rounded-xl' />
                        <div className='h-20 bg-zinc-900 rounded-xl' />
                      </div>
                      {/* This section changes based on active step */}
                      <div className='h-32 bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2.5 shadow-inner'>
                        <div
                          className={`h-2 w-full bg-zinc-200 rounded transition-all ${activeStepIndex === 1 ? 'bg-purple-200' : 'bg-zinc-200'}`}
                        />
                        <div className='h-2 w-4/5 bg-zinc-100 rounded' />
                        <div className='h-2 w-full bg-zinc-100 rounded' />
                        <div className='flex items-center gap-3 pt-5'>
                          <div
                            className={`w-8 h-8 rounded-lg ${steps[activeStepIndex].accent} text-primary flex items-center justify-center`}>
                            <Check size={16} />
                          </div>
                          <div
                            className={`h-2 w-1/3 bg-zinc-200 rounded transition-all ${activeStepIndex === 1 ? 'bg-purple-200' : 'bg-zinc-200'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating "Badge" for 3D depth */}
                <div className='absolute top-[40%] -right-5 -translate-y-1/2 bg-white border border-zinc-200 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce duration-[4000ms]'>
                  <div className='w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600'>
                    <Check size={18} strokeWidth={3} />
                  </div>
                  <div>
                    <p className='text-[10px] uppercase tracking-widest font-extrabold text-zinc-400'>
                      Status
                    </p>
                    <p className='text-sm font-bold text-zinc-900'>
                      Automation Live
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
