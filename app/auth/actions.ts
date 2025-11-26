'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phone = formData.get('phone') as string;
  const dateOfBirth = formData.get('dateOfBirth') as string;
  const programId = parseInt(formData.get('programId') as string);

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (authError) {
    return redirect('/auth/signup?error=' + encodeURIComponent(authError.message));
  }

  if (!authData.user) {
    return redirect('/auth/signup?error=' + encodeURIComponent('Failed to create user account'));
  }

  // Step 2: Create USER record with inactive status
  const { error: userError } = await supabase
    .from('user' as any)
    .insert({
      id: authData.user.id,
      role: 'student',
      is_active: false,
    });

  if (userError) {
    console.error('Error creating user record:', userError);
    return redirect('/auth/signup?error=' + encodeURIComponent('Failed to create user profile'));
  }

  // Step 3: Create STUDENT record
  const { error: studentError } = await supabase
    .from('students' as any)
    .insert({
      user_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      date_of_birth: dateOfBirth,
      program_id: programId,
      group_id: null,
      department_id: null,
    } as any);

  if (studentError) {
    console.error('Error creating student record:', studentError);
    return redirect('/auth/signup?error=' + encodeURIComponent('Failed to create student profile'));
  }

  return redirect('/auth/signup?success=true');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/auth/login?error=' + encodeURIComponent(error.message));
  }

  // Check if user is active
  const { data: userData } = await supabase
    .from('user' as any)
    .select('is_active, role')
    .eq('id', data.user.id)
    .single() as any;

  if (!userData?.is_active) {
    await supabase.auth.signOut();
    return redirect('/auth/login?error=' + encodeURIComponent('Your account is pending approval. Please wait for a lecturer to activate your account.'));
  }

  revalidatePath('/', 'layout');
  
  // Redirect based on role
  if (userData.role === 'lecturer') {
    return redirect('/lecturer/dashboard');
  } else {
    return redirect('/student');
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return redirect('/auth/login');
}

export async function getUser() {
  const { unstable_noStore: noStore } = await import('next/cache');
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user role and active status
  const { data: userData } = await supabase
    .from('user' as any)
    .select('role, is_active')
    .eq('id', user.id)
    .single() as any;

  return {
    ...user,
    role: userData?.role,
    is_active: userData?.is_active,
  };
}

export async function getPrograms() {
  const { unstable_noStore: noStore } = await import('next/cache');
  noStore();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('programs')
    .select('id, name, degree_type, duration')
    .order('name');

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return data || [];
}