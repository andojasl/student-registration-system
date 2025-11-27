import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import { getScheduleById, deleteSchedule } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default async function DeleteSchedulePage({ params }: { params: { id: string } }) {
  // Auth check
  const user = await getUser();
  if (!user || user.role !== 'lecturer') {
    redirect('/auth/login');
  }

  const scheduleId = parseInt(params.id);

  // Fetch data
  const schedule = await getScheduleById(scheduleId);

  // If schedule doesn't exist or doesn't belong to lecturer
  if (!schedule) {
    redirect('/lecturer/schedules?error=' + encodeURIComponent('Schedule not found or unauthorized'));
  }

  const handleDelete = async () => {
    'use server'
    await deleteSchedule(scheduleId);
  };

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
          <h1 className="text-3xl font-bold mb-2">Delete Schedule</h1>
          <p className="text-muted-foreground">Confirm deletion of this class schedule</p>
        </div>

        {/* Confirmation Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Are you sure?</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete the following schedule:
            </p>

            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">{(schedule.courses as any)?.name}</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Day:</span>{' '}
                  <span>{DAY_NAMES[schedule.day_of_week]}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Time:</span>{' '}
                  <span>{schedule.start_time} - {schedule.end_time}</span>
                </p>
                {schedule.rooms && (
                  <p>
                    <span className="text-muted-foreground">Room:</span>{' '}
                    <span>{(schedule.rooms as any)?.name}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/lecturer/schedules" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <form action={handleDelete} className="flex-1">
                <Button type="submit" variant="destructive" className="w-full">
                  Delete Schedule
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
