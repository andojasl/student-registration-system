'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getPendingEnrollments() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Get lecturer record
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) {
    return [];
  }

  // Get all pending enrollment requests for courses taught by this lecturer
  const { data: enrollments, error } = await supabase
    .from('registrations')
    .select(`
      id,
      reg_date,
      student_id,
      course_id,
      students!inner(
        first_name,
        last_name,
        email,
        programs(name)
      ),
      courses!inner(
        name,
        credits,
        lecturer_id
      )
    `)
    .eq('status', 'pending')
    .eq('courses.lecturer_id', lecturer.id)
    .order('reg_date', { ascending: false });

  if (error) {
    console.error('Error fetching pending enrollments:', error);
    return [];
  }

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  return enrollments.map(enrollment => ({
    id: enrollment.id,
    reg_date: enrollment.reg_date,
    student_id: enrollment.student_id,
    course_id: enrollment.course_id,
    student_first_name: enrollment.students.first_name,
    student_last_name: enrollment.students.last_name,
    student_email: enrollment.students.email,
    program_name: enrollment.students.programs?.name || 'N/A',
    course_name: enrollment.courses.name,
    course_credits: enrollment.courses.credits,
  }));
}

export async function approveEnrollment(formData: FormData) {
  const supabase = await createClient();
  const registrationId = formData.get('registrationId') as string;

  // Update registration status to active
  const { error } = await supabase
    .from('registrations')
    .update({ status: 'active' })
    .eq('id', registrationId);

  if (error) {
    console.error('Error approving enrollment:', error);
    return redirect('/lecturer/enrollments?error=' + encodeURIComponent('Failed to approve enrollment'));
  }

  revalidatePath('/lecturer/enrollments');
  return redirect('/lecturer/enrollments?success=approved');
}

export async function rejectEnrollment(formData: FormData) {
  const supabase = await createClient();
  const registrationId = formData.get('registrationId') as string;

  // Delete the registration
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', registrationId);

  if (error) {
    console.error('Error rejecting enrollment:', error);
    return redirect('/lecturer/enrollments?error=' + encodeURIComponent('Failed to reject enrollment'));
  }

  revalidatePath('/lecturer/enrollments');
  return redirect('/lecturer/enrollments?success=rejected');
}