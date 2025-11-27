import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type ScheduleCardProps = {
  schedule: {
    id: number;
    course_name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_name?: string | null;
    room_building?: string | null;
  };
  canEdit?: boolean;
  canDelete?: boolean;
};

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// =====================================================
// COMPONENT
// =====================================================

export default function ScheduleCard({ schedule, canEdit = false, canDelete = false }: ScheduleCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{schedule.course_name}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Calendar className="h-4 w-4" />
              <span>{DAY_NAMES[schedule.day_of_week]}</span>
            </div>
          </div>
          {(canEdit || canDelete) && (
            <div className="flex gap-2">
              {canEdit && (
                <Link href={`/lecturer/schedules/${schedule.id}/edit`}>
                  <Button variant="outline" size="icon-sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {canDelete && (
                <Link href={`/lecturer/schedules/${schedule.id}/delete`}>
                  <Button variant="outline" size="icon-sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{schedule.start_time} - {schedule.end_time}</span>
        </div>

        {schedule.room_name && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {schedule.room_name}
              {schedule.room_building && ` (${schedule.room_building})`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
