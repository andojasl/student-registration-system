import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type ScheduleFormProps = {
  action: (formData: FormData) => void;
  courses: Array<{
    id: number;
    name: string;
    semesters?: { id: number; name: string } | null;
  }>;
  rooms: Array<{
    id: number;
    name: string;
    building?: string | null;
    capacity?: number | null;
  }>;
  initialData?: {
    schedule_id?: number;
    course_id?: number;
    room_id?: number | null;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    semester_id?: number | null;
  };
  submitLabel?: string;
};

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

// =====================================================
// COMPONENT
// =====================================================

export default function ScheduleForm({
  action,
  courses,
  rooms,
  initialData,
  submitLabel = "Create Schedule"
}: ScheduleFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Schedule' : 'Create New Schedule'}</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-6">
          {/* Hidden field for schedule ID when editing */}
          {initialData?.schedule_id && (
            <input type="hidden" name="schedule_id" value={initialData.schedule_id} />
          )}

          {/* Course selection */}
          <div className="space-y-2">
            <Label htmlFor="course_id">Course *</Label>
            <select
              id="course_id"
              name="course_id"
              required
              defaultValue={initialData?.course_id || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                  {course.semesters && ` - ${course.semesters.name}`}
                </option>
              ))}
            </select>
          </div>

          {/* Day of week */}
          <div className="space-y-2">
            <Label htmlFor="day_of_week">Day of Week *</Label>
            <select
              id="day_of_week"
              name="day_of_week"
              required
              defaultValue={initialData?.day_of_week || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a day</option>
              {DAYS.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                required
                defaultValue={initialData?.start_time || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                required
                defaultValue={initialData?.end_time || ''}
              />
            </div>
          </div>

          {/* Room selection */}
          <div className="space-y-2">
            <Label htmlFor="room_id">Room</Label>
            <select
              id="room_id"
              name="room_id"
              defaultValue={initialData?.room_id || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">No room assigned (Virtual/TBA)</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
                  {room.building && ` - ${room.building}`}
                  {room.capacity && ` (Cap: ${room.capacity})`}
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <div className="flex gap-4">
            <Button type="submit" className="w-full md:w-auto">
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
