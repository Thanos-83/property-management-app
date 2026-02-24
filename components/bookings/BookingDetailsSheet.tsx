'use client';

import { useEffect, useState } from 'react';
import { useForm, UseFormReturn, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Users, CreditCard, Mail, Phone, User, Loader2, Building2, Calendar as CalendarIcon, AlertTriangle, FileText, Trash2, Home } from "lucide-react";
import { TableBooking } from '@/types/bookingTypes';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {deleteBookingAction, updateBookingAction} from '@/lib/actions/bookingActions';
import { useRouter } from "next/navigation";
import { bookingSchema, BookingSchemaType } from '@/lib/schemas/booking';
import { toUTC } from '@/lib/utils/calendarUtils';
import { DeleteBookingAlert } from './DeleteBookingAlert';
import Image from 'next/image';

// --- MOCKS FOR CANVAS ENVIRONMENT ---
// These replace the local Next.js and custom directory imports so the UI can render here.
// const useRouter = () => ({ refresh: () => {} });
// const bookingSchema = z.any();
// type BookingSchemaType = any;
// const toUTC = (date: Date) => {
//   if (!date) return undefined;
//   return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
// };
// ------------------------------------

interface BookingDetailsSheetProps {
  booking: TableBooking | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  properties: any[];
  isConflicting?: boolean; // Tells the sheet if it should show the warning banner
}

