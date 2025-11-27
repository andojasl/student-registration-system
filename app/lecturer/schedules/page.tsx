import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSchedulesByLecturer } from "./actions";
import { Plus, Calendar, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import Link from "next/link";
import WeeklyCalendar from "@/components/schedules/weekly-calendar";
import ScheduleCard from "@/components/schedules/schedule-card";

export default async function LecturerSchedulesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  // Auth check
  const user = await getUser();
  if (!user || user.role !== 'lecturer') {
    redirect('/auth/login');
  }

  // Fetch data
  const schedules = await getSchedulesByLecturer();

  // Await searchParams in Next.js 16+
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Class Schedules</h1>
            <p className="text-muted-foreground">Manage your course schedules and timetable</p>
          </div>
          <Link href="/lecturer/schedules/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </Link>
        </div>

        {/* Success/Error Messages */}
        {params.success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              {params.success === 'created' && 'Schedule created successfully!'}
              {params.success === 'updated' && 'Schedule updated successfully!'}
              {params.success === 'deleted' && 'Schedule deleted successfully!'}
            </p>
          </div>
        )}

        {params.error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {decodeURIComponent(params.error)}
            </p>
          </div>
        )}

        {/* Weekly Calendar */}
        <div className="mb-8">
          <WeeklyCalendar
            schedules={schedules}
            role="lecturer"
          />
        </div>

        {/* List View */}
        {schedules.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">All Schedules</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map(schedule => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  canEdit={true}
                  canDelete={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
