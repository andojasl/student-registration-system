import { createClient } from "../supabase/server";
import { Tables } from "../database.types";
import { unstable_noStore as noStore } from "next/cache";

export type Course = Tables<"courses">;
export type Student = Tables<"students">;
export type Group = Tables<"groups">;
export type Lecturer = Tables<"lecturers">;
export type Department = Tables<"departments">;
export type Registration = Tables<"registrations">;

/**
 * Get all courses with their related lecturer and department information
 */
export async function getCourses() {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      lecturers (
        id,
        first_name,
        last_name,
        email
      ),
      departments (
        id,
        name
      ),
      semesters (
        id,
        name
      )
    `)
    .order("name");

  if (error) {
    console.error("Error fetching courses:", error);
    return [];
  }

  return data;
}

/**
 * Get a single course by ID with all related information
 */
export async function getCourseById(courseId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      lecturers (
        id,
        first_name,
        last_name,
        email
      ),
      departments (
        id,
        name
      ),
      semesters (
        id,
        name,
        start_date,
        end_date
      )
    `)
    .eq("id", courseId)
    .single();

  if (error) {
    console.error("Error fetching course:", error);
    return null;
  }

  return data;
}

/**
 * Get all groups with their students
 */
export async function getGroups() {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      students (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .order("name");

  if (error) {
    console.error("Error fetching groups:", error);
    return [];
  }

  return data;
}

/**
 * Get all students in a specific group
 */
export async function getStudentsByGroup(groupId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      departments (
        id,
        name
      ),
      programs (
        id,
        name,
        degree_type
      )
    `)
    .eq("group_id", groupId)
    .order("last_name");

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return data;
}

/**
 * Get all registrations for a student
 */
export async function getStudentRegistrations(studentId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .select(`
      *,
      courses (
        id,
        name,
        credits,
        lecturers (
          first_name,
          last_name
        )
      )
    `)
    .eq("student_id", studentId)
    .order("reg_date", { ascending: false });

  if (error) {
    console.error("Error fetching registrations:", error);
    return [];
  }

  return data;
}

/**
 * Get all students enrolled in a course
 */
export async function getCourseEnrollments(courseId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .select(`
      *,
      students (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("course_id", courseId)
    .order("reg_date");

  if (error) {
    console.error("Error fetching enrollments:", error);
    return [];
  }

  return data;
}

/**
 * Get count of students enrolled in each course
 */
export async function getCoursesWithStudentCount() {
  noStore();
  const supabase = await createClient();

  // First get all courses
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select(`
      *,
      lecturers (
        id,
        first_name,
        last_name
      ),
      departments (
        id,
        name
      )
    `)
    .order("name");

  if (coursesError) {
    console.error("Error fetching courses:", coursesError);
    return [];
  }

  // Get all registrations and count them per course locally.
  const { data: registrations, error: registrationsError } = await supabase
    .from("registrations")
    .select("course_id");

  if (registrationsError) {
    console.error("Error fetching registration counts:", registrationsError);
    return courses?.map((course) => ({ ...course, student_count: 0 })) || [];
  }

  const countsByCourse = registrations?.reduce<Record<number, number>>((acc, registration) => {
    if (registration.course_id != null) {
      acc[registration.course_id] = (acc[registration.course_id] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  // Combine the data
  return (
    courses?.map((course) => ({
      ...course,
      student_count: countsByCourse[course.id] || 0,
    })) || []
  );
}

/**
 * Get all departments
 */
export async function getDepartments() {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching departments:", error);
    return [];
  }

  return data;
}

/**
 * Get all lecturers
 */
export async function getLecturers() {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lecturers")
    .select("*")
    .order("last_name");

  if (error) {
    console.error("Error fetching lecturers:", error);
    return [];
  }

  return data;
}
