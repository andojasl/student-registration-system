"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getStudentRegisteredCourses() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return [];
  }

  const { data: registrations, error } = (await supabase
    .from("registrations")
    .select(
      `
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
    `
    )
    .eq("student_id", student.id)
    .order("reg_date", { ascending: false })) as any;

  if (error || !registrations) {
    console.error("Error fetching student registrations:", error);
    return [];
  }

  return registrations.map((reg: any) => ({
    id: reg.id,
    course_id: reg.courses.id,
    reg_date: reg.reg_date,
    grade: reg.grade,
    status: reg.status as "pending" | "active" | "complete",
    course_name: reg.courses.name,
    credits: reg.courses.credits,
    description: reg.courses.description,
    semester_name: reg.courses.semesters?.name,
    lecturer_name: reg.courses.lecturers
      ? `${reg.courses.lecturers.first_name} ${reg.courses.lecturers.last_name}`
      : "N/A",
    department_name: reg.courses.departments?.name,
  }));
}

export async function getAvailableCoursesForStudent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, program_id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return [];
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      `
      id,
      name,
      credits,
      description,
      semesters(id, name, start_date, end_date),
      lecturers(first_name, last_name),
      departments(name)
    `
    )
    .eq("program_id", student.program_id)
    .order("name");

  if (error || !courses) {
    console.error("Error fetching available courses:", error);
    return [];
  }

  const nowIso = new Date().toISOString();

  const filteredCourses = courses.filter(
    (course: any) => course.semesters?.end_date > nowIso
  );

  const { data: existingRegistrations } = (await supabase
    .from("registrations")
    .select("course_id, status")
    .eq("student_id", student.id)) as any;

  const registeredCourseIds = new Set(
    (existingRegistrations || []).map((reg: any) => reg.course_id)
  );

  return filteredCourses.map((course: any) => ({
    id: course.id,
    name: course.name,
    credits: course.credits,
    description: course.description,
    semester_name: course.semesters?.name,
    semester_start: course.semesters?.start_date,
    semester_end: course.semesters?.end_date,
    lecturer_name: course.lecturers
      ? `${course.lecturers.first_name} ${course.lecturers.last_name}`
      : "N/A",
    department_name: course.departments?.name,
    is_registered: registeredCourseIds.has(course.id),
  }));
}

export async function requestCourseEnrollment(formData: FormData) {
  const supabase = await createClient();
  const courseId = parseInt(formData.get("courseId") as string);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(
      "/student/courses/browse?error=" + encodeURIComponent("Not authenticated")
    );
  }

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return redirect(
      "/student/courses/browse?error=" + encodeURIComponent("student_not_found")
    );
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(
      `
      id,
      semesters(end_date)
    `
    )
    .eq("id", courseId)
    .single();

  if (courseError || !course?.semesters?.end_date) {
    return redirect(
      "/student/courses/browse?error=" + encodeURIComponent("invalid_course")
    );
  }

  const semesterEnd = new Date(course.semesters.end_date);
  const now = new Date();

  if (now > semesterEnd) {
    return redirect(
      "/student/courses/browse?error=" +
        encodeURIComponent("Course is no longer available")
    );
  }

  const { data: existingReg } = await supabase
    .from("registrations")
    .select("id")
    .eq("student_id", student.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingReg) {
    return redirect(
      "/student/courses/browse?error=" +
        encodeURIComponent("Already registered for this course")
    );
  }

  const { error } = await supabase.from("registrations").insert({
    student_id: student.id,
    course_id: courseId,
    status: "pending",
    reg_date: new Date().toISOString(),
  } as any);

  if (error) {
    console.error("Error creating registration:", error);
    return redirect(
      "/student/courses/browse?error=" +
        encodeURIComponent("Failed to request enrollment")
    );
  }

  revalidatePath("/student/courses");
  revalidatePath("/student/courses/browse");
  return redirect(
    "/student/courses/browse?success=" + encodeURIComponent("requested")
  );
}

export async function getStudentCourseDetails(courseId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) return null;

  const { data: registration } = await supabase
    .from("registrations")
    .select("id")
    .eq("student_id", student.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!registration) return null;

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      `
      id,
      name,
      credits,
      description,
      program_id,
      lecturer_id,
      semesters(id, name, start_date, end_date),
      lecturers(id, first_name, last_name, email),
      departments(id, name)
    `
    )
    .eq("id", courseId)
    .single();

  if (error) {
    console.error("Error fetching course details:", error);
    return null;
  }

  return course;
}

export async function getCourseGroups(courseId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: student } = await supabase
    .from("students")
    .select("id, group_id")
    .eq("user_id", user.id)
    .single();

  if (!student) return [];

  const { data: groups, error } = await supabase
    .from("groups")
    .select(
      `
      id,
      name,
      description,
      course_id,
      students(id, first_name, last_name, email)
    `
    )
    .eq("course_id", courseId)
    .order("name");

  if (error) {
    console.error("Error fetching course groups:", error);
    return [];
  }

  return (groups || []).map((group: any) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    course_id: group.course_id,
    students: group.students || [],
    is_member: student?.group_id === group.id,
    member_count: group.students?.length || 0,
  }));
}

export async function joinCourseGroup(formData: FormData) {
  const groupId = parseInt(formData.get("groupId") as string);
  const courseId = formData.get("courseId") as string;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(
      "/student/courses?error=" + encodeURIComponent("Not authenticated")
    );
  }

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return redirect(
      "/student/courses?error=" + encodeURIComponent("Student not found")
    );
  }

  const { error } = await supabase
    .from("students")
    .update({ group_id: groupId })
    .eq("id", student.id);

  if (error) {
    console.error("Error joining group:", error);
    return redirect(
      "/student/courses?error=" + encodeURIComponent("Failed to join group")
    );
  }

  revalidatePath(`/student/courses/${courseId}/groups`);
  return redirect(
    `/student/courses/${courseId}/groups?success=` + encodeURIComponent("group_joined")
  );
}

export async function leaveCourseGroup(formData: FormData) {
  const groupId = parseInt(formData.get("groupId") as string);
  const courseId = formData.get("courseId") as string;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(
      "/student/courses?error=" + encodeURIComponent("Not authenticated")
    );
  }

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return redirect(
      "/student/courses?error=" + encodeURIComponent("Student not found")
    );
  }

  const { error } = await supabase
    .from("students")
    .update({ group_id: null })
    .eq("id", student.id)
    .eq("group_id", groupId);

  if (error) {
    console.error("Error leaving group:", error);
    return redirect(
      "/student/courses?error=" + encodeURIComponent("Failed to leave group")
    );
  }

  revalidatePath(`/student/courses/${courseId}/groups`);
  return redirect(
    `/student/courses/${courseId}/groups?success=` + encodeURIComponent("group_left")
  );
}
