'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { TaxProfileInput } from '@/types/taxProfileTypes';

export async function upsertSoloHostTaxProfileAction(payload: TaxProfileInput) {
  const supabase = await createClient();

  // 1. Authenticate the user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 2. Check if the user already has a tax profile
    const { data: existingProfile } = await supabase
      .from('tax_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let taxProfileId;

    if (existingProfile) {
      // Update existing
      const { error: updateError } = await supabase
        .from('tax_profiles')
        .update(payload)
        .eq('id', existingProfile.id);

      if (updateError) throw updateError;
      taxProfileId = existingProfile.id;
    } else {
      // Insert new
      const { data: newProfile, error: insertError } = await supabase
        .from('tax_profiles')
        .insert({
          user_id: user.id,
          ...payload,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      taxProfileId = newProfile.id;
    }

    // 3. The "Solo Host" Magic: Auto-link this tax profile to all their properties
    const { error: linkError } = await supabase
      .from('properties')
      .update({ tax_profile_id: taxProfileId })
      .eq('owner_id', user.id);

    if (linkError) throw linkError;

    // Refresh the settings page cache
    revalidatePath('/dashboard/settings');

    return { success: true };
  } catch (error: unknown) {
    console.error('⚠️ Error saving tax profile:', error);
    return { success: false, error: error.message };
  }
}
