import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPendingStudents, approveStudent, rejectStudent } from "./actions";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";

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

  const pendingStudents = await getPendingStudents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lecturer Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve student registrations for your program
          </p>
        </div>

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
                {pendingStudents.map((student) => (
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