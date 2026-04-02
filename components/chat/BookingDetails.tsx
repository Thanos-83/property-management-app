'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarIcon,
  Users,
  CreditCard,
  Mail,
  User,
  Loader2,
  Building2,
  Home,
  FileText,
  Check,
  X,
  Clock,
  Euro,
} from 'lucide-react';
import { format } from 'date-fns';

// Shadcn UI Imports (Matching your sheet exactly)
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import your existing schema (adjust path if needed)
import {
  bookingSchema,
  BookingFormInput,
  BookingFormOutput,
} from '@/lib/schemas/booking';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseLocalDate } from '@/lib/utils/dateUtils';
import { updateBookingAction } from '@/lib/actions/bookingActions';
import { useRouter } from 'next/navigation';
import { Textarea } from '../ui/textarea';
import { Booking } from '@/types/chatTypes';

// Helper for Semantic Status Badge Styling
const getStatusStyles = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-secondary text-secondary-foreground border-border';
  }
};

interface ChatBookingDetailsProps {
  booking: Booking | null;
}

export default function BookingDetails({ booking }: ChatBookingDetailsProps) {
  const router = useRouter();
  const form = useForm<BookingFormInput, BookingFormOutput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      id: '',
      booking_uid: '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      adults: 1,
      children: 0,
      total_payout: 0,
      booking_notes: '',
      start_date: '',
      end_date: '',
      custom_check_in_time: '15:00', // <-- ADDED
      custom_check_out_time: '11:00', // <-- ADDED
      property_id: '',
      status: '',
    },
  });

  // Use RHF as the single source of truth for the UI
  const watchedStartDate = form.watch('start_date');
  const watchedEndDate = form.watch('end_date');
  const watchedStatus = form.watch('status');

  // Convert watched string values back to Date objects for the Shadcn Calendar
  const startDateObj = watchedStartDate
    ? parseLocalDate(watchedStartDate)
    : undefined;
  const endDateObj = watchedEndDate
    ? parseLocalDate(watchedEndDate)
    : undefined;

  // Load data when booking opens
  useEffect(() => {
    if (booking) {
      form.reset({
        id: booking.id,
        booking_uid: booking.booking_uid,
        guest_name: booking.guest_name || '',
        guest_email: booking.guest_email || '',
        guest_phone: booking.guest_phone || '',
        adults: booking.adults || 1,
        children: booking.children || 0,
        total_payout: booking.total_payout ? Number(booking.total_payout) : 0,
        booking_notes: booking.booking_notes || '',

        // Strictly format the incoming database dates to 'yyyy-MM-dd'
        start_date: booking.start_date
          ? format(new Date(booking.start_date), 'yyyy-MM-dd')
          : '',
        end_date: booking.end_date
          ? format(new Date(booking.end_date), 'yyyy-MM-dd')
          : '',

        // Load custom times if they exist in the DB
        custom_check_in_time: booking.custom_check_in_time || '15:00',
        custom_check_out_time: booking.custom_check_out_time || '11:00',

        property_id: booking.property_id,
        status: booking.status || 'confirmed',
      });
    }
  }, [booking, form]);

  const onSubmit = async (data: BookingFormInput) => {
    if (!booking) return;
    console.log('Saving from chat side-panel:', data);
    const bookingData = {
      ...data,
      id: booking.id,
      booking_uid: booking.booking_uid,
      property_id: booking.property_id,
      platform: booking.platform,
    };
    try {
      // 1. Call your Server Action
      // We merge the booking ID into the data payload if your action expects it.
      // (Adjust the payload structure if your updateBookingAction expects arguments differently)
      const result = await updateBookingAction(bookingData);

      // 2. Handle the response
      if (result.success) {
        toast.success('Booking updated successfully');

        // This is the magic line! It updates RHF's internal "defaultValues" to match the
        // newly saved data, instantly flipping isDirty back to FALSE and disabling the Save button.
        form.reset(data as BookingFormInput);

        // Optional: Refresh the Next.js router to ensure the rest of the page
        // (like the Left Pane or Timeline) reflects any changes.
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('An unexpected error occurred while saving.');
    }
  };

  const bookingPlatformIcon = (platform: string): string | null => {
    switch (platform) {
      case 'Airbnb':
        return '/icons/airbnb-short.png';
      case 'Booking':
        return '/icons/booking-short.png';
      case 'Vrbo':
        return '/icons/vrbo-short.png';
      case 'Expedia':
        return '/icons/expedia-short.png';
      default:
        return null;
    }
  };

  // Empty State
  if (!booking) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground bg-background border-l border-border'>
        <CalendarIcon className='h-10 w-10 mb-4 opacity-20' />
        <p className='text-sm'>No active booking found for this email.</p>
        <p className='text-xs mt-2 opacity-70'>
          {form.getValues('guest_email')}
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-background overflow-hidden'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col h-full'>
          {/* --- STICKY HEADER --- */}
          <div className='p-4 bg-white shrink-0 h-[86px] shadow-lg z-10'>
            <div className='flex items-center justify-between'>
              {/* Left Side: Clean Title & ID */}
              <div className='flex flex-col'>
                <h2 className='text-lg font-bold text-foreground tracking-tight'>
                  Booking Details
                </h2>
                <span className='font-mono text-xs text-muted-foreground mt-0.5'>
                  ID: {booking.booking_uid || 'HMX87YQ2'}
                </span>
              </div>

              {/* Right Side: Status & Platform */}
              <div className='flex items-center gap-2'>
                {(() => {
                  const iconSrc = booking.platform
                    ? bookingPlatformIcon(booking.platform)
                    : null;
                  return iconSrc !== null ? (
                    <Avatar className='w-6 h-6'>
                      <AvatarImage
                        src={iconSrc}
                        alt={`Booking platform ${booking.platform} logo`}
                      />
                      <AvatarFallback>{booking.platform}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Home className='w-4 h-4 text-muted-foreground' />
                  );
                })()}
                <Badge
                  className={`text-[10px] uppercase tracking-wider shadow-sm border ${getStatusStyles(watchedStatus)}`}>
                  {watchedStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* --- SCROLLABLE BODY --- */}
          <ScrollArea className='flex-1 p-4 overflow-y-auto bg-muted/20'>
            <div className='space-y-4'>
              {/* SECTION 1: LOGISTICS */}
              <div className='bg-white border border-border rounded-sm p-5 shadow-sm space-y-5'>
                <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                  <Building2 className='w-4 h-4 text-muted-foreground' /> Move
                  or Reschedule
                </h3>

                <div className='flex flex-col gap-4'>
                  {/* --- CHECK-IN ROW --- */}
                  <div className='grid grid-cols-2 gap-4'>
                    {/* Check-in Date */}
                    <FormField
                      control={form.control}
                      name='start_date'
                      render={() => (
                        <FormItem>
                          <FormLabel className='text-xs text-muted-foreground'>
                            Check-in Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full justify-start bg-white text-left font-normal border-border',
                                  !startDateObj && 'text-muted-foreground',
                                )}>
                                <CalendarIcon className='mr-2 h-4 w-4' />
                                {startDateObj ? (
                                  format(startDateObj, 'dd-MM-yyyy')
                                ) : (
                                  <span>Pick date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0 border-border'>
                              <Calendar
                                mode='single'
                                defaultMonth={startDateObj}
                                selected={startDateObj}
                                onSelect={(date) => {
                                  form.setValue(
                                    'start_date',
                                    date ? format(date, 'yyyy-MM-dd') : '',
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    },
                                  );
                                }}
                                disabled={(date) =>
                                  endDateObj ? date > endDateObj : false
                                }
                                modifiers={{
                                  inRange: (date) => {
                                    if (!startDateObj || !endDateObj)
                                      return false;
                                    return (
                                      date >= startDateObj && date <= endDateObj
                                    );
                                  },
                                }}
                                modifiersClassNames={{
                                  inRange: 'bg-accent text-accent-foreground',
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />

                    {/* Check-in Time */}
                    <FormField
                      control={form.control}
                      name='custom_check_in_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs text-muted-foreground'>
                            Check-in Time
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Clock className='absolute left-2.5 top-2.5 h-4 w-4' />
                              {/* Native time input works perfectly with Supabase's TIME type */}
                              <Input
                                type='time'
                                className='pl-9 bg-white border-border appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* --- CHECK-OUT ROW --- */}
                  <div className='grid grid-cols-2 gap-4'>
                    {/* Check-out Date */}
                    <FormField
                      control={form.control}
                      name='end_date'
                      render={() => (
                        <FormItem>
                          <FormLabel className='text-xs text-muted-foreground'>
                            Check-out Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full justify-start bg-white text-left font-normal border-border',
                                  !endDateObj && 'text-muted-foreground',
                                )}>
                                <CalendarIcon className='mr-2 h-4 w-4' />
                                {endDateObj ? (
                                  format(endDateObj, 'dd-MM-yyyy')
                                ) : (
                                  <span>Pick date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0 border-border'>
                              <Calendar
                                mode='single'
                                defaultMonth={endDateObj}
                                selected={endDateObj}
                                onSelect={(date) => {
                                  form.setValue(
                                    'end_date',
                                    date ? format(date, 'yyyy-MM-dd') : '',
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    },
                                  );
                                }}
                                disabled={(date) =>
                                  startDateObj ? date < startDateObj : false
                                }
                                modifiers={{
                                  inRange: (date) => {
                                    if (!startDateObj || !endDateObj)
                                      return false;
                                    return (
                                      date >= startDateObj && date <= endDateObj
                                    );
                                  },
                                }}
                                modifiersClassNames={{
                                  inRange: 'bg-accent text-accent-foreground',
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />

                    {/* Check-out Time */}
                    <FormField
                      control={form.control}
                      name='custom_check_out_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs text-muted-foreground'>
                            Check-out Time
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Clock className='absolute left-2.5 top-2.5 h-4 w-4' />
                              <Input
                                type='time'
                                className='pl-9 bg-white border-border appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: GUEST IDENTITY */}
              <div className='bg-white border border-border rounded-sm p-5 shadow-sm space-y-4'>
                <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                  <User className='w-4 h-4 text-muted-foreground' /> Guest
                  Details
                </h3>

                <div className='grid gap-4'>
                  <FormField
                    control={form.control}
                    name='guest_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs text-muted-foreground'>
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            className='bg-white border-border'
                            placeholder='e.g. Maria Papadopoulou'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-1 gap-4'>
                    <FormField
                      control={form.control}
                      name='guest_email'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs text-muted-foreground'>
                            Email
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Mail className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                              <Input
                                className='pl-9 bg-white border-border'
                                readOnly
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PAX & FINANCIALS */}
              <div className='bg-white border border-border rounded-sm p-5 shadow-sm space-y-4'>
                <div className='flex flex-col gap-4'>
                  <div className='space-y-4'>
                    <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                      <Users className='w-4 h-4 text-muted-foreground' />{' '}
                      Occupancy
                    </h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='adults'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs text-muted-foreground'>
                              Adults
                            </FormLabel>
                            <FormControl>
                              <Input
                                className='bg-white border-border'
                                type='number'
                                min={1}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='children'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs text-muted-foreground'>
                              Children
                            </FormLabel>
                            <FormControl>
                              <Input
                                className='bg-white border-border'
                                type='number'
                                min={0}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                      <CreditCard className='w-4 h-4 text-muted-foreground' />{' '}
                      Financials
                    </h3>
                    <FormField
                      control={form.control}
                      name='total_payout'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs text-muted-foreground'>
                            Payout
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <span className='absolute left-3 top-2.5 text-muted-foreground font-medium'>
                                <Euro className='w-4 h-4' />
                              </span>
                              <Input
                                className='pl-8 bg-white border-border font-medium'
                                type='number'
                                step='0.01'
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              {/* SECTION 4: NOTES (Card Style) */}
              <div className='bg-white border border-border rounded-sm p-5 shadow-sm space-y-4'>
                <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-muted-foreground' />{' '}
                  Internal Notes
                </h3>
                <FormField
                  control={form.control}
                  name='booking_notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder='e.g. Late check-in, allergy to cats, needs crib...'
                          className='min-h-[100px] bg-white border-border resize-none'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ScrollArea>

          {/* --- STICKY FOOTER --- */}
          <div className='p-4 border-t border-border bg-card shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'>
            <div className='flex gap-2 w-full'>
              <Button
                variant='outline'
                type='button'
                className='bg-background border-border hover:bg-muted font-semibold w-1/2 flex items-center justify-center gap-2'
                onClick={() => form.reset()}
                disabled={
                  !form.formState.isDirty || form.formState.isSubmitting
                }>
                <X className='h-4 w-4' />
                <span className='hidden 2xl:inline'>Discard</span>
              </Button>

              <Button
                type='submit'
                disabled={
                  !form.formState.isDirty || form.formState.isSubmitting
                }
                className='font-bold shadow-sm w-1/2 flex items-center justify-center gap-2 bg-[#e85c41] hover:bg-[#d44d34] text-white'>
                {form.formState.isSubmitting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Check className='h-4 w-4' />
                )}
                <span className='hidden 2xl:inline'>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save'}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
