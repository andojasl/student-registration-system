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

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return [];
  }

  const { data: registrations, error } = await supabase
    .from('registrations')
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
    .order('reg_date', { ascending: false });

  if (error) {
    console.error('Error fetching student registrations:', error);
    return [];
  }

  if (!registrations) {
    return [];
  }

  return registrations.map(reg => ({
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

  const { data: student } = await supabase
    .from('students')
    .select('id, program_id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return [];
  }

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

  const filtered_courses = courses?.filter(course => course.semesters?.end_date > new Date().toISOString())

  const { data: existingRegistrations } = await supabase
    .from('registrations')
    .select('course_id, status')
    .eq('student_id', student.id);

  const registeredCourseIds = new Set(
    existingRegistrations?.map(reg => reg.course_id) || []
  );

  return filtered_courses.map(course => ({
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
  const courseId = formData.get('courseId') as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/courses/browse?error=not_authenticated');
  }

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return redirect('/courses/browse?error=student_not_found');
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      semesters(end_date)
    `)
    .eq('id', courseId)
    .single();

  if (courseError || !course?.semesters?.end_date) {
    return redirect('/courses/browse?error=invalid_course');
  }

  const semesterEnd = new Date(course.semesters.end_date);
  const now = new Date();

  if (now > semesterEnd) {
    return redirect('/courses/browse?error=semester_ended');
  }

  const { data: existingReg } = await supabase
    .from('registrations')
    .select('id')
    .eq('student_id', student.id)
    .eq('course_id', courseId)
    .single();

  if (existingReg) {
    return redirect('/courses/browse?error=already_registered');
  }

  const { error } = await supabase
    .from('registrations')
    .insert({
      student_id: student.id,
      course_id: courseId,
      status: 'pending',
      reg_date: new Date().toISOString(),
    });

  if (error) {
    return redirect('/courses/browse?error=request_failed');
  }

  revalidatePath('/courses');
  revalidatePath('/courses/browse');
  return redirect('/courses/browse?success=requested');
}