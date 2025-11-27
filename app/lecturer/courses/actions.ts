'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getCoursesByLecturer() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase. auth.getUser();
  
  if (!user) {
    return [];
  }

  // Get lecturer record with program info
  const { data: lecturer } = await supabase
    . from('lecturers')
    .select('id, program_id, programs(name)')
    .eq('user_id', user.id)
    . single();

  if (!lecturer?. program_id) {
    return [];
  }

  // Get all courses for this lecturer's program
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      name,
      credits,
      description,
      semester_id,
      lecturer_id,
      semesters(name, start_date, end_date),
      lecturers(first_name, last_name)
    `)
    .eq('program_id', lecturer.program_id)
    .order('semester_id', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return courses?. map((course: any) => ({
    id: course.id,
    name: course.name,
    credits: course.credits,
    description: course.description,
    semester_id: course.semester_id,
    semester_name: course.semesters?. name || 'N/A',
    semester_start_date: course.semesters?. start_date,
    semester_end_date: course.semesters?.end_date,
    lecturer_id: course.lecturer_id,
    lecturer_name: course.lecturers ?  `${course.lecturers. first_name} ${course.lecturers.last_name}` : 'Unassigned',
    is_owned_by_current_lecturer: course.lecturer_id === lecturer.id,
  })) || [];
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect('/auth/login');
  }

  // Get lecturer record
  const { data: lecturer } = await supabase
    . from('lecturers')
    .select('id, program_id')
    .eq('user_id', user.id)
    . single();

  if (!lecturer?. program_id) {
    return redirect('/lecturer/courses? error=' + encodeURIComponent('Lecturer not found'));
  }

  const name = formData.get('name') as string;
  const credits = parseInt(formData.get('credits') as string);
  const description = formData. get('description') as string;
  const semester_id = parseInt(formData. get('semester_id') as string);
  const department_id = formData.get('department_id') as string;

  if (!name || !credits || !semester_id) {
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Missing required fields'));
  }

  const { error } = await supabase
    .from('courses')
    . insert({
      name,
      credits,
      description: description || null,
      semester_id,
      lecturer_id: lecturer.id,
      department_id: department_id ? parseInt(department_id) : null,
      program_id: lecturer.program_id,
    });

  if (error) {
    console.error('Error creating course:', error);
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Failed to create course'));
  }

  revalidatePath('/lecturer/courses');
  return redirect('/lecturer/courses? success=created');
}

export async function updateCourse(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth. getUser();
  
  if (!user) {
    return redirect('/auth/login');
  }

  // Get lecturer record
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    . single();

  if (!lecturer) {
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Lecturer not found'));
  }

  const courseId = parseInt(formData.get('courseId') as string);
  const name = formData.get('name') as string;
  const credits = parseInt(formData.get('credits') as string);
  const description = formData.get('description') as string;
  const semester_id = parseInt(formData. get('semester_id') as string);
  const department_id = formData.get('department_id') as string;

  // Verify the course belongs to this lecturer
  const { data: course } = await supabase
    .from('courses')
    . select('lecturer_id')
    .eq('id', courseId)
    . single();

  if (course?.lecturer_id !== lecturer. id) {
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Unauthorized to edit this course'));
  }

  const { error } = await supabase
    .from('courses')
    .update({
      name,
      credits,
      description: description || null,
      semester_id,
      department_id: department_id ? parseInt(department_id) : null,
    })
    .eq('id', courseId);

  if (error) {
    console.error('Error updating course:', error);
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Failed to update course'));
  }

  revalidatePath('/lecturer/courses');
  return redirect('/lecturer/courses? success=updated');
}

export async function checkCourseRegistrations(courseId: number) {
  const supabase = await createClient();
  
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('id')
    .eq('course_id', courseId);

  if (error) {
    console.error('Error checking registrations:', error);
    return 0;
  }

  return registrations?.length || 0;
}

export async function deleteCourse(courseId: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth. getUser();
  
  if (!user) {
    return redirect('/auth/login');
  }

  // Get lecturer record
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) {
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Lecturer not found'));
  }

  // Verify the course belongs to this lecturer
  const { data: course } = await supabase
    .from('courses')
    .select('lecturer_id')
    .eq('id', courseId)
    .single();

  if (course?.lecturer_id !== lecturer.id) {
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Unauthorized to delete this course'));
  }

  // First, delete all registrations for this course
  const { error: registrationsError } = await supabase
    .from('registrations')
    .delete()
    . eq('course_id', courseId);

  if (registrationsError) {
    console.error('Error deleting registrations:', registrationsError);
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Failed to delete course registrations'));
  }

  // Then delete the course
  const { error: courseError } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (courseError) {
    console.error('Error deleting course:', courseError);
    return redirect('/lecturer/courses?error=' + encodeURIComponent('Failed to delete course'));
  }

  revalidatePath('/lecturer/courses');
  return redirect('/lecturer/courses?success=deleted');
}

export async function getSemesters() {
  const supabase = await createClient();
  
  const { data: semesters } = await supabase
    . from('semesters')
    .select('id, name, start_date, end_date')
    .order('start_date', { ascending: false });

  return semesters || [];
}

export async function getDepartments() {
  const supabase = await createClient();
  
  const { data: departments } = await supabase
    .from('departments')
    . select('id, name')
    .order('name');

  return departments || [];
}

// Group Management Functions
export async function getGroupsByCourse(courseId: number) {
  const supabase = await createClient();
  
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      description,
      course_id,
      group_members(id)
    `)
    .eq('course_id', courseId)
    .order('name');

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  return groups?. map((group: any) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    course_id: group.course_id,
    member_count: group.group_members?.length || 0,
  })) || [];
}

