'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type ConflictDetails = {
  type: 'room' | 'lecturer' | 'student';
  message: string;
  schedule_id?: number;
  course_name?: string;
};

type ConflictCheckResult = {
  hasConflict: boolean;
  conflicts: ConflictDetails[];
};

// =====================================================
// READ OPERATIONS
// =====================================================

/**
 * Get all schedules for courses taught by the current lecturer
 */
export async function getSchedulesByLecturer() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get lecturer record
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) return [];

  // Get all schedules for lecturer's courses
  const { data: schedules, error } = await supabase
    .from('class_schedules')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      created_at,
      courses!inner(
        id,
        name,
        credits,
        lecturer_id,
        semesters(id, name, start_date, end_date)
      ),
      rooms(id, name, building, capacity, room_type),
      semesters(id, name)
    `)
    .eq('courses.lecturer_id', lecturer.id)
    .order('day_of_week')
    .order('start_time');

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }

  return (schedules || []).map((schedule: any) => ({
    id: schedule.id,
    course_id: schedule.courses.id,
    course_name: schedule.courses.name,
    course_credits: schedule.courses.credits,
    day_of_week: schedule.day_of_week,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    room_id: schedule.rooms?.id,
    room_name: schedule.rooms?.name,
    room_building: schedule.rooms?.building,
    room_capacity: schedule.rooms?.capacity,
    semester_id: schedule.semesters?.id,
    semester_name: schedule.semesters?.name,
    created_at: schedule.created_at,
  }));
}

/**
 * Get all schedules for a specific course
 */
export async function getSchedulesByCourse(courseId: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify course ownership
  const { data: course } = await supabase
    .from('courses')
    .select('lecturer_id, lecturers!inner(user_id)')
    .eq('id', courseId)
    .single();

  if (!course || (course.lecturers as any).user_id !== user.id) {
    return [];
  }

  const { data: schedules, error } = await supabase
    .from('class_schedules')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      rooms(id, name, building, capacity)
    `)
    .eq('course_id', courseId)
    .order('day_of_week')
    .order('start_time');

  if (error) {
    console.error('Error fetching course schedules:', error);
    return [];
  }

  return schedules || [];
}

/**
 * Get weekly schedule formatted for calendar display
 */
export async function getLecturerWeeklySchedule() {
  const schedules = await getSchedulesByLecturer();

  // Group by day of week
  const weeklySchedule: { [key: number]: typeof schedules } = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
  };

  schedules.forEach(schedule => {
    weeklySchedule[schedule.day_of_week].push(schedule);
  });

  return weeklySchedule;
}

/**
 * Get all available rooms
 */
export async function getRooms() {
  const supabase = await createClient();

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('id, name, building, capacity, room_type')
    .order('building')
    .order('name');

  if (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }

  return rooms || [];
}

/**
 * Get all time slots (optional helper)
 */
export async function getTimeSlots() {
  const supabase = await createClient();

  const { data: timeSlots, error } = await supabase
    .from('time_slots')
    .select('id, start_time, end_time, label')
    .order('start_time');

  if (error) {
    console.error('Error fetching time slots:', error);
    return [];
  }

  return timeSlots || [];
}

/**
 * Get lecturer's courses for schedule creation
 */
export async function getLecturerCourses() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) return [];

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, name, credits, semesters(id, name)')
    .eq('lecturer_id', lecturer.id)
    .order('name');

  if (error) {
    console.error('Error fetching lecturer courses:', error);
    return [];
  }

  return courses || [];
}

/**
 * Get a single schedule by ID
 */
export async function getScheduleById(scheduleId: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: schedule, error } = await supabase
    .from('class_schedules')
    .select(`
      id,
      course_id,
      room_id,
      day_of_week,
      start_time,
      end_time,
      semester_id,
      courses!inner(
        id,
        name,
        lecturer_id,
        lecturers!inner(user_id)
      ),
      rooms(id, name),
      semesters(id, name)
    `)
    .eq('id', scheduleId)
    .single();

  if (error || !schedule) {
    console.error('Error fetching schedule:', error);
    return null;
  }

  // Verify ownership
  if ((schedule.courses.lecturers as any).user_id !== user.id) {
    return null;
  }

  return schedule;
}

// =====================================================
// CONFLICT DETECTION
// =====================================================

/**
 * Check for scheduling conflicts
 * Returns detailed conflict information for room, lecturer, and student conflicts
 */
