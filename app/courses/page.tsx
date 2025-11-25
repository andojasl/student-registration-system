import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen } from "lucide-react";
import { getCoursesWithStudentCount } from "@/lib/db/queries";

const courseColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-amber-500",
];

export default function CoursesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-2">
          Manage and view all your enrolled courses
        </p>
      </div>

      <Suspense fallback={<CoursesFallback />}>
        <CoursesContent />
      </Suspense>
    </div>
  );
}

async function CoursesContent() {
  const courses = await getCoursesWithStudentCount();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => (
          <Card key={course.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
            <CardHeader className="pb-4">
              <div className={`h-2 w-full rounded-t-lg ${courseColors[index % courseColors.length]} -mt-6 -mx-6 mb-4`} />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {course.credits} Credits
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {course.lecturers?.first_name} {course.lecturers?.last_name}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {course.departments?.name || "N/A"}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  {course.student_count || 0} students
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No courses found. Contact your administrator to enroll in courses.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function CoursesFallback() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 py-6">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
