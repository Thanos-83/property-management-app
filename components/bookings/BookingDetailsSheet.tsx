'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, UseFormReturn, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateBookingAction } from '@/lib/actions/bookingActions';
import { toast } from 'sonner';
import { Users, CreditCard, Mail, Phone, User, Loader2Icon } from "lucide-react";
import { TableBooking } from '@/types/bookingTypes';
import { bookingSchema, BookingSchemaType } from '@/lib/schemas/booking';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface BookingDetailsSheetProps {
  booking: TableBooking | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailsSheet({ booking, isOpen, onOpenChange }: BookingDetailsSheetProps) {
  const router = useRouter();

  const form = useForm<BookingSchemaType>({
    resolver: zodResolver(bookingSchema) as any, // Cast resolver to any to bypass strict type check
    defaultValues: {
      bookingId: '',
      guest_name: '' as any,
      guest_email: '' as any,
      guest_phone: '' as any,
      adults: 1 as any,
      children: 0 as any,
      total_payout: 0 as any,
      booking_notes: '' as any
    },
  }) as unknown as UseFormReturn<BookingSchemaType>;

  // Load data when booking opens
  useEffect(() => {
    if (booking) {
      form.reset({
        bookingId: booking.id,
        guest_name: booking.guest_name || '',
        guest_email: booking.guest_email || '',
        guest_phone: booking.guest_phone || '',
        adults: booking.adults || 1,
        children: booking.children || 0,
        total_payout: booking.total_payout ? Number(booking.total_payout) : 0,
        booking_notes: booking.booking_notes || ''
      });
    }
  }, [booking]);

  const onSubmit: SubmitHandler<BookingSchemaType> = async (data) => {
    if (!booking) return;

    const result = await updateBookingAction({
      ...data,
      total_payout: Number(data.total_payout) 
    });


    if (result.success) {
      toast.success("Booking updated successfully");
      onOpenChange(false);
      
      // Refresh data after sheet closes to avoid flicker
      router.refresh();
      
    } else {
      toast.error("Failed to update booking");
    }
  };

  if (!booking) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="p-4 w-full sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="p-0 mb-6">
           <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="capitalize">
              {booking.platform || 'Direct'}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {booking.status}
            </Badge>
          </div>
          <SheetTitle className="text-xl">
             {booking.guest_name || "Unknown Guest"}
          </SheetTitle>
          <SheetDescription>
            {booking.property?.title} • {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* --- SECTION 1: GUEST IDENTITY --- */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Guest Details
              </h3>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="guest_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Maria Papadopoulou" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guest_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="guest@example.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guest_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="+30 69..." {...field} />
                          </div>
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* --- SECTION 2: LOGISTICS (PAX) --- */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Occupancy
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adults</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="children"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Children</FormLabel>
                      <FormControl>
                         <Input type="number" min={0} {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* --- SECTION 3: FINANCIALS --- */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Financials
              </h3>
              <FormField
                control={form.control}
                name="total_payout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Payout (Net)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                         <Input className="pl-8" type="number" step="0.01" placeholder="0.00" {...field} />
                      </div>
                    </FormControl>
                     <p className="text-xs text-muted-foreground">
                      Enter the amount you receive after platform fees.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* --- SECTION 4: NOTES --- */}
            <FormField
              control={form.control}
              name="booking_notes"
              render={({ field }) => (
                <FormItem>
                 <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. Late check-in, allergy to cats, needs crib..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="p-0 mt-8">
              <SheetClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                 {form.formState.isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                 {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </SheetFooter>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
