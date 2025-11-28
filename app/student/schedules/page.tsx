import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentWeeklySchedule } from "./actions";
import { BookOpen, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import Link from "next/link";
import WeeklyCalendar from "@/components/schedules/weekly-calendar";

export default async function StudentSchedulesPage() {
  // Auth check
  const user = await getUser();
  if (!user || user.role !== 'student') {
    redirect('/auth/login');
  }

  // Fetch data
  const schedules = await getStudentWeeklySchedule();

  return (
    <div className="min-h-screen bg-background  ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Timetable</h1>
            <p className="text-muted-foreground">Your weekly class schedule</p>
          </div>
          {schedules.length === 0 && (
            <Link href="/student/courses/browse">
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
            </Link>
          )}
        </div>

        {/* Weekly Calendar */}
        {schedules.length > 0 ? (
          <WeeklyCalendar
            schedules={schedules}
            role="student"
          />
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Classes Scheduled</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any classes on your timetable yet.
              </p>
              <Link href="/student/courses/browse">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Available Courses
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Course List */}
        {schedules.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Enrolled Courses</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from(new Set(schedules.map(s => s.course_id))).map(courseId => {
                const courseSchedules = schedules.filter(s => s.course_id === courseId);
                const firstSchedule = courseSchedules[0];

                return (
                  <Card key={courseId} className="p-4">
                    <h3 className="font-semibold mb-2">{firstSchedule.course_name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {firstSchedule.lecturer_name}
                    </p>
                    <div className="space-y-1 text-sm">
                      {courseSchedules.map(schedule => (
                        <div key={schedule.id} className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][schedule.day_of_week]}
                            {' '}
                            {schedule.start_time} - {schedule.end_time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
