import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteCourse, checkCourseRegistrations } from "../../actions";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DeleteCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();

  if (!user || user.role !== 'lecturer') {
    redirect('/auth/login');
  }

  if (!user.is_active) {
    redirect('/lecturer/courses');
  }

  const supabase = await createClient();
  const courseId = parseInt(id);

  // Get lecturer info
  const { data: lecturer } = await supabase
    . from('lecturers')
    .select('id')
    .eq('user_id', user.id)
    . single();

  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('id, name, credits, lecturer_id')
    .eq('id', courseId)
    .single();

  if (!course || course.lecturer_id !== lecturer?. id) {
    redirect('/lecturer/courses? error=' + encodeURIComponent('Course not found or unauthorized'));
  }

  // Check for existing registrations
  const registrationCount = await checkCourseRegistrations(courseId);

  async function handleDelete() {
    'use server';
    await deleteCourse(courseId);
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/lecturer/courses">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Course
            </CardTitle>
            <CardDescription>
              This action cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="font-semibold mb-2">Are you sure you want to delete this course?</p>
              <div className="bg-background rounded p-3 space-y-2">
                <p>
                  <span className="font-medium">Course Name:</span> {course.name}
                </p>
                <p>
                  <span className="font-medium">Credits:</span> {course.credits}
                </p>
              </div>
            </div>

            {registrationCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <span className="font-semibold">Warning:</span> This course has <span className="font-semibold">{registrationCount}</span> student registration{registrationCount !== 1 ? 's' : ''} associated with it.  Deleting this course will also remove all these registrations.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {registrationCount > 0 
                ? 'All associated student registrations will be permanently deleted along with this course.'
                : 'This course has no active registrations.'
              }
            </p>

            <div className="flex gap-3 pt-4">
              <form action={handleDelete} className="flex-1">
                <button
                  type="submit"
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                >
                  Delete Course
                </button>
              </form>
              <Link href="/lecturer/courses" className="flex-1">
                <button
                  type="button"
                  className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}