import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen } from "lucide-react";

const courses = [
  {
    id: 1,
    name: "Data Structures & Algorithms",
    code: "CS301",
    instructor: "Dr. Sarah Johnson",
    students: 45,
    schedule: "Mon, Wed 10:00 AM",
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Web Development",
    code: "CS205",
    instructor: "Prof. Michael Chen",
    students: 38,
    schedule: "Tue, Thu 2:00 PM",
    color: "bg-purple-500",
  },
  {
    id: 3,
    name: "Database Systems",
    code: "CS302",
    instructor: "Dr. Emily Rodriguez",
    students: 42,
    schedule: "Mon, Wed 1:00 PM",
    color: "bg-green-500",
  },
  {
    id: 4,
    name: "Software Engineering",
    code: "CS401",
    instructor: "Prof. James Wilson",
    students: 35,
    schedule: "Tue, Thu 10:00 AM",
    color: "bg-orange-500",
  },
  {
    id: 5,
    name: "Computer Networks",
    code: "CS303",
    instructor: "Dr. Amanda Lee",
    students: 40,
    schedule: "Wed, Fri 3:00 PM",
    color: "bg-pink-500",
  },
  {
    id: 6,
    name: "Artificial Intelligence",
    code: "CS405",
    instructor: "Prof. David Park",
    students: 30,
    schedule: "Mon, Wed 4:00 PM",
    color: "bg-indigo-500",
  },
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
            <CardHeader className="pb-4">
              <div className={`h-2 w-full rounded-t-lg ${course.color} -mt-6 -mx-6 mb-4`} />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {course.code}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {course.instructor}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {course.schedule}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  {course.students} students
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
