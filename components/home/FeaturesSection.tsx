'use client';

import React from 'react';
import {
  Inbox,
  Sparkles,
  CalendarDays,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { TextEffect } from '@/components/ui/text-effect';

export default function FeaturesSection() {
  return (
    <section
      id='features'
      className='py-24 relative overflow-hidden bg-[#FAFAFA]'>
      {/* --- MESH GRADIENT BACKGROUND --- */}
      <div className='absolute top-0 left-1/4 w-[600px] h-[600px] bg-rose-400/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none' />
      <div className='absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] -z-10 pointer-events-none' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-400/5 rounded-full blur-[120px] -z-10 pointer-events-none' />

      <div className='absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_2px,transparent_2px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]' />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* --- HEADER --- */}
        <div className='text-center max-w-3xl mx-auto mb-20'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6 shadow-sm'>
            <Sparkles size={14} />
            <span>Core Platform Features</span>
          </div>

          <TextEffect
            as='h2'
            preset='fade-in-blur'
            className='text-4xl md:text-5xl font-bold text-zinc-900 mb-6 leading-tight'>
            Everything you need to host effortlessly.
          </TextEffect>
          <p className='text-lg text-zinc-500 font-medium leading-relaxed max-w-2xl mx-auto'>
            Replace your fragmented spreadsheets, generic inboxes, and manual
            cleaning schedules with one intelligent platform designed for modern
            hosts.
          </p>
        </div>

        {/* --- TRUE ASYMMETRIC BENTO GRID --- */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* CARD 1: Omnichannel Inbox (Span 8) */}
          <div className='lg:col-span-8 relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between border border-zinc-200/70 border-t-2 border-t-blue-500 shadow-sm hover:shadow-md transition-all group overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />

            <div className='flex flex-col md:flex-row gap-8 items-center relative z-10 h-full'>
              <div className='flex-1'>
                <div className='w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-sm ring-1 ring-blue-100'>
                  <Inbox className='w-6 h-6' />
                </div>
                <h3 className='text-2xl font-bold text-zinc-900 mb-3'>
                  Consolidated Inbox
                </h3>
                <p className='text-zinc-500 leading-relaxed text-base'>
                  Unified real-time chat for Airbnb, Booking.com, and direct
                  emails. Eliminate missed requests and say goodbye to tab
                  switching forever.
                </p>
              </div>

              {/* MICRO-UI: Chat */}
              <div className='w-full md:w-[320px] h-48 bg-blue-50/30 rounded-xl border border-blue-100 p-4 flex flex-col gap-3 overflow-hidden relative shadow-inner shrink-0'>
                <div className='flex gap-3 w-[90%] transform transition-transform duration-500 group-hover:translate-x-2'>
                  <div className='w-6 h-6 rounded-full bg-blue-200 shrink-0 mt-1 border border-white shadow-sm' />
                  <div className='bg-white border border-blue-100 rounded-xl rounded-tl-sm p-3 shadow-sm w-full space-y-2'>
                    <div className='h-1.5 bg-zinc-200 rounded w-1/3' />
                    <div className='h-1.5 bg-zinc-100 rounded w-full' />
                    <div className='h-1.5 bg-zinc-100 rounded w-4/5' />
                  </div>
                </div>
                <div className='flex gap-3 w-[85%] self-end transform transition-transform duration-500 group-hover:-translate-x-2 mt-2'>
                  <div className='bg-blue-600 rounded-xl rounded-tr-sm p-3 shadow-md w-full space-y-2'>
                    <div className='h-1.5 bg-blue-200/80 rounded w-full' />
                    <div className='h-1.5 bg-blue-200/80 rounded w-5/6' />
                  </div>
                </div>
                <div className='absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-blue-50/50 to-transparent' />
              </div>
            </div>
          </div>

          {/* CARD 2: AI Parsing (Span 4) */}
          <div className='lg:col-span-4 relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between border border-zinc-200/70 border-t-2 border-t-purple-500 shadow-sm hover:shadow-md transition-all group overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-bl from-purple-500/0 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />

            <div className='relative z-10 mb-6'>
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-purple-100'>
                  <Sparkles className='w-6 h-6' />
                </div>
                <h3 className='text-2xl font-bold text-zinc-900 mb-2'>
                  AI Autopilot
                </h3>
              </div>

              <p className='text-zinc-500 leading-relaxed text-md'>
                Gemini instantly extracts names, dates, and payouts from emails,
                syncing them invisibly.
              </p>
            </div>

            {/* MICRO-UI: JSON Code */}
            <div className='w-full bg-[#09090b] rounded-xl border border-zinc-800 p-4 overflow-hidden relative shadow-lg'>
              {/* macOS Window Controls */}
              <div className='flex items-center gap-1.5 mb-3'>
                <div className='w-2.5 h-2.5 rounded-full bg-rose-500' />
                <div className='w-2.5 h-2.5 rounded-full bg-amber-500' />
                <div className='w-2.5 h-2.5 rounded-full bg-emerald-500' />
              </div>
              <pre className='font-mono text-[10px] text-zinc-300 leading-loose'>
                <span className='text-purple-400'>const</span>{' '}
                <span className='text-blue-400'>booking</span> = {'{\n'}
                {'  '}guest:{' '}
                <span className='text-emerald-400'>&quot;Maria P.&quot;</span>
                {',\n'}
                {'  '}payout: <span className='text-amber-400'>450.00</span>
                {'\n'}
                {'}'}
              </pre>
              <div className='absolute top-0 left-0 right-0 h-[1px] bg-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.8)] opacity-0 group-hover:opacity-100 group-hover:translate-y-40 transition-all duration-[2000ms] ease-in-out' />
            </div>
          </div>

          {/* CARD 3: Multi-Calendar (Span 12 - Full Width - Horizontal Layout) */}
          <div className='lg:col-span-12 relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row items-center gap-10 border border-zinc-200/70 border-t-2 border-t-rose-500 shadow-sm hover:shadow-md transition-all group overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-rose-500/0 via-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />

            <div className='flex-1 relative z-10'>
              <div className='w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-5 shadow-sm ring-1 ring-rose-100'>
                <CalendarDays className='w-6 h-6' />
              </div>
              <h3 className='text-3xl font-bold text-zinc-900 mb-4'>
                Universal Multi-Calendar
              </h3>
              <p className='text-zinc-500 text-base leading-relaxed max-w-2xl'>
                Visualize all property bookings on a gorgeous, interactive
                drag-and-drop timeline. Two-way iCal synchronization guarantees
                your availability is perfectly synced across all OTAs, stopping
                double bookings before they happen.
              </p>
            </div>

            {/* MICRO-UI: Horizontal Calendar */}
            <div className='w-full md:w-[450px] h-44 bg-rose-50/30 rounded-xl border border-rose-100 p-5 flex flex-col justify-center overflow-hidden relative shadow-inner shrink-0'>
              <div className='flex justify-between border-b border-rose-200/60 pb-3 mb-4'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className='h-1.5 w-6 bg-rose-200/50 rounded-full'
                  />
                ))}
              </div>
              <div className='relative w-full h-full flex flex-col gap-3'>
                <div className='absolute top-0 left-[5%] w-[35%] h-5 bg-rose-500 rounded-md shadow-sm transition-transform duration-500 group-hover:scale-x-105 origin-left' />
                <div className='absolute top-9 left-[45%] w-[40%] h-5 bg-blue-500 rounded-md shadow-sm transition-transform duration-500 group-hover:scale-x-105 origin-left' />
                <div className='absolute top-18 left-[15%] w-[25%] h-5 bg-emerald-500 rounded-md shadow-sm transition-transform duration-500 group-hover:scale-x-105 origin-left' />
              </div>
            </div>
          </div>

          {/* CARD 4: Auto-Tasks (Span 5) */}
          <div className='lg:col-span-5 relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between border border-zinc-200/70 border-t-2 border-t-emerald-500 shadow-sm hover:shadow-md transition-all group overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />

            <div className='relative z-10 mb-6'>
              <div className='w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-5 shadow-sm ring-1 ring-emerald-100'>
                <CheckCircle className='w-6 h-6' />
              </div>
              <h3 className='text-2xl font-bold text-zinc-900 mb-2'>
                Auto-Generated Tasks
              </h3>
              <p className='text-zinc-500 leading-relaxed text-base'>
                Cleaning schedules trigger automatically on check-out dates.
                Keep your field team perfectly in sync without manual text
                messages.
              </p>
            </div>

            {/* MICRO-UI: Task List */}
            <div className='w-full h-40 bg-emerald-50/30 rounded-xl border border-emerald-100 p-4 flex flex-col gap-3 shadow-inner overflow-hidden'>
              <div className='flex items-center gap-3 bg-white border border-emerald-100/50 p-2.5 rounded-lg shadow-sm transition-transform duration-300 group-hover:translate-x-1'>
                <div className='w-4 h-4 rounded bg-emerald-500 shrink-0 flex items-center justify-center'>
                  <svg
                    className='w-2.5 h-2.5 text-white'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={3}>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <div className='h-1.5 bg-zinc-200 rounded w-2/3' />
              </div>
              <div className='flex items-center gap-3 bg-white border border-emerald-100/50 p-2.5 rounded-lg shadow-sm transition-transform duration-300 delay-75 group-hover:translate-x-1'>
                <div className='w-4 h-4 rounded border-2 border-zinc-200 shrink-0' />
                <div className='h-1.5 bg-zinc-100 rounded w-1/2' />
              </div>
              <div className='flex items-center gap-3 bg-white border border-emerald-100/50 p-2.5 rounded-lg shadow-sm transition-transform duration-300 delay-150 group-hover:translate-x-1'>
                <div className='w-4 h-4 rounded border-2 border-zinc-200 shrink-0' />
                <div className='h-1.5 bg-zinc-100 rounded w-3/4' />
              </div>
            </div>
          </div>

          {/* CARD 5: Financials (Span 7) */}
          <div className='lg:col-span-7 relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center border border-zinc-200/70 border-t-2 border-t-amber-500 shadow-sm hover:shadow-md transition-all group overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-tl from-amber-500/0 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />

            <div className='relative flex-1 z-10'>
              <div className='w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-5 shadow-sm ring-1 ring-amber-100'>
                <TrendingUp className='w-6 h-6' />
              </div>
              <h3 className='text-2xl font-bold text-zinc-900 mb-3'>
                Deep Financial Insights
              </h3>
              <p className='text-zinc-500 leading-relaxed text-base'>
                Stop guessing. Start growing. Our financial engine aggregates
                your revenue across all channels into one clear dashboard. Track
                real-time payouts, forecast seasonal occupancy, and visualize
                your growth—no spreadsheets required.
              </p>
            </div>

            {/* MICRO-UI: Financial Bar Chart */}
            <div className='w-full md:w-[280px] h-40 bg-amber-50/30 rounded-xl border border-amber-100 pt-6 pb-0 px-6 flex items-end justify-between overflow-hidden shadow-inner relative shrink-0'>
              <div className='w-[14%] h-[40%] bg-zinc-200/80 rounded-t-sm transition-all duration-500 group-hover:h-[45%]' />
              <div className='w-[14%] h-[60%] bg-zinc-200/80 rounded-t-sm transition-all duration-500 group-hover:h-[65%]' />
              <div className='w-[14%] h-[30%] bg-zinc-200/80 rounded-t-sm transition-all duration-500 group-hover:h-[35%]' />

              {/* Highlighted Bar */}
              <div className='w-[14%] h-[75%] bg-amber-500 rounded-t-sm shadow-md transition-all duration-500 group-hover:h-[85%] relative'>
                <div className='absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'>
                  +32%
                </div>
              </div>
              <div className='w-[14%] h-[50%] bg-zinc-200/80 rounded-t-sm transition-all duration-500 group-hover:h-[55%]' />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
