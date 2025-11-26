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
  Calendar,
  Users,
  BookOpen,
  Plus,
  CheckCircle,
  Clock,
  GraduationCap,
} from "lucide-react";
import { getStudentRegisteredCourses } from "@/app/courses/actions";
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

const statusConfig = {
  active: {
    label: "Active",
    icon: CheckCircle,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  complete: {
    label: "Complete",
    icon: GraduationCap,
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
};

export default function StudentCoursesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all your enrolled courses
          </p>
        </div>
        <Link href="/student/courses/browse">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Browse Courses
          </Button>
        </Link>
      </div>

      <Suspense fallback={<CoursesFallback />}>
        <CoursesContent />
      </Suspense>
    </div>
  );
}

async function CoursesContent() {
  const registrations = await getStudentRegisteredCourses();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {registrations.map((registration: any, index: number) => {
          const statusKey = registration.status as keyof typeof statusConfig;
          const StatusIcon = statusConfig[statusKey].icon;

          return (
            <Card
              key={registration.id}
              className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
            >
              <CardHeader className="pb-4">
                <div
                  className={`h-2 w-full rounded-t-lg ${
                    courseColors[index % courseColors.length]
                  } -mt-6 -mx-6 mb-4`}
                />
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">
                      {registration.course_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {registration.credits} Credits
                      </Badge>
                      <Badge className={statusConfig[statusKey].className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[statusKey].label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {registration.lecturer_name}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {registration.department_name || "N/A"}
                  </div>
                  {registration.semester_name && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {registration.semester_name}
                    </div>
                  )}
                </div>

                {registration.grade && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Final Grade:</span>
                      <span className="text-lg font-bold">
                        {registration.grade}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {registration.description}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Registered:{" "}
                  {new Date(registration.reg_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {registrations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-muted-foreground">
              No courses found. Browse available courses to get started.
            </p>
            <Link href="/student/courses/browse">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
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


