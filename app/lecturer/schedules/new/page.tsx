import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import { getLecturerCourses, getRooms, createSchedule } from "../actions";
import ScheduleForm from "@/components/schedules/schedule-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewSchedulePage({ searchParams }: { searchParams: { error?: string } }) {
  // Auth check
  const user = await getUser();
  if (!user || user.role !== 'lecturer') {
    redirect('/auth/login');
  }

  // Fetch data
  const courses = await getLecturerCourses();
  const rooms = await getRooms();

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
          <h1 className="text-3xl font-bold mb-2">Create New Schedule</h1>
          <p className="text-muted-foreground">Add a class meeting time to your timetable</p>
        </div>

        {/* Error Message */}
        {searchParams.error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {decodeURIComponent(searchParams.error)}
            </p>
          </div>
        )}

        {/* Form */}
        <ScheduleForm
          action={createSchedule}
          courses={courses}
          rooms={rooms}
          submitLabel="Create Schedule"
        />
      </div>
    </div>
  );
}
