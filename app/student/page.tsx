import { Suspense } from "react";
import { BookOpen, Users, Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  getGroups,
  getCurrentStudent,
  getStudentRegistrations,
} from "@/lib/db/queries";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s what&apos;s happening with your studies.
        </p>
      </div>

      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const currentStudent = await getCurrentStudent();

  const [groups, registrations] = await Promise.all([
    getGroups(),
    currentStudent
      ? (getStudentRegistrations(currentStudent.id) as Promise<any[]>)
      : Promise.resolve([] as any[]),
  ]);

  const myGroups = currentStudent
    ? groups.filter((group: any) =>
        group.students?.some((student: any) => student.id === currentStudent.id)
      )
    : [];

  const enrolledCourseIds = new Set<number>();
  registrations.forEach((registration: any) => {
    const courseId = registration.courses?.id ?? registration.course_id;
    if (typeof courseId === "number") {
      enrolledCourseIds.add(courseId);
    }
  });

  const totalCourses = enrolledCourseIds.size;

  const stats = [
    {
      title: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
      href: "/student/courses",
      description: "Courses you're enrolled in",
    },
    {
      title: "Study Groups",
      value: myGroups.length,
      icon: Users,
      href: "/student/groups",
      description: "Groups you're a member of",
    },
  ];

  const recentActivity = registrations
    .slice()
    .sort(
      (a: any, b: any) =>
        new Date(b.reg_date).getTime() - new Date(a.reg_date).getTime()
    )
    .slice(0, 10)
    .map((registration: any) => ({
      id: registration.id,
      message: `Enrolled in ${registration.courses?.name ?? "a course"}`,
      time: new Date(registration.reg_date).toLocaleString(),
    }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/student/courses">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Courses</CardTitle>
                    <CardDescription>View all your courses</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/student/schedules">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Timetable</CardTitle>
                    <CardDescription>View this week's schedule</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>


          <Link href="/student/groups">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Groups</CardTitle>
                    <CardDescription>Manage your study groups</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentActivity.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No recent activity yet. Enroll in courses to see updates here.
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-1">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 py-6">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-16 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3 py-6">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}


