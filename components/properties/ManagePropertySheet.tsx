'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Loader2Icon,
  Building2,
  MapPin,
  Link as LinkIcon,
  Copy,
  Plus,
  Trash2,
  ImageIcon,
  UploadCloud,
  Clock,
  Zap,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PropertyTypesApi } from '@/types/propertyTypes';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  managePropertySchema,
  ManagePropertySchemaType,
} from '@/lib/schemas/property';
// import DeleteIcalDialog from './DeleteIcalAlertDialog';
// import DeleteIcalDialogAlert from './DeleteIcalAlertDialog';
import {
  addPropertyIcalAction,
  deletePropertyAction,
  deletePropertyIcalAction,
  togglePropertyTemplateAction,
  updatePropertyAction,
  updatePropertyTemplateOffsetAction,
} from '@/lib/actions/propertiesActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/utils/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import DeleteIcalAlertDialog from './DeleteIcalAlertDialog';

const platformOptions = [
  { value: 'Airbnb', label: 'Airbnb', icon: '/icons/airbnb.svg' },
  { value: 'Booking', label: 'Booking.com', icon: '/icons/booking.svg' },
  { value: 'Vrbo', label: 'Vrbo', icon: '/icons/vrbo.svg' },
  { value: 'Expedia', label: 'Expedia', icon: '/icons/expedia.svg' },
];

const platformIcons: Record<string, string> = {
  Airbnb: '/icons/airbnb-short.png',
  Booking: '/icons/booking-short.png',
  Vrbo: '/icons/vrbo-short.png',
  Expedia: '/icons/expedia-short.png',
};

// ============================================================================
// HELPER: Relative Time Formatter
// ============================================================================
function getRelativeTime(dateString?: string | null) {
  if (!dateString) return 'Never synced';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

// ============================================================================
// MATH HELPERS FOR HUMAN-READABLE AUTOMATIONS
// ============================================================================
type TimeUnit = 'minutes' | 'hours' | 'days';
type TimeDirection = 'after' | 'before';

interface HumanReadableOffset {
  value: number;
  unit: TimeUnit;
  direction: TimeDirection;
}

// 1. Convert DB Integer (minutes) -> UI State
function parseOffset(totalMinutes: number): HumanReadableOffset {
  const direction: TimeDirection = totalMinutes >= 0 ? 'after' : 'before';
  const absMinutes = Math.abs(totalMinutes);

  if (absMinutes === 0) {
    return { value: 0, unit: 'minutes', direction: 'after' };
  }
  if (absMinutes % 1440 === 0) {
    return { value: absMinutes / 1440, unit: 'days', direction };
  }
  if (absMinutes % 60 === 0) {
    return { value: absMinutes / 60, unit: 'hours', direction };
  }
  return { value: absMinutes, unit: 'minutes', direction };
}

// 2. Convert UI State -> DB Integer (minutes)
function calculateMinutes(state: HumanReadableOffset): number {
  let minutes = state.value;
  if (state.unit === 'hours') minutes *= 60;
  if (state.unit === 'days') minutes *= 1440;

  return state.direction === 'before' ? -minutes : minutes;
}

interface ManagePropertySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  property: PropertyTypesApi | null;
  availableTemplates: any[];
}