export async function createGroup(data: { name: string; description: string; course_id: number }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth. getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Verify the course belongs to this lecturer
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) {
    throw new Error('Lecturer not found');
  }

  const { data: course } = await supabase
    .from('courses')
    .select('lecturer_id')
    .eq('id', data.course_id)
    .single();

  if (course?.lecturer_id !== lecturer. id) {
    throw new Error('Unauthorized to create group for this course');
  }

  const { error } = await supabase
    .from('groups')
    .insert({
      name: data.name,
      description: data.description || null,
      course_id: data.course_id,
    });

  if (error) {
    console.error('Error creating group:', error);
    throw new Error('Failed to create group');
  }

  revalidatePath(`/lecturer/courses/${data.course_id}/edit`);
}

export async function updateGroup(groupId: number, data: { name: string; description: string }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get lecturer info and verify ownership
  const { data: lecturer } = await supabase
    . from('lecturers')
    .select('id')
    . eq('user_id', user. id)
    .single();

  if (!lecturer) {
    throw new Error('Lecturer not found');
  }

  // Verify the group's course belongs to this lecturer
  const { data: group } = await supabase
    .from('groups')
    . select('course_id, courses(lecturer_id)')
    .eq('id', groupId)
    .single();

  if (group?.courses?.lecturer_id !== lecturer.id) {
    throw new Error('Unauthorized to edit this group');
  }

  const { error } = await supabase
    .from('groups')
    .update({
      name: data.name,
      description: data.description || null,
    })
    .eq('id', groupId);

  if (error) {
    console.error('Error updating group:', error);
    throw new Error('Failed to update group');
  }

  const courseId = group.course_id;
  revalidatePath(`/lecturer/courses/${courseId}/edit`);
}

export async function deleteGroup(groupId: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get lecturer info
  const { data: lecturer } = await supabase
    .from('lecturers')
    . select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) {
    throw new Error('Lecturer not found');
  }

  // Verify the group's course belongs to this lecturer
  const { data: group } = await supabase
    . from('groups')
    .select('course_id, courses(lecturer_id)')
    .eq('id', groupId)
    . single();

  if (group?. courses?.lecturer_id !== lecturer. id) {
    throw new Error('Unauthorized to delete this group');
  }

  const courseId = group.course_id;

  // First, delete all members in this group
  const { error: membersError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId);

  if (membersError) {
    console.error('Error deleting group members:', membersError);
    throw new Error('Failed to delete group members');
  }

  // Then delete the group
  const { error: groupError } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (groupError) {
    console.error('Error deleting group:', groupError);
    throw new Error('Failed to delete group');
  }

  revalidatePath(`/lecturer/courses/${courseId}/edit`);
}

export async function checkGroupMembers(groupId: number) {
  const supabase = await createClient();
  
  const { data: members, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId);

  if (error) {
    console.error('Error checking group members:', error);
    return 0;
  }

  return members?.length || 0;
}