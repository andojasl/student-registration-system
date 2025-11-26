import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPendingEnrollments, approveEnrollment, rejectEnrollment } from "./actions";
import { CheckCircle, XCircle, Clock, BookOpen, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";

export default async function LecturerEnrollmentsPage() {
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

  const pendingEnrollments = await getPendingEnrollments();

  // Group enrollments by course
  const enrollmentsByCourse = pendingEnrollments.reduce((acc: Record<string, { course_name: string; course_credits: number; enrollments: typeof pendingEnrollments }>, enrollment: any) => {
    if (!acc[enrollment.course_id]) {
      acc[enrollment.course_id] = {
        course_name: enrollment.course_name,
        course_credits: enrollment.course_credits,
        enrollments: [],
      };
    }
    acc[enrollment.course_id].enrollments.push(enrollment);
    return acc;
  }, {} as Record<string, { course_name: string; course_credits: number; enrollments: typeof pendingEnrollments }>);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Course Enrollment Requests</h1>
          <p className="text-muted-foreground">
            Review and approve student enrollment requests for your courses
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Enrollment Requests
            </CardTitle>
            <CardDescription>
              {pendingEnrollments.length === 0 
                ? "No pending enrollment requests" 
                : `${pendingEnrollments.length} enrollment request${pendingEnrollments.length !== 1 ? 's' : ''} awaiting approval`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingEnrollments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All caught up! No pending enrollment requests at this time.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(enrollmentsByCourse).map(([courseId, courseData]: [string, any]) => (
                  <div key={courseId} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{courseData.course_name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {courseData.course_credits} Credits
                        </Badge>
                      </div>
                      <Badge variant="outline">
                        {courseData.enrollments.length} pending
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {courseData.enrollments.map((enrollment: any) => (
                        <div
                          key={enrollment.id}
                          className="p-3 border rounded-lg bg-background hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-medium">
                                {enrollment.student_first_name} {enrollment.student_last_name}
                              </h4>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>
                                  <span className="font-medium">Email:</span> {enrollment.student_email}
                                </p>
                                <p>
                                  <span className="font-medium">Program:</span> {enrollment.program_name}
                                </p>
                                <p className="text-xs">
                                  <span className="font-medium">Requested:</span>{" "}
                                  {new Date(enrollment.reg_date).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 md:flex-col">
                              <form action={approveEnrollment} className="flex-1 md:flex-none">
                                <input type="hidden" name="registrationId" value={enrollment.id} />
                                <Button
                                  type="submit"
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  size="sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                              </form>
                              <form action={rejectEnrollment} className="flex-1 md:flex-none">
                                <input type="hidden" name="registrationId" value={enrollment.id} />
                                <Button
                                  type="submit"
                                  variant="destructive"
                                  className="w-full"
                                  size="sm"
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