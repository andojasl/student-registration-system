import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCoursesByLecturer } from "./actions";
import { Edit2, Trash2, Plus, GraduationCap, Filter } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import Link from "next/link";

type CoursesView = "all" | "mine";

export default async function LecturerCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUser();

  // Check if user is a lecturer
  if (!user || user.role !== 'lecturer') {
    redirect('/auth/login');
  }

  if (!user.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Account Inactive</CardTitle>
            <CardDescription>
              Your lecturer account is not yet activated. Please contact an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const courses = await getCoursesByLecturer();
  const resolvedSearchParams = await searchParams;

  const viewParam = resolvedSearchParams?.view;
  const normalizedView =
    typeof viewParam === "string" && viewParam.toLowerCase() === "mine"
      ? "mine"
      : "all";
  const view: CoursesView = normalizedView;
  const filteredCourses =
    view === "mine"
      ? courses.filter((course: any) => course.is_owned_by_current_lecturer)
      : courses;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="rounded-2xl border bg-gradient-to-b from-card/80 to-card/40 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Lecturer
          </p>
          <h1 className="text-3xl font-bold leading-tight mb-3">Course Management</h1>
          <p className="text-muted-foreground mb-6">
            Filter by ownership or add new courses to your program.
          </p>
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border bg-card/70 p-1 shadow-inner">
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                View
              </div>
              <div className="flex rounded-md overflow-hidden border border-border/60">
                <Link
                  href="/lecturer/courses?view=all"
                  className={`px-4 py-2 text-xs font-semibold transition-colors ${
                    view === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  All program courses
                </Link>
                <Link
                  href="/lecturer/courses?view=mine"
                  className={`px-4 py-2 text-xs font-semibold transition-colors ${
                    view === "mine"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  My courses
                </Link>
              </div>
            </div>
            <Link href="/lecturer/courses/new" className="w-full">
              <Button className="w-full justify-center gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Create New Course
              </Button>
            </Link>
          </div>
        </div>

        <Card className="rounded-2xl border bg-card/90 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              {view === "mine" ? "My Courses" : "Program Courses"}
            </CardTitle>
            <CardDescription>
              {filteredCourses.length === 0
                ? "No courses found for this view"
                : `${filteredCourses.length} course${filteredCourses.length !== 1 ? "s" : ""} ${
                    view === "mine" ? "you teach" : "in your program"
                  }`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">
                  {view === "mine"
                    ? "You are not assigned to any courses yet."
                    : "No courses created yet. Get started by creating your first course."}
                </p>
                {view === "mine" ? (
                  <Link href="/lecturer/courses?view=all" className="inline-block">
                    <Button variant="outline">View all program courses</Button>
                  </Link>
                ) : (
                  <Link href="/lecturer/courses/new">
                    <Button>Create First Course</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCourses.map((course: any) => (
                  <div
                    key={course.id}
                    className="rounded-xl border bg-card/80 p-4 hover:border-primary/50 hover:shadow-md transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{course.name}</h3>
                          <Badge variant="outline">{course.credits} credits</Badge>
                          <Badge variant="secondary">{course.semester_name}</Badge>
                          {!course.is_owned_by_current_lecturer && (
                            <Badge variant="outline">Program course</Badge>
                          )}
                        </div>

                        {course.description && (
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {course.semester_start_date && course.semester_end_date && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                              Duration:{" "}
                              {new Date(course.semester_start_date).toLocaleDateString()} –{" "}
                              {new Date(course.semester_end_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            Lecturer: {course.lecturer_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 md:flex-col md:min-w-[140px]">
                        <Link href={`/lecturer/courses/${course.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/lecturer/courses/${course.id}/delete`} className="flex-1">
                          <Button variant="destructive" size="sm" className="w-full">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
