'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TextEffect } from '@/components/ui/text-effect';

const faqs = [
  {
    question: 'Which booking platforms do you natively support?',
    answer:
      'Our omnichannel inbox and calendar support Airbnb, Booking.com, and Vrbo. We also fully support direct bookings and any other platform that uses standard iCal links for two-way synchronization.',
  },
  {
    question: 'How does the AI email parsing actually work?',
    answer:
      "It's magic, but simple to set up! You just create an auto-forward rule in your email provider to send automated platform emails to your unique system address. Our Gemini AI instantly reads them, extracts the guest data, dates, and payouts, and updates your dashboard—zero manual entry required.",
  },
  {
    question: 'Do I need to enter a credit card to start the trial?',
    answer:
      "Not at all. You can start your free trial completely risk-free. We only ask for payment details when you realize how much time you're saving and decide to upgrade to a paid plan.",
  },
  {
    question: 'How long does it take to set up my properties?',
    answer:
      'Most hosts are fully set up within 15 minutes. It is as simple as connecting your accounts, pasting in your iCal links, and letting our system pull in your existing reservations.',
  },
  {
    question: 'Am I locked into a long-term contract?',
    answer:
      'Absolutely not. Our pricing is completely flexible. You are billed month-to-month and can upgrade, downgrade, or cancel your subscription at any time directly from your billing dashboard.',
  },
];

export default function FaqSection() {
  return (
    <section
      id='faq'
      className='py-24 bg-white relative overflow-hidden border-t border-zinc-100'>
      <div className='mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* --- HEADER --- */}
        <div className='text-center mb-16'>
          <TextEffect
            as='h2'
            preset='fade-in-blur'
            className='text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4'>
            Frequently Asked Questions
          </TextEffect>
          <p className='text-lg text-zinc-500 font-medium'>
            Everything you need to know about the product and billing.
          </p>
        </div>

        {/* --- ACCORDION --- */}
        <div className='bg-white rounded-2xl border border-zinc-100 p-6 md:p-8 shadow-sm'>
          <Accordion type='single' collapsible className='w-full space-y-4'>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className='shadow-sm bg-zinc-50 px-6 rounded-xl w-full'>
                <AccordionTrigger className='text-left text-lg md:text-xl font-semibold text-zinc-800 hover:text-primary transition-colors py-8'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='text-zinc-600 text-lg leading-relaxed pb-6'>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
