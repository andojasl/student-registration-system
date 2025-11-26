import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, CheckCircle, ArrowLeft, Clock, Building2 } from "lucide-react";
import { getAvailableCoursesForStudent, requestCourseEnrollment } from "../actions";
import Link from "next/link";

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

export default function BrowseCoursesPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/student/courses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Courses
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Browse Courses</h1>
        <p className="text-muted-foreground mt-2">
          Explore and request enrollment in available courses for your program
        </p>
      </div>

      <Suspense fallback={<CoursesFallback />}>
        <BrowseCoursesContent />
      </Suspense>
    </div>
  );
}

async function BrowseCoursesContent() {
  const courses = await getAvailableCoursesForStudent();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => (
          <Card key={course.id} className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-4">
              <div className={`h-2 w-full rounded-t-lg ${courseColors[index % courseColors.length]} -mt-6 -mx-6 mb-4`} />
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {course.credits} Credits
                    </Badge>
                    {course.is_registered && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{course.lecturer_name}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{course.department_name || "N/A"}</span>
                </div>
                {course.semester_name && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{course.semester_name}</span>
                  </div>
                )}
                {course.semester_start && course.semester_end && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">
                      {new Date(course.semester_start).toLocaleDateString()} - {new Date(course.semester_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {course.description}
                </p>
              </div>

              <form action={requestCourseEnrollment}>
                <input type="hidden" name="courseId" value={course.id} />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={course.is_registered}
                  variant={course.is_registered ? "secondary" : "default"}
                >
                  {course.is_registered ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Already Enrolled
                    </>
                  ) : (
                    "Request Enrollment"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No courses available for your program at this time.
            </p>
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
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}