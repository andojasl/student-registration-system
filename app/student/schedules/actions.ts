'use server'

import { createClient } from "@/lib/supabase/server";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type StudentSchedule = {
  id: number;
  course_id: number;
  course_name: string;
  course_credits: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_id: number | null;
  room_name: string | null;
  room_building: string | null;
  lecturer_name: string;
};

type ConflictInfo = {
  hasConflict: boolean;
  conflictingSchedules: {
    course_name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[];
};

// =====================================================
// READ OPERATIONS
// =====================================================

/**
 * Get student's weekly schedule based on enrolled courses
 */
export async function getStudentWeeklySchedule() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) return [];

  // Get all schedules for student's enrolled courses
  const { data: schedules, error } = await supabase
    .from('registrations')
    .select(`
      courses!inner(
        id,
        name,
        credits,
        lecturers(first_name, last_name),
        class_schedules(
          id,
          day_of_week,
          start_time,
          end_time,
          rooms(id, name, building)
        )
      )
    `)
    .eq('student_id', student.id)
    .in('status', ['active', 'complete']);

  if (error) {
    console.error('Error fetching student schedules:', error);
    return [];
  }

  // Flatten and format the schedule data
  const formattedSchedules: StudentSchedule[] = [];

  schedules?.forEach((registration: any) => {
    const course = registration.courses;
    const lecturer = course.lecturers;
    const classSchedules = course.class_schedules || [];

    classSchedules.forEach((schedule: any) => {
      formattedSchedules.push({
        id: schedule.id,
        course_id: course.id,
        course_name: course.name,
        course_credits: course.credits,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room_id: schedule.rooms?.id || null,
        room_name: schedule.rooms?.name || null,
        room_building: schedule.rooms?.building || null,
        lecturer_name: lecturer ? `${lecturer.first_name} ${lecturer.last_name}` : 'TBA',
      });
    });
  });

  // Sort by day and time
  formattedSchedules.sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week;
    }
    return a.start_time.localeCompare(b.start_time);
  });

  return formattedSchedules;
}

/**
 * Get upcoming classes for dashboard widget
 */
export async function getUpcomingClasses(limit: number = 5) {
  const schedules = await getStudentWeeklySchedule();

  if (schedules.length === 0) return [];

  // Get current day and time
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Find upcoming classes
  const upcoming: typeof schedules = [];

  // First, check for classes today
  const todayClasses = schedules.filter(
    s => s.day_of_week === currentDay && s.start_time > currentTime
  );
  upcoming.push(...todayClasses);

  // If we need more classes, get from upcoming days
  if (upcoming.length < limit) {
    const remainingDays = schedules.filter(
      s => s.day_of_week > currentDay
    );
    upcoming.push(...remainingDays);
  }

  // If still not enough (we're near end of week), wrap to beginning
  if (upcoming.length < limit) {
    const nextWeekClasses = schedules.filter(
      s => s.day_of_week < currentDay
    );
    upcoming.push(...nextWeekClasses);
  }

  return upcoming.slice(0, limit);
}

/**
 * Get course schedule preview for course browsing
 */
export async function getCourseSchedulePreview(courseId: number) {
  const supabase = await createClient();

  const { data: schedules, error } = await supabase
    .from('class_schedules')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      rooms(name, building)
    `)
    .eq('course_id', courseId)
    .order('day_of_week')
    .order('start_time');

  if (error) {
    console.error('Error fetching course schedule preview:', error);
    return [];
  }

  return schedules || [];
}

/**
 * Check for student schedule conflicts when enrolling in a new course
 * Returns warning information (not blocking)
 */
export async function checkStudentScheduleConflicts(courseId: number): Promise<ConflictInfo> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { hasConflict: false, conflictingSchedules: [] };
  }

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return { hasConflict: false, conflictingSchedules: [] };
  }

  // Get new course schedules
  const { data: newCourseSchedules } = await supabase
    .from('class_schedules')
    .select('id, day_of_week, start_time, end_time')
    .eq('course_id', courseId);

  if (!newCourseSchedules || newCourseSchedules.length === 0) {
    return { hasConflict: false, conflictingSchedules: [] };
  }

  // Get student's current schedule
  const currentSchedules = await getStudentWeeklySchedule();

  // Check for overlaps
  const conflicts: ConflictInfo['conflictingSchedules'] = [];

  newCourseSchedules.forEach(newSchedule => {
    currentSchedules.forEach(currentSchedule => {
      // Check if same day
      if (newSchedule.day_of_week === currentSchedule.day_of_week) {
        // Check for time overlap
        const newStart = newSchedule.start_time;
        const newEnd = newSchedule.end_time;
        const currentStart = currentSchedule.start_time;
        const currentEnd = currentSchedule.end_time;

        // Time overlap logic: schedules conflict if one starts before the other ends
        const hasOverlap = (newStart < currentEnd && newEnd > currentStart);

        if (hasOverlap) {
          conflicts.push({
            course_name: currentSchedule.course_name,
            day_of_week: currentSchedule.day_of_week,
            start_time: currentSchedule.start_time,
            end_time: currentSchedule.end_time,
          });
        }
      }
    });
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictingSchedules: conflicts,
  };
}