// Helper for Semantic Status Badge Styling
const getStatusStyles = (status: string) => {
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

export function BookingDetailsSheet({ booking, isOpen, onOpenChange, properties, isConflicting = false }: BookingDetailsSheetProps) {
  const router = useRouter();

  const [logistics, setLogistics] = useState({
    start_date: booking?.start_date as Date | undefined,
    end_date: booking?.end_date as Date | undefined,
    property_id: booking?.property_id as string,
    status: booking?.status as string
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<BookingSchemaType>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      bookingId: '',
      guest_name: '' as string,
      guest_email: '' as string,
      guest_phone: '' as string,
      adults: 1 as number,
      children: 0 as number,
      total_payout: 0 as number,
      booking_notes: '' as string,
      start_date: '' as string,
      end_date: '' as string,
      property_id: '' as string,
      status: '' as string
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
        booking_notes: booking.booking_notes || '',
        start_date: booking.start_date || '',
        end_date: booking.end_date || '',
        property_id: booking.property_id || '',
        status: booking.status || ''
      });

      setLogistics({
        start_date: new Date(booking.start_date),
        end_date: new Date(booking.end_date),
        property_id: booking.property_id,
        status: booking.status
      });
    }
  }, [booking, form]);

  const onSubmit: SubmitHandler<BookingSchemaType> = async (data) => {
    if (!booking) return;

    const result = await updateBookingAction({
      ...data,
      total_payout: Number(data.total_payout),
      start_date: logistics.start_date ? toUTC(logistics.start_date)?.toISOString() : '',
      end_date: logistics.end_date ? toUTC(logistics.end_date)?.toISOString() : '',
      property_id: logistics.property_id,
      status: logistics.status
    });

    if (result.success) {
      toast.success("Booking updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error("Failed to update booking");
    }
  };

  // --- DELETE HANDLER ---
  const handleDeleteBooking = async () => {
    if (!booking) return;
    
    setIsDeleting(true);
    try {

      const result = await deleteBookingAction(booking.id);

    } catch (error) {
      toast.error("Failed to delete booking");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false); // Close alert dialog
      onOpenChange(false); // Close side sheet
      router.refresh(); // Refresh data table
      toast.success("Booking deleted successfully");
    }
  };

  const bookingPlatformIcon = (platform: string): string | null => {
    console.log(platform);
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

  if (!booking) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 flex flex-col w-full sm:max-w-[550px] bg-background border-l border-border">
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            
            {/* --- STICKY HEADER --- */}
            <div className="p-4 border-b border-border bg-white shrink-0">
              <SheetHeader className="text-left space-y-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <SheetTitle className="text-xl font-black text-foreground">
                    {booking.guest_name || "Unknown Guest"}
                  </SheetTitle>
                  
                  {/* Badges moved next to the Guest Name */}
                  <div className="flex items-center gap-2">
                    {/* <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground border-border bg-background shadow-sm">
                      {booking.platform || 'Direct'}
                    </Badge> */}
                    {(() => { const iconSrc = bookingPlatformIcon(booking.platform); return iconSrc !== null ? <Image src={iconSrc!} alt="Platform Icon" width={20} height={20} className="w-4` h-5" /> : <Home className="w-5 h-5 text-muted-foreground" />; })()}
                    <Badge className={`text-[10px] uppercase tracking-wider shadow-sm border ${getStatusStyles(logistics.status)}`}>
                      {logistics.status || booking.status}
                    </Badge>
                  </div>
                </div>
                
                <SheetDescription className="text-xs font-medium text-muted-foreground">
                  {booking.property?.title} • {logistics.start_date ? format(logistics.start_date, 'MMM d, yyyy') : ''} - {logistics.end_date ? format(logistics.end_date, 'MMM d, yyyy') : ''}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* --- SCROLLABLE BODY --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Conditional Conflict Banner */}
              {isConflicting && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-destructive">Conflict Detected</h4>
                    <p className="text-xs text-destructive/80 mt-1 font-medium leading-relaxed">
                      This booking overlaps with another reservation. Please change the dates, select a different property, or cancel it to resolve the issue.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 1: LOGISTICS (Card Style) */}
              <div className="bg-white border border-border rounded-sm p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" /> Move or Reschedule
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Check-in</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start bg-white text-left font-normal border-border", !logistics.start_date && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {logistics.start_date ? format(logistics.start_date, 'dd-MM-yyyy') : <span>Pick date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-border">
                            <Calendar 
                              mode="single" 
                              defaultMonth={logistics.start_date} 
                              selected={logistics.start_date} 
                              onSelect={(date) => setLogistics(prev => ({...prev, start_date: date}))} 
                              // 1. Define the rule for what dates are "in range"
                              modifiers={{
                                inRange: (date) => {
                                  if (!logistics.start_date || !logistics.end_date) return false;
                                  return date > logistics.start_date && date < logistics.end_date;
                                }
                              }}
                              // 2. Apply Shadcn's built-in accent color to those dates
                              modifiersClassNames={{
                                inRange: "bg-accent text-accent-foreground" 
                              }}/>
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />

                  <FormField 
                    control={form.control}
                    name="end_date"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Check-out</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start bg-white text-left font-normal border-border", !logistics.end_date && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {logistics.end_date ? format(logistics.end_date, 'dd-MM-yyyy') : <span>Pick date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-border">
                            <Calendar 
                            mode="single" 
                            defaultMonth={logistics.end_date} 
                            selected={logistics.end_date} 
                            onSelect={(date) => setLogistics(prev => ({...prev, end_date: date}))} 
                            modifiers={{
                              inRange: (date) => {
                                if (!logistics.start_date || !logistics.end_date) return false;
                                return date > logistics.start_date && date < logistics.end_date;
                              }
                            }}
                            modifiersClassNames={{
                              inRange: "bg-accent text-accent-foreground" 
                            }}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="property_id"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Property</FormLabel>
                        <Select value={logistics.property_id} onValueChange={(val) => setLogistics(prev => ({...prev, property_id: val}))}>
                          <SelectTrigger className="w-full bg-white border-border">
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                          <SelectContent className="border-border">
                            {properties.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Booking Status</FormLabel>
                        <Select value={logistics.status} onValueChange={(val) => setLogistics(prev => ({...prev, status: val}))}>
                          <SelectTrigger className="w-full bg-white border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-border">
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled" className="text-destructive font-medium">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECTION 2: GUEST IDENTITY (Card Style) */}
              <div className="bg-white border border-border rounded-sm p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Guest Details
                </h3>
                
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="guest_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input className="bg-white border-border" placeholder="e.g. Maria Papadopoulou" {...field} />
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
                          <FormLabel className="text-xs text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 bg-white border-border" placeholder="guest@example.com" {...field} />
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
                          <FormLabel className="text-xs text-muted-foreground">Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 bg-white border-border" placeholder="+30 69..." {...field} />
                            </div>
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PAX & FINANCIALS (Combined Card to save space) */}
              <div className="bg-white border border-border rounded-sm p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  
                  {/* Occupancy Sub-section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" /> Occupancy
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adults"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Adults</FormLabel>
                            <FormControl>
                              <Input className="bg-white border-border" type="number" min={1} {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="children"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Children</FormLabel>
                            <FormControl>
                              <Input className="bg-white border-border" type="number" min={0} {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Financials Sub-section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" /> Financials
                    </h3>
                    <FormField
                      control={form.control}
                      name="total_payout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Total Payout (Net)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">€</span>
                               <Input className="pl-8 bg-white border-border font-medium" type="number" step="0.01" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 4: NOTES (Card Style) */}
              <div className="bg-white border border-border rounded-sm p-5 shadow-sm space-y-4">
                 <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" /> Internal Notes
                </h3>
                <FormField
                  control={form.control}
                  name="booking_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. Late check-in, allergy to cats, needs crib..." 
                          className="min-h-[100px] bg-white border-border resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </div>

            {/* --- STICKY FOOTER --- */}
            <div className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              {/* Delete Button (Logic to be implemented later) */}
              {/* <Button 
                type="button" 
                variant="ghost" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive px-3 font-semibold"
                onClick={() => handleDeleteBooking()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button> */}
              <DeleteBookingAlert isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleDeleteBooking} isDeleting={isDeleting} guestName={booking?.guest_name || ""} />
              <div className="flex gap-2 mr-2">
                <Button variant="outline" type="button" className="bg-background border-border hover:bg-muted font-semibold w-1/2" onClick={() => onOpenChange(false)}>
                  Discard
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="font-bold shadow-sm w-1/2">
                   {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


