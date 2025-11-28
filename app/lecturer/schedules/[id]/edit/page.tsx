import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import { getScheduleById, getLecturerCourses, getRooms, updateSchedule } from "../../actions";
import ScheduleForm from "@/components/schedules/schedule-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function EditSchedulePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  // Auth check
  const user = await getUser();
  if (!user || user.role !== 'lecturer') {
    redirect('/auth/login');
  }

  // Await params in Next.js 16+
  const { id } = await params;
  const scheduleId = parseInt(id);

  // Fetch data
  const schedule = await getScheduleById(scheduleId);
  const courses = await getLecturerCourses();
  const rooms = await getRooms();

  // If schedule doesn't exist or doesn't belong to lecturer
  if (!schedule) {
    redirect('/lecturer/schedules?error=' + encodeURIComponent('Schedule not found or unauthorized'));
  }

  // Await searchParams in Next.js 16+
  const searchParamsData = await searchParams;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/lecturer/schedules">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Schedules
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit Schedule</h1>
          <p className="text-muted-foreground">Update the class meeting time</p>
        </div>

        {/* Error Message */}
        {searchParamsData.error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {decodeURIComponent(searchParamsData.error)}
            </p>
          </div>
        )}

        {/* Form */}
        <ScheduleForm
          action={updateSchedule}
          courses={courses}
          rooms={rooms}
          initialData={{
            schedule_id: schedule.id,
            course_id: schedule.course_id,
            room_id: schedule.room_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            semester_id: schedule.semester_id,
          }}
          submitLabel="Update Schedule"
        />
      </div>
    </div>
  );
}
