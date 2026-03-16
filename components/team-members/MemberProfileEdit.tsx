'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Camera, Loader2, Save, X, Phone, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateMemberProfileAction } from '@/lib/actions/teamMemberActions';
import { createClient } from '@/lib/utils/supabase/client';

// --- ZOD SCHEMA ---
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface MemberProfileEditProps {
  profile: any;
  onCancel: () => void;
}

export function MemberProfileEdit({ profile, onCancel }: MemberProfileEditProps) {
  const router = useRouter();
  
  // States for Avatar Upload handling
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize React Hook Form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      phone: profile.phone || '',
    },
  });

  // Handle local image preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      let finalAvatarUrl = profile.avatar_url;

      // 1. Upload Avatar to Supabase Storage if changed
      if (avatarFile) {
        const supabase = createClient();
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        // Ensure you have an 'avatars' bucket created in Supabase!
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        console.log('Avatar upload error: ', uploadError);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          finalAvatarUrl = publicUrl;
        } else {
          toast.error('Failed to upload image. Saving other details...');
          console.error(uploadError);
        }
      }

      // 2. Submit all data to the Server Action
      const result = await updateMemberProfileAction({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || '',
        avatarUrl: finalAvatarUrl
      });

      if (result.success) {
        toast.success('Profile updated successfully!');
        router.refresh(); // Refresh server data
        onCancel(); // Return to view mode
      } else {
        toast.error(result.error || 'Failed to update profile.');
      }
      
    } catch (error) {
      toast.error('An unexpected error occurred.');
    }
  };

  const initials = `${form.watch('firstName')?.[0] || ''}${form.watch('lastName')?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 pb-safe">
      
      {/* --- HEADER --- */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel} 
            className="h-8 w-8 -ml-2 text-muted-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-bold text-foreground ml-2">Edit Profile</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6 max-w-md mx-auto w-full">
          
          {/* --- EDITABLE AVATAR --- */}
          <div className="flex flex-col items-center mt-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-sm transition-opacity opacity-90">
                <AvatarImage src={avatarPreview || ''} className="object-cover" />
                <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-0 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-transform active:scale-95 border-2 border-white"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* --- EDITABLE FIELDS --- */}
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">First Name</FormLabel>
                    <FormControl>
                      <Input className="bg-white border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Last Name</FormLabel>
                    <FormControl>
                      <Input className="bg-white border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card className="bg-white border border-border shadow-sm overflow-hidden mt-4">
              {/* Read-only Email Field */}
              <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-muted/10">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                  <Input value={profile.email} disabled className="mt-1 bg-transparent border-0 px-0 h-6 cursor-not-allowed opacity-70 font-medium" />
                </div>
              </div>

              {/* Editable Phone Field */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" className="mt-1 bg-white h-9 border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </div>

          {/* --- ACTION BUTTONS --- */}
          <div className="pt-4 flex flex-col gap-3">
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-12 font-bold bg-white"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full h-12 font-bold shadow-sm"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Save Changes
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}