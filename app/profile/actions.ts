'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Update profile information
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('user')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: "User not found" };
  }

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phone = formData.get('phone') as string;

  const tableName = userData.role === 'student' ? 'students' : 'lecturers';

  const { error } = await supabase
    .from(tableName)
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    })
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true };
}

// Upload avatar
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get('avatar') as File;
  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF)" };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: "File too large. Maximum size is 2MB" };
  }

  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Delete old avatar if exists
  const { data: userData } = await supabase
    .from('user')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData) {
    const tableName = userData.role === 'student' ? 'students' : 'lecturers';
    const { data: profile } = await supabase
      .from(tableName)
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();

    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
      await supabase.storage.from('avatars').remove([oldPath]);
    }
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update profile with new avatar URL
  const tableName = userData!.role === 'student' ? 'students' : 'lecturers';
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ avatar_url: publicUrl })
    .eq('user_id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true, avatarUrl: publicUrl };
}

// Delete avatar
export async function deleteAvatar() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from('user')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: "User not found" };
  }

  const tableName = userData.role === 'student' ? 'students' : 'lecturers';

  // Get current avatar
  const { data: profile } = await supabase
    .from(tableName)
    .select('avatar_url')
    .eq('user_id', user.id)
    .single();

  if (profile?.avatar_url) {
    const filePath = profile.avatar_url.split('/').slice(-2).join('/');
    await supabase.storage.from('avatars').remove([filePath]);
  }

  // Update profile to remove avatar URL
  const { error } = await supabase
    .from(tableName)
    .update({ avatar_url: null })
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true };
}

// Update email
export async function updateEmail(newEmail: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Update auth email
  const { error: authError } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (authError) {
    return { error: authError.message };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('user')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData) {
    const tableName = userData.role === 'student' ? 'students' : 'lecturers';

    // Update profile email
    await supabase
      .from(tableName)
      .update({ email: newEmail })
      .eq('user_id', user.id);
  }

  return { success: true, message: "Confirmation email sent to your new email address" };
}

// Update password
export async function updatePassword(newPassword: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Password updated successfully" };
}
