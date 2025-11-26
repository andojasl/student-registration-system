import { createClient } from "../supabase/server";
import { Tables } from "../database.types";
import { unstable_noStore as noStore } from "next/cache";

export type Course = Tables<"courses">;
export type Student = Tables<"students">;
export type Group = Tables<"groups">;
export type Lecturer = Tables<"lecturers">;
export type Department = Tables<"departments">;
export type Registration = Tables<"registrations">;

export type GroupWithStudents = Group & {
  description?: string | null;
  students: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  }[];
};

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

export async function getGroups(): Promise<GroupWithStudents[]> {
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

  return (data || []) as GroupWithStudents[];
}

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

export async function getCoursesWithStudentCount() {
  noStore();
  const supabase = await createClient();

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

  const { data: registrations, error: registrationsError } = await supabase
    .from("registrations")
    .select("course_id");

  if (registrationsError) {
    console.error("Error fetching registration counts:", registrationsError);
    return courses?.map((course) => ({ ...course, student_count: 0 })) || [];
  }

  const countsByCourse =
    registrations?.reduce<Record<number, number>>((acc, registration) => {
      if (registration.course_id != null) {
        acc[registration.course_id] =
          (acc[registration.course_id] || 0) + 1;
      }
      return acc;
    }, {}) || {};

  return (
    courses?.map((course) => ({
      ...course,
      student_count: countsByCourse[course.id] || 0,
    })) || []
  );
}

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

export async function createGroup(
  name: string,
  description?: string
): Promise<Group | null> {
  const supabase = await createClient();

  const payload: { name: string; description?: string } = { name };

  if (description && description.length > 0) {
    payload.description = description;
  }

  const { data, error } = await supabase
    .from("groups")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Error creating group:", error);
    return null;
  }

  return data as Group;
}

export async function getCurrentStudent(): Promise<Student | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting current user:", userError);
    return null;
  }

  if (!user || !user.email) {
    console.error("No authenticated user");
    return null;
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("email", user.email)
    .single();

  if (studentError || !student) {
    console.error("Error finding student for user:", studentError);
    return null;
  }

  return student as Student;
}

// Get profile for current student
export async function getCurrentStudentProfile() {
  noStore();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("students")
    .select("id, user_id, first_name, last_name, email, phone, date_of_birth, avatar_url, program_id, group_id, department_id")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }

  return data;
}

// Get profile for current lecturer
export async function getCurrentLecturerProfile() {
  noStore();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("lecturers")
    .select("id, user_id, first_name, last_name, email, phone, avatar_url, program_id")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching lecturer profile:", error);
    return null;
  }

  return data;
}

// Unified profile getter
export async function getCurrentUserProfile() {
  noStore();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get role
  const { data: userData } = await supabase
    .from('user')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) return null;

  // Fetch appropriate profile based on role
  if (userData.role === 'student') {
    return getCurrentStudentProfile();
  } else {
    return getCurrentLecturerProfile();
  }
}

export async function joinGroupForCurrentStudent(
  groupId: number
): Promise<Student | null> {
  const supabase = await createClient();

  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    return null;
  }

  const { data, error: updateError } = await supabase
    .from("students")
    .update({ group_id: groupId })
    .eq("id", currentStudent.id)
    .select("*")
    .single();

  if (updateError) {
    console.error("Error joining group:", updateError);
    return null;
  }

  return data as Student;
}

export async function leaveGroupForCurrentStudent(
  groupId: number
): Promise<Student | null> {
  const supabase = await createClient();

  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    return null;
  }

  const updatePayload: Partial<Tables<"students">> = {
    group_id: null as unknown as number,
  };

  const { data, error: updateError } = await supabase
    .from("students")
    .update(updatePayload)
    .eq("id", currentStudent.id)
    .eq("group_id", groupId)
    .select("*")
    .single();

  if (updateError) {
    console.error("Error leaving group:", updateError);
    return null;
  }

  return data as Student;
}
