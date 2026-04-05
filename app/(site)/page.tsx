import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import Pricing from '@/components/home/Pricing';
import CtaSection from '@/components/home/CtaSection';
import FaqSection from '@/components/home/FaqSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import IntegrationsMarquee from '@/components/home/IntegrationsMarquee';

export default function Home() {
  return (
    <>
      <main className='overflow-hidden bg-white selection:bg-primary/20'>
        <HeroSection />

        <IntegrationsMarquee />

        <HowItWorksSection />

        <FeaturesSection />

        <CtaSection />

        <Pricing />
        <FaqSection />
      </main>
    </>
  );
}
