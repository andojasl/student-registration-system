import { BookOpen, Users, Bell, GraduationCap, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getCourses, getGroups, getDepartments, getLecturers } from "@/lib/db/queries";

const recentActivity = [
  { id: 1, message: "New assignment posted in Data Structures", time: "2 hours ago" },
  { id: 2, message: "Group meeting scheduled for Project Management", time: "5 hours ago" },
  { id: 3, message: "Grade posted for Algorithms Quiz", time: "1 day ago" },
  { id: 4, message: "New announcement in Web Development", time: "1 day ago" },
  { id: 5, message: "Joined new study group for Database Systems", time: "2 days ago" },
  { id: 6, message: "Course material updated in Software Engineering", time: "3 days ago" },
  { id: 7, message: "Upcoming deadline for Computer Networks project", time: "4 days ago" },
];

export default async function Dashboard() {
  const [courses, groups, departments, lecturers] = await Promise.all([
    getCourses(),
    getGroups(),
    getDepartments(),
    getLecturers(),
  ]);

  const stats = [
    {
      title: "Total Courses",
      value: courses.length,
      icon: BookOpen,
      href: "/courses",
      description: "Available courses",
    },
    {
      title: "Study Groups",
      value: groups.length,
      icon: Users,
      href: "/groups",
      description: "Active groups",
    },
    {
      title: "Departments",
      value: departments.length,
      icon: Building2,
      href: "#",
      description: "Academic departments",
    },
    {
      title: "Lecturers",
      value: lecturers.length,
      icon: GraduationCap,
      href: "#",
      description: "Teaching staff",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your courses.
        </p>
      </div>

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 max-w-2xl">
          <Link href="/courses">
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

          <Link href="/groups">
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
              {recentActivity.map((activity) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
