'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  generateAirbnbEmail,
  generateBookingComEmail,
  generateVrboEmail,
} from '@/lib/mock/emailTemplates';
import { Bot } from 'lucide-react';

interface SimulationMenuProps {
  accountId: string;
  emailAddress: string;
}

export function SimulationMenu({ accountId, emailAddress }: SimulationMenuProps) {
  const [simulating, setSimulating] = React.useState(false);

  // Helper to generate random booking data
  const getMockData = (platform: string) => {
    const names = ['Alice Wonderland', 'Bob Builder', 'Charlie Chaplin', 'Dora Explorer'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const price = Math.floor(Math.random() * 500) + 200; // 200-700
    const code =
      platform === 'Airbnb'
        ? 'HM' + Math.random().toString(36).substring(2, 10).toUpperCase()
        : Math.floor(Math.random() * 1000000000).toString();
    
    // Dates: Next week
    const now = new Date();
    const checkIn = new Date(now);
    checkIn.setDate(now.getDate() + 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 3);

    return {
      name: randomName,
      price,
      code,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
    };
  };

  const handleSimulate = async (platform: 'Airbnb' | 'Booking.com' | 'Vrbo') => {
    setSimulating(true);
    const data = getMockData(platform);
    let subject = '';
    let htmlBody = '';

    switch (platform) {
      case 'Airbnb':
        subject = `Reservation confirmed - ${data.code}`;
        htmlBody = generateAirbnbEmail(data.name, data.code, data.price, data.checkIn, data.checkOut);
        // Add sender override if possible roughly via "From" name, but standard email sends as "Me".
        // AI will look at body content mostly.
        break;
      case 'Booking.com':
        subject = `Booking.com: New booking ${data.code}`;
        htmlBody = generateBookingComEmail(data.name, data.code, data.price, data.checkIn, data.checkOut);
        break;
      case 'Vrbo':
        subject = `You have a new booking request #${data.code}`;
        htmlBody = generateVrboEmail(data.name, data.code, data.price, data.checkIn, data.checkOut);
        break;
    }

    try {
      toast.info(`Simulating ${platform} booking...`);
      
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          to: [emailAddress], // Send to Self (API expects string[])
          subject,
          body: htmlBody, // Use 'body' because our API expects it (mapped to htmlBody internally)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send simulation email');
      }

      toast.success(`${platform} email sent! Check your inbox in ~30s.`);
    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('Failed to simulate booking.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={simulating}>
          <Bot className="h-4 w-4" />
          Simulate
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Generate Test Booking</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSimulate('Airbnb')}>
          Simulate Airbnb
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSimulate('Booking.com')}>
          Simulate Booking.com
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSimulate('Vrbo')}>
          Simulate Vrbo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
