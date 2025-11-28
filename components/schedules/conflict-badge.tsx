import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type ConflictBadgeProps = {
  conflicts: Array<{
    course_name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
};

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// =====================================================
// COMPONENT
// =====================================================

export default function ConflictBadge({ conflicts }: ConflictBadgeProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            Schedule Conflict Warning
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            This course has time conflicts with your current schedule:
          </p>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className="text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 rounded px-3 py-2"
              >
                <span className="font-medium">{conflict.course_name}</span>
                {' on '}
                <span className="font-medium">{DAY_NAMES[conflict.day_of_week]}</span>
                {' at '}
                <span className="font-medium">
                  {conflict.start_time} - {conflict.end_time}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-3">
            You can still enroll, but you may need to drop one of the conflicting courses.
          </p>
        </div>
      </div>
    </div>
  );
}