export async function checkScheduleConflicts(
  courseId: number,
  roomId: number | null,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeScheduleId?: number
): Promise<ConflictCheckResult> {
  const supabase = await createClient();
  const conflicts: ConflictDetails[] = [];

  // 1. Room Conflict Check
  if (roomId) {
    const { data: roomConflicts } = await supabase
      .from('class_schedules')
      .select('id, courses(name)')
      .eq('room_id', roomId)
      .eq('day_of_week', dayOfWeek)
      .gte('end_time', startTime)
      .lte('start_time', endTime)
      .neq('id', excludeScheduleId || 0);

    if (roomConflicts && roomConflicts.length > 0) {
      conflicts.push({
        type: 'room',
        message: `Room is occupied by ${(roomConflicts[0].courses as any)?.name || 'another course'} at this time`,
        schedule_id: roomConflicts[0].id,
        course_name: (roomConflicts[0].courses as any)?.name
      });
    }
  }

  // 2. Lecturer Conflict Check
  const { data: course } = await supabase
    .from('courses')
    .select('lecturer_id')
    .eq('id', courseId)
    .single();

  if (course?.lecturer_id) {
    const { data: lecturerConflicts } = await supabase
      .from('class_schedules')
      .select(`
        id,
        courses!inner(name, lecturer_id)
      `)
      .eq('courses.lecturer_id', course.lecturer_id)
      .eq('day_of_week', dayOfWeek)
      .gte('end_time', startTime)
      .lte('start_time', endTime)
      .neq('id', excludeScheduleId || 0)
      .neq('course_id', courseId);

    if (lecturerConflicts && lecturerConflicts.length > 0) {
      conflicts.push({
        type: 'lecturer',
        message: `You have another class scheduled at this time (${(lecturerConflicts[0].courses as any)?.name})`,
        schedule_id: lecturerConflicts[0].id,
        course_name: (lecturerConflicts[0].courses as any)?.name
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

// =====================================================
// CREATE/UPDATE/DELETE OPERATIONS
// =====================================================

/**
 * Create a new class schedule
 */
export async function createSchedule(formData: FormData) {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login');

  // 2. Get lecturer record
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) {
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Lecturer not found'));
  }

  // 3. Extract form data
  const courseId = parseInt(formData.get('course_id') as string);
  const roomId = formData.get('room_id') ? parseInt(formData.get('room_id') as string) : null;
  const dayOfWeek = parseInt(formData.get('day_of_week') as string);
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const semesterId = formData.get('semester_id') ? parseInt(formData.get('semester_id') as string) : null;

  // 4. Validate required fields
  if (!courseId || !dayOfWeek || !startTime || !endTime) {
    return redirect('/lecturer/schedules/new?error=' + encodeURIComponent('Missing required fields'));
  }

  // 5. Validate ownership
  const { data: course } = await supabase
    .from('courses')
    .select('lecturer_id')
    .eq('id', courseId)
    .single();

  if (course?.lecturer_id !== lecturer.id) {
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Unauthorized to create schedule for this course'));
  }

  // 6. Check conflicts
  const conflictCheck = await checkScheduleConflicts(
    courseId,
    roomId,
    dayOfWeek,
    startTime,
    endTime
  );

  if (conflictCheck.hasConflict) {
    const errorMsg = conflictCheck.conflicts.map(c => c.message).join('; ');
    return redirect('/lecturer/schedules/new?error=' + encodeURIComponent(errorMsg));
  }

  // 7. Insert
  const { error } = await supabase
    .from('class_schedules')
    .insert({
      course_id: courseId,
      room_id: roomId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      semester_id: semesterId,
    });

  if (error) {
    console.error('Error creating schedule:', error);
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Failed to create schedule'));
  }

  // 8. Revalidate & redirect
  revalidatePath('/lecturer/schedules');
  return redirect('/lecturer/schedules?success=created');
}

/**
 * Update an existing schedule
 */
export async function updateSchedule(formData: FormData) {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login');

  // 2. Get lecturer record
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) {
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Lecturer not found'));
  }

  // 3. Extract form data
  const scheduleId = parseInt(formData.get('schedule_id') as string);
  const courseId = parseInt(formData.get('course_id') as string);
  const roomId = formData.get('room_id') ? parseInt(formData.get('room_id') as string) : null;
  const dayOfWeek = parseInt(formData.get('day_of_week') as string);
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const semesterId = formData.get('semester_id') ? parseInt(formData.get('semester_id') as string) : null;

  // 4. Validate required fields
  if (!scheduleId || !courseId || !dayOfWeek || !startTime || !endTime) {
    return redirect(`/lecturer/schedules/${scheduleId}/edit?error=` + encodeURIComponent('Missing required fields'));
  }

  // 5. Validate ownership
  const { data: course } = await supabase
    .from('courses')
    .select('lecturer_id')
    .eq('id', courseId)
    .single();

  if (course?.lecturer_id !== lecturer.id) {
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Unauthorized'));
  }

  // 6. Check conflicts (excluding current schedule)
  const conflictCheck = await checkScheduleConflicts(
    courseId,
    roomId,
    dayOfWeek,
    startTime,
    endTime,
    scheduleId
  );

  if (conflictCheck.hasConflict) {
    const errorMsg = conflictCheck.conflicts.map(c => c.message).join('; ');
    return redirect(`/lecturer/schedules/${scheduleId}/edit?error=` + encodeURIComponent(errorMsg));
  }

  // 7. Update
  const { error } = await supabase
    .from('class_schedules')
    .update({
      course_id: courseId,
      room_id: roomId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      semester_id: semesterId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId);

  if (error) {
    console.error('Error updating schedule:', error);
    return redirect(`/lecturer/schedules/${scheduleId}/edit?error=` + encodeURIComponent('Failed to update schedule'));
  }

  // 8. Revalidate & redirect
  revalidatePath('/lecturer/schedules');
  return redirect('/lecturer/schedules?success=updated');
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: number) {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login');

  // 2. Get lecturer record
  const { data: lecturer } = await supabase
    .from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!lecturer) {
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Lecturer not found'));
  }

  // 3. Verify ownership
  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('id, courses!inner(lecturer_id)')
    .eq('id', scheduleId)
    .single();

  if (!schedule || (schedule.courses as any)?.lecturer_id !== lecturer.id) {
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Unauthorized'));
  }

  // 4. Delete
  const { error } = await supabase
    .from('class_schedules')
    .delete()
    .eq('id', scheduleId);

  if (error) {
    console.error('Error deleting schedule:', error);
    return redirect('/lecturer/schedules?error=' + encodeURIComponent('Failed to delete schedule'));
  }

  // 5. Revalidate & redirect
  revalidatePath('/lecturer/schedules');
  return redirect('/lecturer/schedules?success=deleted');
}