// ============================================================================
// MAIN COMPONENT: Manage Property Sheet
// ============================================================================
export default function ManagePropertySheet({
  isOpen,
  onOpenChange,
  property,
  availableTemplates,
}: ManagePropertySheetProps) {
  const router = useRouter();
  // console.log('Available Templates in Manage Property Sheet: ', availableTemplates);
  // console.log('Property in Manage Property Sheet: ', property);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isAddingIcal, setIsAddingIcal] = useState(false);
  const [syncingIcalId, setSyncingIcalId] = useState<string | null>(null);

  // Deletion States for Property
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);
  const [isDeletePropertyOpen, setIsDeletePropertyOpen] = useState(false);

  // --- OPTIMISTIC UI STATE FOR iCAL URLs and Template Links ---
  const [optimisticIcals, setOptimisticIcals] = useState<any[]>([]);
  const [optimisticTemplateLinks, setOptimisticTemplateLinks] = useState<any[]>(
    [],
  );

  // --- AUTOMATION SETTINGS STATES ---
  const [localOffsets, setLocalOffsets] = useState<
    Record<string, HumanReadableOffset>
  >({});
  const [isUpdatingOffset, setIsUpdatingOffset] = useState<string | null>(null);
  const [isPendingUpdateOffset, startTransitionUpdateOffset] = useTransition();

  // Delete Ical states
  const [isPendingDeleteIcal, startTransitionDeleteIcal] = useTransition();
  const [isDeleteIcalOpen, setIsDeleteIcalOpen] = useState(false);

  // --- COVER PHOTO STATES ---
  const [newCoverPhoto, setNewCoverPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCoverPhotoRemoved, setIsCoverPhotoRemoved] = useState(false);

  // 1. SINGLE UNIFIED FORM
  const form = useForm<ManagePropertySchemaType>({
    resolver: zodResolver(managePropertySchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      rooms: 1,
      newPlatform: '',
      newIcalUrl: '',
    },
  });

  // Populate form and optimistic state when sheet opens or property updates
  useEffect(() => {
    if (property && isOpen) {
      form.reset({
        title: property.title || '',
        description: property.description || '',
        location: property.location || '',
        rooms: property.rooms || 1,
        newPlatform: '',
        newIcalUrl: '',
      });
      setOptimisticIcals(property.property_icals || []);
      setIsDeletePropertyOpen(false);
      setOptimisticTemplateLinks(property.template_links || []);
      setLocalOffsets({});

      // Reset image states
      setNewCoverPhoto(null);
      setIsCoverPhotoRemoved(false);
      setPreviewUrl(property.image_url || null);
    }
  }, [property, isOpen, form]);

  // PHOTO HANDLERS
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size exceeds 5MB limit');
      return;
    }
    setNewCoverPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsCoverPhotoRemoved(false);
  };

  const handleRemovePhoto = () => {
    setNewCoverPhoto(null);
    setPreviewUrl(null);
    setIsCoverPhotoRemoved(true);
  };

  const hasUnsavedChanges =
    form.formState.isDirty || newCoverPhoto !== null || isCoverPhotoRemoved;

  // MAIN SUBMIT HANDLER: Triggered only by the "Save Details" button
  const onSubmitDetails = async (data: ManagePropertySchemaType) => {
    if (!property) return;
    setIsSavingDetails(true);
    // console.log('Data in onSubmitDetails: ', data);
    // console.log('Property Image: ', newCoverPhoto);
    // console.log('Property Image review URL: ', previewUrl);
    try {
      // Upload file to Supabase Storage
      let imageUrl = property.image_url || null;
      if (newCoverPhoto) {
        const supabase = createClient();
        const fileExt = newCoverPhoto.name.split('.').pop();
        const fileName = `${property.id}-${crypto.randomUUID()}.${fileExt}`;
        const { data: storageData, error: storageError } =
          await supabase.storage
            .from('property_images')
            .upload(fileName, newCoverPhoto, {
              cacheControl: '3600',
              upsert: false,
            });
        if (storageError) {
          console.error('Error uploading image:', storageError);
          toast.error('Failed to upload image');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('property_images')
          .getPublicUrl(fileName);
        if (publicUrlData.publicUrl) {
          imageUrl = publicUrlData.publicUrl;
        }
      }

      const updatePropertyPayload = {
        title: data.title,
        description: data.description,
        location: data.location,
        rooms: data.rooms,
        image_url: imageUrl || undefined,
        newIcalUrl: data.newIcalUrl,
        newPlatform: data.newPlatform,
      };
      // TODO: Replace with your actual server action
      const response = await updatePropertyAction(
        property.id,
        updatePropertyPayload,
      );

      // console.log('Response updating property: ', response);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Property details updated successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update property details');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // --- TEMPLATE AUTOMATION HANDLERS (OPTIMISTIC) ---
  const handleToggleTemplate = async (templateId: string, checked: boolean) => {
    if (!property) return;

    setIsUpdatingOffset(templateId);

    // Optimistically update the UI instantly
    const existingLinkIndex = optimisticTemplateLinks.findIndex(
      (l) => l.template_id === templateId,
    );
    const previousLinks = [...optimisticTemplateLinks];
    const newLinks = [...optimisticTemplateLinks];

    if (existingLinkIndex >= 0) {
      // Update existing link
      newLinks[existingLinkIndex] = {
        ...newLinks[existingLinkIndex],
        is_active: checked,
      };
    } else {
      // Create new optimistic link
      newLinks.push({
        id: crypto.randomUUID(),
        property_id: property.id,
        template_id: templateId,
        is_active: checked,
        offset_minutes: 0,
      });
    }

    setOptimisticTemplateLinks(newLinks);

    try {
      //Server Action here to create/update the `property_template_link` in the DB
      await togglePropertyTemplateAction(property.id, templateId, checked);

      toast.success(
        checked ? 'Automation activated' : 'Automation deactivated',
      );
      // Clear the dirty local state so the button resets
      setLocalOffsets((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
      router.refresh();
    } catch (error) {
      // Revert if API fails
      setOptimisticTemplateLinks(previousLinks);
      setIsUpdatingOffset(null);
      toast.error('Failed to toggle automation');
    } finally {
      setIsUpdatingOffset(null);
    }
  };

  const handleUpdateOffset = async (
    templateId: string,
    newState: HumanReadableOffset,
  ) => {
    if (!property) return;

    setIsUpdatingOffset(templateId);

    // Calculate integer
    const finalMinutes = calculateMinutes(newState);

    // Update local state instantly
    setOptimisticTemplateLinks((prev) =>
      prev.map((link) =>
        link.template_id === templateId
          ? { ...link, offset_minutes: finalMinutes }
          : link,
      ),
    );

    try {
      // TODO: Call your Server Action to update the `offset_minutes` in the DB
      await updatePropertyTemplateOffsetAction(
        property.id,
        templateId,
        finalMinutes,
      );
      // await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API

      toast.success('Schedule rule saved');

      // Clear the dirty local state so the button resets
      setLocalOffsets((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
    } catch (error) {
      toast.error('Failed to save schedule rule');
      // Ideally, revert the state here if needed
    } finally {
      setIsUpdatingOffset(null);
    }
  };

  // INLINE ACTION HANDLER: Triggered manually by "Add Calendar Connection"
  const handleAddIcal = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!property) return;

    const platform = form.getValues('newPlatform');
    const url = form.getValues('newIcalUrl');

    let hasError = false;
    if (!platform) {
      form.setError('newPlatform', {
        type: 'manual',
        message: 'Please select a platform',
      });
      hasError = true;
    }
    if (!url) {
      form.setError('newIcalUrl', {
        type: 'manual',
        message: 'URL is required',
      });
      hasError = true;
    }

    const isUrlValid = await form.trigger('newIcalUrl');
    if (hasError || !isUrlValid) return;

    setIsAddingIcal(true);

    try {
      // Call add iCal Action
      const response = await addPropertyIcalAction({
        propertyId: property.id,
        platform: platform,
        icalUrl: url,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (response.error) {
        toast.error(response.error);
        return;
      }
      // Clear inline form inputs
      form.setValue('newPlatform', '');
      form.setValue('newIcalUrl', '');
      form.clearErrors(['newPlatform', 'newIcalUrl']);

      toast.success('Calendar link added successfully');
      setOptimisticIcals((prev) => [...prev, response.ical]);

      // Refresh to grab true database IDs
      router.refresh();
    } catch (error) {
      // Revert optimistic addition on failure
      toast.error('Failed to add calendar link');
    } finally {
      setIsAddingIcal(false);
    }
  };

  // DELETE ICAL HANDLER (OPTIMISTIC)
  const handleDeleteIcal = async (icalId: string) => {
    const previousIcals = [...optimisticIcals];
    try {
      startTransitionDeleteIcal(async () => {
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        const response = await deletePropertyIcalAction(icalId);

        console.log('Client response in deleting iCal URL: ', response);
        if (!response.error) {
          toast.success('Calendar link deleted successfully');
          setOptimisticIcals((prev) =>
            prev.filter((ical) => ical.id !== icalId),
          );
          setIsDeleteIcalOpen(false);
          router.refresh();
        }
      });
    } catch (error) {
      // Revert optimistic deletion on failure
      console.log('Error in deleting iCal URL: ', error);
      setOptimisticIcals(previousIcals);
      toast.error('Failed to delete calendar link');
    }
  };

  // Handle Sync iCal URL

  const handleForceSync = async (icalId: string) => {
    if (!property) return;
    setSyncingIcalId(icalId);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icalId: icalId }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const result = await response.json();

      // 1. UPDATE INDIVIDUAL STATUSES BASED ON THE RESULTS ARRAY
      setOptimisticIcals((prev) =>
        prev.map((ical) => {
          // Find the specific sync result for this calendar link
          const specificResult = result.results?.find(
            (r: any) => r.icalSourceId === ical.id,
          );

          if (specificResult) {
            return {
              ...ical,
              sync_status: specificResult.success ? 'success' : 'error',
              // Only update the timestamp if it actually succeeded
              last_synced_at: specificResult.success
                ? new Date().toISOString()
                : ical.last_synced_at,
            };
          }
          return ical;
        }),
      );

      // 2. SHOW SMART TOAST NOTIFICATIONS
      if (result.summary.failedSyncs === 0) {
        // 100% Success
        toast.success(
          `Sync complete! ${result.summary.totalNewBookings} new, ${result.summary.totalUpdatedBookings} updated.`,
        );
      } else if (result.summary.successfulSyncs > 0) {
        // Partial Success (e.g., 3 succeeded, 1 failed)
        toast.warning(
          `Partial sync: ${result.summary.successfulSyncs} calendars synced, ${result.summary.failedSyncs} failed.`,
        );
      } else {
        // 100% Failure
        toast.error('Sync failed. Please check your calendar URLs.');
      }

      // Refresh the router to pull in any new bookings/tasks
      router.refresh();
    } catch (error) {
      console.error('Sync failed:', error);
      // Fallback: If the network request completely crashes, mark the clicked one as an error
      setOptimisticIcals((prev) =>
        prev.map((ical) =>
          ical.id === icalId ? { ...ical, sync_status: 'error' } : ical,
        ),
      );
      toast.error('Network error. Failed to reach the sync server.');
    } finally {
      setSyncingIcalId(null);
    }
  };

  // DELETE PROPERTY HANDLER
  const handleDeleteProperty = async () => {
    if (!property) return;
    setIsDeletingProperty(true);
    try {
      // Delete property server action
      const result = await deletePropertyAction(property.id);
      if (result?.result === 'fail') {
        toast.error(result?.error?.message || 'Failed to delete property');
      }
      //   await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Property deleted successfully');
      setIsDeletePropertyOpen(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete property');
    } finally {
      setIsDeletingProperty(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('iCal URL copied to clipboard');
  };

  if (!property) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-[550px] p-0 flex flex-col h-full bg-slate-50 border-l border-border z-[100]'>
        {/* ENTIRE SHEET IS WRAPPED IN ONE FORM */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmitDetails)}
            className='flex flex-col h-full overflow-hidden'>
            {/* --- HEADER --- */}
            <SheetHeader className='px-6 py-6 bg-white shadow-sm shrink-0'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0'>
                  <Building2 className='w-5 h-5 text-primary' />
                </div>
                <div>
                  <SheetTitle className='text-xl font-bold text-foreground'>
                    {property.title}
                  </SheetTitle>
                  <SheetDescription className='flex items-center gap-1 mt-0.5 text-xs font-medium'>
                    <MapPin className='w-3 h-3' /> {property.location}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* --- TABS --- */}
            <Tabs
              defaultValue='details'
              className='flex-1 gap-0 flex flex-col overflow-hidden'>
              <div className='bg-white px-6 pb-1 shrink-0 shadow-sm z-10 border-b border-border'>
                <TabsList className='w-full px-1 pb-1 grid grid-cols-3 bg-muted/50'>
                  <TabsTrigger
                    value='details'
                    className='text-xs font-bold data-[state=active]:bg-white data-[state=active]:w-full data-[state=active]:shadow-sm'>
                    Property Details
                  </TabsTrigger>
                  <TabsTrigger
                    value='sync'
                    className='text-xs font-bold data-[state=active]:bg-white data-[state=active]:w-full data-[state=active]:shadow-sm'>
                    Calendar Sync
                  </TabsTrigger>
                  <TabsTrigger
                    value='automations'
                    className='text-xs font-bold data-[state=active]:bg-white data-[state=active]:w-full data-[state=active]:shadow-sm'>
                    Automations
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* ========================================== */}
              {/* TAB 1: DETAILS                             */}
              {/* ========================================== */}
              <TabsContent
                value='details'
                className='m-0 outline-none flex-1 flex-col overflow-hidden data-[state=active]:flex'>
                {/* Scrollable Form Content */}
                <ScrollArea className='min-h-0 h-full w-full py-4 px-6'>
                  <div className='space-y-4'>
                    {/* --- COVER PHOTO UPLOAD ZONE --- */}
                    <div className='bg-white border border-border rounded-md p-5 shadow-sm space-y-4'>
                      <h3 className='text-sm font-bold text-foreground flex items-center gap-2 mb-2'>
                        <ImageIcon className='w-4 h-4 text-muted-foreground' />{' '}
                        Cover Photo
                      </h3>

                      {previewUrl ? (
                        <div className='relative w-full h-48 rounded-lg overflow-hidden border border-border group'>
                          <Image
                            src={previewUrl}
                            alt='Cover'
                            fill
                            className='object-cover'
                          />
                          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                            <Button
                              type='button'
                              variant='destructive'
                              size='sm'
                              onClick={handleRemovePhoto}>
                              <Trash2 className='w-4 h-4 mr-2' /> Remove Photo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className='relative w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group'
                          onClick={() =>
                            document.getElementById('cover-upload')?.click()
                          }
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              e.dataTransfer.files &&
                              e.dataTransfer.files[0]
                            ) {
                              handlePhotoSelect(e.dataTransfer.files[0]);
                            }
                          }}>
                          <input
                            id='cover-upload'
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0])
                                handlePhotoSelect(e.target.files[0]);
                            }}
                          />
                          <div className='p-3 bg-background rounded-full shadow-sm mb-3 border border-border group-hover:border-primary group-hover:text-primary transition-colors'>
                            <UploadCloud className='w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors' />
                          </div>
                          <p className='text-sm font-semibold text-foreground'>
                            Click or drag photo here
                          </p>
                          <p className='text-xs text-muted-foreground mt-1'>
                            Recommended format: 16:9 ratio (Max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                    <div className='bg-white border border-border rounded-md p-5 shadow-sm space-y-4'>
                      <FormField
                        control={form.control}
                        name='title'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                              Property Title
                            </FormLabel>
                            <FormControl>
                              <Input className='bg-muted/20' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='grid grid-cols-2 gap-4'>
                        <FormField
                          control={form.control}
                          name='location'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                                Location
                              </FormLabel>
                              <FormControl>
                                <Input className='bg-muted/20' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='rooms'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                                Rooms
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  min={1}
                                  className='bg-muted/20'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name='description'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                              Description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                className='min-h-[100px] bg-muted/20 resize-none'
                                placeholder='Internal notes or description...'
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </ScrollArea>

                {/* --- STICKY FOOTER ONLY FOR DETAILS TAB --- */}
                <div className='p-4 border-t border-border bg-card shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative'>
                  <div className='flex-1'>
                    <AlertDialog
                      open={isDeletePropertyOpen}
                      onOpenChange={setIsDeletePropertyOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          type='button'
                          variant='ghost'
                          className='text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold px-3'>
                          <Trash2 className='w-4 h-4 mr-2' />
                          Delete Property
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className='z-[200]'>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete {property.title}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this property and all
                            associated calendar links. Tasks and Bookings
                            associated with it will also be deleted. This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeletingProperty}>
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteProperty();
                            }}
                            disabled={isDeletingProperty}>
                            {isDeletingProperty ? (
                              <Loader2Icon className='w-4 h-4 mr-2 animate-spin' />
                            ) : (
                              <Trash2 className='w-4 h-4 mr-2' />
                            )}
                            {isDeletingProperty
                              ? 'Deleting...'
                              : 'Delete Property'}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className='flex gap-2 shrink-0'>
                    <Button
                      variant='outline'
                      type='button'
                      className='bg-background border-border hover:bg-muted font-semibold'
                      onClick={() => onOpenChange(false)}
                      disabled={isDeletingProperty || isSavingDetails}>
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={
                        isDeletingProperty ||
                        !hasUnsavedChanges ||
                        isSavingDetails
                      }
                      className='font-bold shadow-sm'>
                      {isSavingDetails ? (
                        <Loader2Icon className='w-4 h-4 mr-2 animate-spin' />
                      ) : null}
                      {isSavingDetails ? 'Saving...' : 'Save Details'}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ========================================== */}
              {/* TAB 2: CALENDAR SYNC                       */}
              {/* ========================================== */}
              <TabsContent
                value='sync'
                className='m-0 outline-none flex-1 flex-col overflow-hidden data-[state=active]:flex'>
                <ScrollArea className='min-h-0 h-full w-full py-4 px-6'>
                  <div className='space-y-4'>
                    {/* EXISTING CONNECTIONS (OPTIMISTIC) */}
                    <div className='bg-white border border-border rounded-md shadow-sm overflow-hidden'>
                      <div className='px-5 py-3 border-b border-border bg-muted/30'>
                        <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                          <LinkIcon className='w-4 h-4 text-muted-foreground' />{' '}
                          Active Connections
                        </h3>
                      </div>

                      <div className='p-2 space-y-1'>
                        {optimisticIcals.length === 0 ? (
                          <div className='p-6 text-center text-sm text-muted-foreground italic'>
                            No calendar links connected yet.
                          </div>
                        ) : (
                          optimisticIcals.map((ical) => {
                            const isSyncing = syncingIcalId === ical.id;
                            const isError = ical.sync_status === 'error';
                            return (
                              <div
                                key={ical.id}
                                className='flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border'>
                                <div className='flex-1 flex items-center gap-3 overflow-hidden'>
                                  <Avatar
                                    className={`items-center justify-center bg-white `}>
                                    <AvatarImage
                                      src={
                                        platformIcons[ical.platform] ||
                                        '/icons/default.svg'
                                      }
                                    />
                                    <AvatarFallback>
                                      {ical.platform.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className='flex-1 flex flex-col min-w-0'>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-sm font-bold text-foreground'>
                                        {ical.platform}
                                      </span>
                                      {isSyncing ? (
                                        <Badge
                                          variant='outline'
                                          className='text-[9px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200 gap-1 shadow-sm'>
                                          <RefreshCw className='w-2.5 h-2.5 animate-spin mr-[2px]' />{' '}
                                          Syncing
                                        </Badge>
                                      ) : ical.sync_status === 'pending' ? (
                                        <Badge
                                          variant='outline'
                                          className='text-[9px] h-4 px-1.5 bg-muted text-muted-foreground border-border gap-1 shadow-sm'>
                                          <Clock className='w-2.5 h-2.5 mr-[2px]' />{' '}
                                          Pending
                                        </Badge>
                                      ) : ical.sync_status === 'error' ? (
                                        <Badge
                                          variant='destructive'
                                          className='text-[9px] h-4 px-1.5 gap-1 shadow-sm'>
                                          <AlertCircle className='w-2.5 h-2.5 mr-[2px]' />{' '}
                                          Failed
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant='secondary'
                                          className='text-[9px] h-4 px-1.5 gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-sm'>
                                          <CheckCircle2 className='w-2.5 h-2.5 mr-[2px]' />{' '}
                                          Healthy
                                        </Badge>
                                      )}
                                    </div>

                                    <span
                                      className='text-xs text-muted-foreground truncate mt-0.5'
                                      title={ical.ical_url}>
                                      {ical.ical_url}
                                    </span>

                                    {/* TIMESTAMP */}
                                    <span className='text-[10px] text-muted-foreground mt-1 flex items-center gap-1'>
                                      <Clock className='w-3 h-3' />{' '}
                                      {getRelativeTime(ical.last_synced_at)}
                                    </span>
                                  </div>
                                </div>

                                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    title='Force Sync Now'
                                    disabled={isSyncing}
                                    className={`h-8 w-8 ${isSyncing ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                                    onClick={() => handleForceSync(ical.id)}>
                                    <RefreshCw
                                      className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                                    />
                                  </Button>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-muted-foreground hover:text-foreground'
                                    onClick={() =>
                                      copyToClipboard(ical.ical_url)
                                    }>
                                    <Copy className='w-4 h-4' />
                                  </Button>

                                  {/* SEPARATED DELETE ICAL COMPONENT */}
                                  <DeleteIcalAlertDialog
                                    icalId={ical.id}
                                    platform={ical.platform}
                                    onConfirm={handleDeleteIcal}
                                    isPendingDeleteIcal={isPendingDeleteIcal}
                                    isOpen={isDeleteIcalOpen}
                                    setIsOpen={setIsDeleteIcalOpen}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* ADD NEW CONNECTION USING UNIFIED FORM */}
                    <div className='bg-white border border-border rounded-md shadow-sm overflow-hidden'>
                      <div className='px-5 py-3 border-b border-border bg-muted/30'>
                        <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                          <Plus className='w-4 h-4 text-muted-foreground' /> Add
                          New Link
                        </h3>
                      </div>

                      <div className='p-5 space-y-4'>
                        <FormField
                          control={form.control}
                          name='newPlatform'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                                Platform
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}>
                                <FormControl>
                                  <SelectTrigger className='bg-muted/20'>
                                    <SelectValue placeholder='Select platform' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className='z-[200]'>
                                  {platformOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}>
                                      <div className='flex items-center gap-2'>
                                        <Image
                                          src={option.icon}
                                          alt={option.label}
                                          width={16}
                                          height={16}
                                          className='object-contain'
                                        />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='newIcalUrl'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                                iCal URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='https://.../calendar.ics'
                                  className='bg-muted/20'
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddIcal(e);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type='button'
                          onClick={handleAddIcal}
                          className='w-full font-bold shadow-sm'
                          disabled={isAddingIcal}>
                          {isAddingIcal ? (
                            <Loader2Icon className='w-4 h-4 mr-2 animate-spin' />
                          ) : null}
                          Add Calendar Connection
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ========================================== */}
              {/* TAB 3: AUTOMATIONS                         */}
              {/* ========================================== */}
              <TabsContent
                value='automations'
                className='m-0 outline-none flex-1 flex-col min-h-0 data-[state=active]:flex'>
                <div className='flex-1 min-h-0'>
                  <ScrollArea className='h-full w-full'>
                    <div className='px-6 py-6 space-y-6'>
                      {/* AUTOMATIONS HEADER */}
                      <div className='bg-white border border-border rounded-md shadow-sm overflow-hidden'>
                        <div className='px-5 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-muted/10'>
                          <h3 className='text-sm font-bold text-foreground flex items-center gap-2 mb-1'>
                            <Zap className='w-4 h-4 text-primary' /> Task
                            Automations
                          </h3>
                          <p className='text-xs text-muted-foreground leading-relaxed'>
                            Link task templates to this property. When an iCal
                            booking syncs, active templates will automatically
                            generate tasks for your team.
                          </p>
                        </div>

                        {/* LIST OF ALL AVAILABLE TEMPLATES */}
                        <div className='p-4 space-y-4 bg-slate-50/50'>
                          {availableTemplates.map((template) => {
                            // Find if this template is actively linked to this property
                            const currentLink = optimisticTemplateLinks.find(
                              (link) => link.template_id === template.id,
                            );
                            const isActive = currentLink?.is_active || false;
                            // const currentOffset = currentLink?.offset_minutes || 0;
                            // const hasDirtyOffset = localOffsets[template.id] !== undefined && localOffsets[template.id] !== currentOffset;

                            // Initialize UI State
                            const dbOffset = currentLink?.offset_minutes || 0;
                            const currentParsedState = parseOffset(dbOffset);

                            // Use local state if it exists, otherwise fall back to db state
                            const uiState =
                              localOffsets[template.id] || currentParsedState;
                            // Check if local state differs from db state
                            const hasDirtyOffset =
                              localOffsets[template.id] !== undefined &&
                              calculateMinutes(localOffsets[template.id]) !==
                                dbOffset;

                            return (
                              <div
                                key={template.id}
                                className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${isActive ? 'border-primary/40 shadow-sm' : 'border-border shadow-sm opacity-80'}`}>
                                {/* TEMPLATE HEADER & TOGGLE */}
                                <div className='p-4 flex items-center justify-between gap-4'>
                                  <div className='min-w-0'>
                                    <div className='flex items-center gap-2 mb-1'>
                                      <p className='font-bold text-sm text-foreground truncate'>
                                        {template.name}
                                      </p>
                                    </div>
                                    <Badge
                                      variant='secondary'
                                      className='text-[10px] font-semibold bg-muted uppercase tracking-wider'>
                                      {template.task_type}
                                    </Badge>
                                  </div>

                                  {/* THE OPTIMISTIC SWITCH */}
                                  <Switch
                                    checked={isActive}
                                    onCheckedChange={(checked) =>
                                      handleToggleTemplate(template.id, checked)
                                    }
                                  />
                                </div>

                                {/* COLLAPSIBLE SETTINGS (Only shows if ON) */}
                                {isActive && (
                                  <div className='bg-primary/5 border-t border-primary/10 p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200'>
                                    <div className='flex items-center justify-between gap-4'>
                                      <div>
                                        <label className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                                          <Clock className='w-3.5 h-3.5' />{' '}
                                          Scheduling Rule
                                        </label>
                                        <p className='text-[10px] text-muted-foreground mt-0.5'>
                                          When should this task occur?
                                        </p>
                                      </div>

                                      {/* THE SAVE BUTTON */}
                                      <Button
                                        type='button'
                                        size='sm'
                                        variant={
                                          hasDirtyOffset
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        disabled={
                                          !hasDirtyOffset ||
                                          isUpdatingOffset === template.id
                                        }
                                        onClick={() =>
                                          handleUpdateOffset(
                                            template.id,
                                            uiState,
                                          )
                                        }
                                        className='h-8 px-3 shadow-sm transition-all shrink-0'>
                                        {isUpdatingOffset === template.id ||
                                        isPendingUpdateOffset ? (
                                          <Loader2Icon className='w-3.5 h-3.5 animate-spin' />
                                        ) : (
                                          <Save className='w-3.5 h-3.5 mr-1.5' />
                                        )}
                                        {isUpdatingOffset === template.id
                                          ? ''
                                          : 'Save'}
                                      </Button>
                                    </div>

                                    {/* HUMAN READABLE SENTENCE BUILDER */}
                                    <div className='flex items-center flex-wrap gap-2'>
                                      <div className='relative w-20 shrink-0'>
                                        <Input
                                          type='number'
                                          min={0}
                                          value={uiState.value}
                                          onChange={(e) => {
                                            const val = Math.max(
                                              0,
                                              parseInt(e.target.value) || 0,
                                            );
                                            setLocalOffsets((prev) => ({
                                              ...prev,
                                              [template.id]: {
                                                ...uiState,
                                                value: val,
                                              },
                                            }));
                                          }}
                                          className='bg-white border-primary/20 h-9 text-sm font-bold shadow-sm'
                                        />
                                      </div>

                                      <Select
                                        value={uiState.unit}
                                        onValueChange={(val: TimeUnit) =>
                                          setLocalOffsets((prev) => ({
                                            ...prev,
                                            [template.id]: {
                                              ...uiState,
                                              unit: val,
                                            },
                                          }))
                                        }>
                                        <SelectTrigger className='w-[110px] h-9 bg-white border-primary/20 font-medium text-sm shadow-sm'>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className='z-[200]'>
                                          <SelectItem value='minutes'>
                                            Minutes
                                          </SelectItem>
                                          <SelectItem value='hours'>
                                            Hours
                                          </SelectItem>
                                          <SelectItem value='days'>
                                            Days
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <Select
                                        value={uiState.direction}
                                        onValueChange={(val: TimeDirection) =>
                                          setLocalOffsets((prev) => ({
                                            ...prev,
                                            [template.id]: {
                                              ...uiState,
                                              direction: val,
                                            },
                                          }))
                                        }>
                                        <SelectTrigger className='flex-1 h-9 bg-white border-primary/20 font-medium text-sm shadow-sm'>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className='z-[200]'>
                                          <SelectItem value='after'>
                                            After Checkout
                                          </SelectItem>
                                          <SelectItem value='before'>
                                            Before Check-in
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {availableTemplates.length === 0 && (
                            <div className='text-center p-6 border-2 border-dashed border-border rounded-xl'>
                              <p className='text-sm font-bold text-foreground mb-1'>
                                No templates found
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                Go to your{' '}
                                <Link
                                  href='/dashboard/task-templates/new-template'
                                  className='text-primary font-bold underline underline-offset-2 decoration-dashed'>
                                  Task Templates
                                </Link>{' '}
                                to create rules.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
