'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type Schedule = {
  id: number;
  course_id: number;
  course_name: string;
  course_credits?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_id?: number | null;
  room_name?: string | null;
  room_building?: string | null;
  lecturer_name?: string;
};

interface WeeklyCalendarProps {
  schedules: Schedule[];
  role: 'lecturer' | 'student';
}

// =====================================================
// CONSTANTS
// =====================================================

const DAYS = [
  { num: 1, short: 'Mon', full: 'Monday' },
  { num: 2, short: 'Tue', full: 'Tuesday' },
  { num: 3, short: 'Wed', full: 'Wednesday' },
  { num: 4, short: 'Thu', full: 'Thursday' },
  { num: 5, short: 'Fri', full: 'Friday' },
  { num: 6, short: 'Sat', full: 'Saturday' },
  { num: 7, short: 'Sun', full: 'Sunday' },
];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Color palette for different courses (cycles through)
const COURSE_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
  'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100',
  'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100',
  'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-900 dark:text-pink-100',
  'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100',
  'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100',
  'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100',
];

// =====================================================
// COMPONENT
// =====================================================

export default function WeeklyCalendar({ schedules, role }: WeeklyCalendarProps) {
  const [currentDay, setCurrentDay] = useState(1); // For mobile view
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Group schedules by course ID for consistent coloring
  const courseColorMap = new Map<number, string>();
  let colorIndex = 0;

  schedules.forEach(schedule => {
    if (!courseColorMap.has(schedule.course_id)) {
      courseColorMap.set(schedule.course_id, COURSE_COLORS[colorIndex % COURSE_COLORS.length]);
      colorIndex++;
    }
  });

  // Convert time string to minutes since midnight for positioning
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculate position and height for schedule block
  const getScheduleStyle = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const baseMinutes = timeToMinutes('08:00');

    const top = ((startMinutes - baseMinutes) / 60) * 80; // 80px per hour
    const height = ((endMinutes - startMinutes) / 60) * 80;

    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: '40px', // Minimum height for readability
    };
  };

  // Handle day navigation for mobile
  const nextDay = () => {
    setCurrentDay(prev => (prev === 7 ? 1 : prev + 1));
  };

  const prevDay = () => {
    setCurrentDay(prev => (prev === 1 ? 7 : prev - 1));
  };

  // Filter schedules for mobile day view
  const displayDays = viewMode === 'week' ? DAYS : DAYS.filter(d => d.num === currentDay);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Timetable</CardTitle>

          {/* Mobile: Day navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={prevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {DAYS.find(d => d.num === currentDay)?.full}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={nextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop: View toggle */}
          <div className="hidden md:flex gap-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week View
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setViewMode('day'); setCurrentDay(new Date().getDay() || 7); }}
            >
              Day View
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">No classes scheduled</p>
            {role === 'lecturer' && (
              <p className="text-sm text-muted-foreground mt-2">
                Create your first schedule to get started
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className={`grid ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-2'} gap-0 min-w-[800px]`}>
              {/* Time column */}
              <div className="border-r">
                <div className="h-12 border-b sticky top-0 bg-background flex items-center justify-center font-medium text-sm">
                  Time
                </div>
                {TIME_SLOTS.map(time => (
                  <div
                    key={time}
                    className="h-20 border-b flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground"
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {displayDays.map(day => {
                const daySchedules = schedules.filter(s => s.day_of_week === day.num);

                return (
                  <div key={day.num} className="border-r last:border-r-0">
                    {/* Day header */}
                    <div className="h-12 border-b sticky top-0 bg-background flex flex-col items-center justify-center">
                      <span className="font-medium text-sm">{day.short}</span>
                      <span className="text-xs text-muted-foreground">{day.full.slice(0, 3)}</span>
                    </div>

                    {/* Time grid */}
                    <div className="relative">
                      {TIME_SLOTS.map(time => (
                        <div
                          key={time}
                          className="h-20 border-b"
                        />
                      ))}

                      {/* Schedule blocks */}
                      {daySchedules.map(schedule => {
                        const style = getScheduleStyle(schedule.start_time, schedule.end_time);
                        const colorClass = courseColorMap.get(schedule.course_id) || COURSE_COLORS[0];

                        return (
                          <div
                            key={schedule.id}
                            className={`absolute left-0 right-0 mx-1 rounded border-l-4 p-2 transition-all hover:shadow-md ${colorClass}`}
                            style={style}
                          >
                            <div className="text-xs font-semibold truncate mb-1">
                              {schedule.course_name}
                            </div>
                            <div className="text-xs opacity-90 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{schedule.start_time} - {schedule.end_time}</span>
                            </div>
                            {schedule.room_name && (
                              <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{schedule.room_name}</span>
                              </div>
                            )}
                            {schedule.lecturer_name && role === 'student' && (
                              <div className="text-xs opacity-80 mt-1 truncate">
                                {schedule.lecturer_name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        {schedules.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">Courses:</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(schedules.map(s => s.course_id))).map(courseId => {
                const schedule = schedules.find(s => s.course_id === courseId);
                if (!schedule) return null;

                const colorClass = courseColorMap.get(courseId) || COURSE_COLORS[0];

                return (
                  <Badge
                    key={courseId}
                    variant="outline"
                    className={`${colorClass} border`}
                  >
                    {schedule.course_name}
                    {schedule.course_credits && ` (${schedule.course_credits} credits)`}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
