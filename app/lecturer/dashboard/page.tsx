import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPendingStudents, approveStudent, rejectStudent, getLecturerCoursesOverview } from "./actions";
import { CheckCircle, XCircle, Clock, User, Users, BookOpen, Layers, BarChart3, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import Link from "next/link";

export default async function LecturerDashboardPage() {
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

  const [pendingStudents, lecturerCourses] = await Promise.all([
    getPendingStudents(),
    getLecturerCoursesOverview(),
  ]);

  const totalEnrollments = lecturerCourses.reduce(
    (sum: number, course: any) => sum + (course.enrollment_count || 0),
    0
  );
  const totalGroups = lecturerCourses.reduce(
    (sum: number, course: any) => sum + (course.group_count || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lecturer Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve student registrations for your program
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Courses you teach
              </div>
              <p className="text-2xl font-semibold">{lecturerCourses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total enrollments
              </div>
              <p className="text-2xl font-semibold">{totalEnrollments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                Study groups
              </div>
              <p className="text-2xl font-semibold">{totalGroups}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Pending approvals
              </div>
              <p className="text-2xl font-semibold">{pendingStudents.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Overview of the courses you are teaching.</CardDescription>
            </div>
            <Link href="/lecturer/courses">
              <Button variant="outline" size="sm" className="gap-2">
                Manage courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lecturerCourses.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-60" />
                <p>You are not assigned to any courses yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {lecturerCourses.map((course: any) => (
                  <div key={course.id} className="rounded-lg border p-4 bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{course.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description || "No description provided"}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <BookOpen className="h-3 w-3" />
                            {course.semester_name}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <BarChart3 className="h-3 w-3" />
                            {course.credits || 0} credits
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <Layers className="h-3 w-3" />
                            {course.department_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 justify-end">
                          <Users className="h-3 w-3" />
                          <span className="font-medium text-foreground">
                            {course.enrollment_count}
                          </span>
                          <span>enrolled</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Layers className="h-3 w-3" />
                          <span className="font-medium text-foreground">
                            {course.group_count}
                          </span>
                          <span>groups</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Student Approvals
            </CardTitle>
            <CardDescription>
              {pendingStudents.length === 0 
                ? "No pending student registrations" 
                : `${pendingStudents.length} student${pendingStudents.length !== 1 ? 's' : ''} awaiting approval`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All caught up! No pending approvals at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-lg">
                          {student.first_name} {student.last_name}
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">Email:</span> {student.email}
                          </p>
                          <p>
                            <span className="font-medium">Phone:</span> {student.phone}
                          </p>
                          <p>
                            <span className="font-medium">Date of Birth:</span>{" "}
                            {new Date(student.date_of_birth).toLocaleDateString()}
                          </p>
                          <p>
                            <span className="font-medium">Program:</span> {student.program_name}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Registered:</span>{" "}
                            {new Date(student.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 md:flex-col">
                        <form action={approveStudent} className="flex-1 md:flex-none">
                          <input type="hidden" name="studentId" value={student.id} />
                          <input type="hidden" name="userId" value={student.user_id} />
                          <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </form>
                        <form action={rejectStudent} className="flex-1 md:flex-none">
                          <input type="hidden" name="studentId" value={student.id} />
                          <input type="hidden" name="userId" value={student.user_id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            className="w-full"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </form>
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
