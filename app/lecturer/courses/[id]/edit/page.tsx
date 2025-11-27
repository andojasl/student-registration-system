import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateCourse, getSemesters, getDepartments, getGroupsByCourse } from "../../actions";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GroupsManagement } from "@/components/groups-management";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
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
    .single();

  // Get course details
  const { data: course } = await supabase
    . from('courses')
    .select('id, name, credits, description, semester_id, department_id, lecturer_id')
    .eq('id', courseId)
    . single();

  if (!course || course.lecturer_id !== lecturer?. id) {
    redirect('/lecturer/courses? error=' + encodeURIComponent('Course not found or unauthorized'));
  }

  const semesters = await getSemesters();
  const departments = await getDepartments();
  const groups = await getGroupsByCourse(courseId);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/lecturer/courses">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Course</CardTitle>
            <CardDescription>
              Update course information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCourse} className="space-y-6">
              <input type="hidden" name="courseId" value={courseId} />

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Course Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Data Structures"
                  defaultValue={course. name}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="credits" className="block text-sm font-medium">
                    Credits *
                  </label>
                  <input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    max="6"
                    defaultValue={course.credits}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="semester_id" className="block text-sm font-medium">
                    Semester *
                  </label>
                  <select
                    id="semester_id"
                    name="semester_id"
                    defaultValue={course.semester_id?. toString()}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Select semester</option>
                    {semesters.map((semester: any) => (
                      <option key={semester.id} value={semester.id. toString()}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="department_id" className="block text-sm font-medium">
                  Department (Optional)
                </label>
                <select
                  id="department_id"
                  name="department_id"
                  defaultValue={course.department_id?.toString() || ""}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Course description"
                  rows={4}
                  defaultValue={course.description || ''}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                >
                  Save Changes
                </button>
                <Link href="/lecturer/courses" className="flex-1">
                  <button
                    type="button"
                    className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                  >
                    Cancel
                  </button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Groups Management Card */}
        <GroupsManagement courseId={courseId} initialGroups={groups} />
      </div>
    </div>
  );
}