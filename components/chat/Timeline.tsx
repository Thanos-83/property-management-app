'use client';

import { useEffect, useState, useRef } from 'react';
import { useQueryState } from 'nuqs';
import {
  getConversationMessages,
  sendHostReply,
} from '@/lib/actions/communicationHubActions';
import { format } from 'date-fns';
import { Send, MessageSquare, Info, Phone, Mail, User } from 'lucide-react';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Local Components
import RightPane from './RightPane';
import { ShowEmailContent } from './ShowEmailContent';
import { ScrollArea } from '../ui/scroll-area';

type Message = {
  id: string;
  text: string;
  timestamp: string;
  isFromGuest: boolean;
  senderEmail: string;
  subject: string;
};

type BookingInfo = {
  guest_email: string;
  guest_name: string;
  propertyInfo: {
    title: string;
  };
};

export default function Timeline() {
  const [activeThread] = useQueryState('thread');
  const [messages, setMessages] = useState<Message[]>([]);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages() {
      if (!activeThread) return;
      setIsLoading(true);
      const response = await getConversationMessages(activeThread);
      console.log('Response:', response);
      if (response.success && response.data) setMessages(response.data);
      if (response.success && response.bookingInfo) {
        setBookingInfo(response.bookingInfo);
      }

      setIsLoading(false);
    }
    loadMessages();
  }, [activeThread]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return;
    setIsSending(true);
    const response = await sendHostReply(
      activeThread,
      replyText,
      'Your Property',
    );
    if (response.success && response.data) {
      const newMessage: Message = {
        id: response.data.id,
        text: response.data.text_body,
        timestamp: response.data.created_at,
        isFromGuest: false,
        senderEmail: response.data.sender_email,
        subject: response.data.subject,
      };
      setMessages((prev) => [...prev, newMessage]);
      setReplyText('');
    }
    setIsSending(false);
  };

  // EMPTY STATE: If no conversation is selected
  if (!activeThread) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center bg-muted/10 text-muted-foreground border-l border-border'>
        <MessageSquare size={48} className='mb-4 opacity-20' />
        <p className='text-lg font-medium text-foreground'>
          Select a conversation
        </p>
        <p className='text-sm'>
          Choose a thread from the left to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col h-full bg-muted/10 relative'>
      {/* 1. HEADER */}
      <div className='h-[86px] px-6 bg-white flex items-center justify-between flex-shrink-0 z-10 shadow-md'>
        <div className='flex items-center gap-3'>
          {/* Avatar */}
          <div className='w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center border border-border shrink-0'>
            <User className='w-5 h-5 text-muted-foreground' />
          </div>

          {/* Enhanced Context */}
          <div className='flex flex-col'>
            <h2 className='text-base font-bold text-foreground tracking-tight leading-tight'>
              {/* Fallback to email if name isn't passed down yet */}
              {bookingInfo?.guest_name}
            </h2>
            <div className='flex items-center gap-2 mt-0.5'>
              <span className='text-xs text-muted-foreground font-medium truncate max-w-[200px]'>
                {bookingInfo?.guest_email}
              </span>
              <span className='text-muted-foreground/30'>•</span>
              <span className='text-xs font-semibold text-foreground'>
                {bookingInfo?.propertyInfo.title}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Info Sheet Trigger & Desktop Quick Actions */}
        <div className='flex items-center gap-2'>
          {/* Quick Actions (Desktop) */}
          <div className='hidden sm:flex items-center gap-1 mr-2'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-muted-foreground hover:text-foreground'>
              <Phone className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-muted-foreground hover:text-foreground'>
              <Mail className='h-4 w-4' />
            </Button>
          </div>

          <div className='xl:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs font-semibold gap-2'>
                  <Info size={14} /> Details
                </Button>
              </SheetTrigger>
              <SheetContent className='w-[300px] sm:w-[400px] p-0 border-l border-border'>
                <RightPane />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE TIMELINE */}
      <ScrollArea className='flex-1 overflow-y-auto h-full'>
        <div className='flex-1 p-4 h-full' ref={scrollRef}>
          {isLoading ? (
            <div className='flex test justify-center items-center h-full text-muted-foreground text-sm font-medium'>
              Loading history...
            </div>
          ) : messages.length === 0 ? (
            <div className='flex justify-center items-center h-full text-muted-foreground text-sm'>
              No messages yet.
            </div>
          ) : (
            <div className='space-y-6 max-w-3xl mx-auto'>
              {messages.map((msg) => {
                // DETECT SYSTEM NOTIFICATIONS: Airbnb/Booking confirmations, cancellations, etc.
                const isSystemNotification =
                  msg.subject?.toLowerCase().includes('reservation') ||
                  msg.subject?.toLowerCase().includes('booking') ||
                  msg.subject?.toLowerCase().includes('cancel');

                if (isSystemNotification) {
                  // RENDER THE NEW CLEAN DIALOG CARD
                  return <ShowEmailContent key={msg.id} message={msg} />;
                }

                // STANDARD CHAT BUBBLES
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isFromGuest ? 'items-start' : 'items-end'}`}>
                    <span className='text-[10px] text-muted-foreground mb-1.5 px-1 font-medium'>
                      {msg.isFromGuest ? 'Guest' : 'You'} •{' '}
                      {format(new Date(msg.timestamp), 'dd MMM yyyy, h:mm a')}
                    </span>

                    <div
                      className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 text-sm shadow-sm ${
                        msg.isFromGuest
                          ? // Clean, white card style for incoming
                            'bg-white border border-border text-foreground rounded-2xl rounded-tl-none'
                          : // Soft, branded style for outgoing
                            'bg-primary text-primary-foreground rounded-2xl rounded-tr-none'
                      }`}>
                      {msg.isFromGuest && msg.subject && (
                        <div className='font-semibold text-xs mb-2 pb-2 border-b border-border/40 opacity-70 truncate'>
                          Subject: {msg.subject}
                        </div>
                      )}
                      <div className='whitespace-pre-wrap leading-relaxed'>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 3. OMNICHANNEL COMPOSER */}
      <div className='p-3 shrink-0 z-10 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.02)]'>
        <div className='max-w-3xl mx-auto border border-border rounded-md bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-transparent transition-all shadow-sm'>
          <Textarea
            placeholder='Type your reply to the guest...'
            className='min-h-[100px] w-full border-0 focus-visible:ring-0 resize-none rounded-none bg-transparent p-4 text-sm leading-relaxed'
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSendReply();
              }
            }}
          />

          <div className='flex items-center justify-between px-3 py-2 bg-muted/30 border-t border-border'>
            <div className='flex items-center gap-2'>
              <span className='text-[10px] text-muted-foreground hidden sm:inline-block pl-1'>
                Press{' '}
                <kbd className='font-mono bg-muted border border-border px-1 py-0.5 rounded text-[9px]'>
                  ⌘+Enter
                </kbd>{' '}
                to send
              </span>
            </div>

            <div className='flex items-center gap-3'>
              <Select defaultValue='email'>
                <SelectTrigger className='w-[140px] h-8 text-xs bg-white border-border shadow-sm'>
                  <SelectValue placeholder='Channel' />
                </SelectTrigger>
                <SelectContent className='border-border'>
                  <SelectItem value='email' className='text-xs font-medium'>
                    Email Reply
                  </SelectItem>
                  <SelectItem
                    value='sms'
                    className='text-xs font-medium text-muted-foreground'
                    disabled>
                    SMS (Coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                size='sm'
                className='h-8 px-4 gap-2 text-xs font-bold shadow-sm'
                onClick={handleSendReply}
                disabled={isSending || !replyText.trim()}>
                {isSending ? 'Sending...' : 'Send'}{' '}
                <Send size={14} className='ml-0.5 opacity-80' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
