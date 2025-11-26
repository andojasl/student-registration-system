import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCoursesByLecturer } from "./actions";
import { Edit2, Trash2, Plus, GraduationCap } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import Link from "next/link";

export default async function LecturerCoursesPage() {
  const user = await getUser();

  // Check if user is a lecturer
  if (!user || user.role !== 'lecturer') {
    redirect('/auth/login');
  }

  if (!user. is_active) {
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Course Management</h1>
            <p className="text-muted-foreground">
              Manage courses in your program
            </p>
          </div>
          <Link href="/lecturer/courses/new">
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Your Courses
            </CardTitle>
            <CardDescription>
              {courses.length === 0 
                ? "No courses yet" 
                : `${courses.length} course${courses.length !== 1 ? 's' : ''} in your program`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ?  (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No courses created yet.  Get started by creating your first course. </p>
                <Link href="/lecturer/courses/new">
                  <Button>Create First Course</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {course.name}
                          </h3>
                          <Badge variant="outline">
                            {course.credits} credits
                          </Badge>
                          <Badge variant="secondary">
                            {course.semester_name}
                          </Badge>
                        </div>
                        
                        {course.description && (
                          <p className="text-sm text-muted-foreground">
                            {course.description}
                          </p>
                        )}
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          {course.semester_start_date && course.semester_end_date && (
                            <p>
                              <span className="font-medium">Duration:</span>{" "}
                              {new Date(course.semester_start_date).toLocaleDateString()} -{" "}
                              {new Date(course.semester_end_date).toLocaleDateString()}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Lecturer:</span> {course.lecturer_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/lecturer/courses/${course.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/lecturer/courses/${course.id}/delete`}>
                          <Button variant="destructive" size="sm">
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