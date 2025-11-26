'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getStudentRegisteredCourses() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return [];
  }

  // Get all registrations for this student with course details
  const { data: registrations, error } = await supabase
    .from('registrations' as any)
    .select(`
      id,
      reg_date,
      grade,
      status,
      courses!inner(
        id,
        name,
        credits,
        description,
        semesters(name),
        lecturers(first_name, last_name),
        departments(name)
      )
    `)
    .eq('student_id', student.id)
    .order('reg_date', { ascending: false }) as any;

  if (error) {
    console.error('Error fetching student registrations:', error);
    return [];
  }

  if (!registrations) {
    return [];
  }

  return registrations.map((reg: any) => ({
    id: reg.id,
    reg_date: reg.reg_date,
    grade: reg.grade,
    status: reg.status as 'pending' | 'active' | 'complete',
    course_name: reg.courses.name,
    credits: reg.courses.credits,
    description: reg.courses.description,
    semester_name: reg.courses.semesters?.name,
    lecturer_name: reg.courses.lecturers 
      ? `${reg.courses.lecturers.first_name} ${reg.courses.lecturers.last_name}`
      : 'N/A',
    department_name: reg.courses.departments?.name,
  }));
}

export async function getAvailableCoursesForStudent() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Get student record with program
  const { data: student } = await supabase
    .from('students')
    .select('id, program_id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return [];
  }

  // Get all courses for the student's program
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      name,
      credits,
      description,
      semesters(id, name, start_date, end_date),
      lecturers(first_name, last_name),
      departments(name)
    `)
    .eq('program_id', student.program_id)
    .order('name');

  if (error) {
    console.error('Error fetching available courses:', error);
    return [];
  }

  if (!courses) {
    return [];
  }

  // Get student's existing registrations to check which courses they're already enrolled in
  const { data: existingRegistrations } = await supabase
    .from('registrations' as any)
    .select('course_id, status')
    .eq('student_id', student.id) as any;

  const registeredCourseIds = new Set(
    existingRegistrations?.map((reg: any) => reg.course_id) || []
  );

  return courses.map(course => ({
    id: course.id,
    name: course.name,
    credits: course.credits,
    description: course.description,
    semester_name: course.semesters?.name,
    semester_start: course.semesters?.start_date,
    semester_end: course.semesters?.end_date,
    lecturer_name: course.lecturers 
      ? `${course.lecturers.first_name} ${course.lecturers.last_name}`
      : 'N/A',
    department_name: course.departments?.name,
    is_registered: registeredCourseIds.has(course.id),
  }));
}

export async function requestCourseEnrollment(formData: FormData) {
  const supabase = await createClient();
  const courseId = parseInt(formData.get('courseId') as string);

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect('/student/courses/browse?error=' + encodeURIComponent('Not authenticated'));
  }

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return redirect('/student/courses/browse?error=' + encodeURIComponent('Student record not found'));
  }

  // Check if already registered
  const { data: existingReg } = await supabase
    .from('registrations')
    .select('id')
    .eq('student_id', student.id)
    .eq('course_id', courseId)
    .single();

  if (existingReg) {
    return redirect('/student/courses/browse?error=' + encodeURIComponent('Already registered for this course'));
  }

  // Create pending registration
  const { error } = await supabase
    .from('registrations' as any)
    .insert({
      student_id: student.id,
      course_id: courseId,
      status: 'pending',
      reg_date: new Date().toISOString(),
    } as any);

  if (error) {
    console.error('Error creating registration:', error);
    return redirect('/student/courses/browse?error=' + encodeURIComponent('Failed to request enrollment'));
  }

  revalidatePath('/student/courses');
  revalidatePath('/student/courses/browse');
  return redirect('/student/courses/browse?success=requested');
}