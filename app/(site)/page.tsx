import React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup} from '@/components/ui/animated-group' 
// import { HeroHeader } from "@/components/header"
import Pricing from '@/components/home/Pricing'
import HeroSection from '@/components/home/hero-section'

export default function Home() {
    return (
        <>
            <main className="overflow-hidden">
                <HeroSection/>
                <section>
                    <Pricing/>
                </section>
            </main>
        </>
    )
}