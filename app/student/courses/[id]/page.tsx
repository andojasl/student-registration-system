import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  User,
  Building2,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { getStudentCourseDetails } from "@/app/student/courses/actions";
import { notFound } from "next/navigation";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = parseInt(id);
  const course = await getStudentCourseDetails(courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/student/courses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </Link>

        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {course.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              Course Details & Groups
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-base px-3 py-1">
              {course.credits} Credits
            </Badge>
            {course.semesters && (
              <Badge variant="outline" className="text-base px-3 py-1">
                {course.semesters.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Course Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.description || "No description available"}
              </p>
            </div>

            <div className="space-y-4">
              {course.lecturers && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">Lecturer</span>
                  </div>
                  <p className="text-sm ml-6">
                    {course.lecturers.first_name} {course.lecturers.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground ml-6">
                    {course.lecturers.email}
                  </p>
                </div>
              )}

              {course.departments && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">Department</span>
                  </div>
                  <p className="text-sm ml-6">{course.departments.name}</p>
                </div>
              )}

              {course.semesters && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">Semester Dates</span>
                  </div>
                  <p className="text-sm ml-6">
                    {new Date(course.semesters.start_date).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(course.semesters.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Groups Card */}
        <Card className="md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Study Groups
            </CardTitle>
            <CardDescription>
              Join or view study groups for this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/student/courses/${courseId}/groups`}>
              <Button className="w-full" size="lg">
                <Users className="mr-2 h-4 w-4" />
                View Groups
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
