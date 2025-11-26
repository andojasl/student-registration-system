'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getPendingStudents() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data: lecturer } = await supabase
    .from('lecturers' as any)
    .select('program_id')
    .eq('user_id', user.id)
    .single() as any;

  if (!lecturer?.program_id) {
    return [];
  }

  // Get pending students for this lecturer's program
  // Using the correct foreign table filter syntax
  const { data: students, error } = await supabase
    .from('students' as any)
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      program_id,
      programs!inner(name),
      user!inner(is_active, created_at)
    `)
    .eq('program_id', lecturer.program_id)
    .eq('user.is_active', false) as any;

  // Log error for debugging
  if (error) {
    console.error('Error fetching pending students:', error);
    return [];
  }

  if (!students || students.length === 0) {
    return [];
  }

  // Sort by created_at manually since ordering on foreign tables can be tricky
  return students
    .sort((a: any, b: any) => new Date(b.user.created_at).getTime() - new Date(a.user.created_at).getTime())
    .map((student: any) => ({
      id: student.id,
      user_id: student.user_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,
      date_of_birth: student.date_of_birth,
      program_name: student.programs.name,
      created_at: student.user.created_at,
    }));
}

export async function approveStudent(formData: FormData) {
  const supabase = await createClient();
  const userId = formData.get('userId') as string;

  // Activate the user account
  const { error } = await supabase
    .from('user' as any)
    .update({ is_active: true })
    .eq('id', userId);

  if (error) {
    console.error('Error approving student:', error);
    return redirect('/lecturer/dashboard?error=' + encodeURIComponent('Failed to approve student'));
  }

  revalidatePath('/lecturer/dashboard');
  return redirect('/lecturer/dashboard?success=approved');
}

export async function rejectStudent(formData: FormData) {
  const supabase = await createClient();
  const studentId = parseInt(formData.get('studentId') as string);
  const userId = formData.get('userId') as string;

  // Delete student record (this will cascade to user record due to foreign key)
  const { error: studentError } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (studentError) {
    console.error('Error deleting student:', studentError);
  }

  // Delete user record
  const { error: userError } = await supabase
    .from('user' as any)
    .delete()
    .eq('id', userId);

  if (userError) {
    console.error('Error deleting user:', userError);
  }

  revalidatePath('/lecturer/dashboard');
  return redirect('/lecturer/dashboard?success=rejected');
}