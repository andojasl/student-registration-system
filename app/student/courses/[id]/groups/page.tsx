import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UserPlus, UserMinus } from "lucide-react";
import Link from "next/link";
import { getCourseGroups, joinCourseGroup, leaveCourseGroup } from "@/app/student/courses/actions";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

async function joinGroupAction(formData: FormData) {
  "use server";
  const groupIdValue = formData.get("groupId");
  const courseIdValue = formData.get("courseId");
  const groupId = typeof groupIdValue === "string" ? parseInt(groupIdValue, 10) : NaN;
  const courseId = typeof courseIdValue === "string" ? parseInt(courseIdValue, 10) : NaN;

  if (!groupId || Number.isNaN(groupId)) {
    return;
  }

  await joinCourseGroup(formData);
  if (!Number.isNaN(courseId)) {
    revalidatePath(`/student/courses/${courseId}/groups`);
  }
}

async function leaveGroupAction(formData: FormData) {
  "use server";
  const groupIdValue = formData.get("groupId");
  const courseIdValue = formData.get("courseId");
  const groupId = typeof groupIdValue === "string" ? parseInt(groupIdValue, 10) : NaN;
  const courseId = typeof courseIdValue === "string" ? parseInt(courseIdValue, 10) : NaN;

  if (!groupId || Number.isNaN(groupId)) {
    return;
  }

  await leaveCourseGroup(formData);
  if (!Number.isNaN(courseId)) {
    revalidatePath(`/student/courses/${courseId}/groups`);
  }
}

export default async function CourseGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = parseInt(id);
  const groups = await getCourseGroups(courseId);

  if (!groups) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/student/courses/${courseId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Study Groups</h1>
        <p className="text-muted-foreground mt-2">
          Join a study group to collaborate with classmates
        </p>
      </div>

      <Suspense fallback={<GroupsFallback />}>
        <GroupsContent groups={groups} courseId={courseId} />
      </Suspense>
    </div>
  );
}

function GroupsContent({
  groups,
  courseId,
}: {
  groups: any[];
  courseId: number;
}) {
  return (
    <>
      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              No study groups available for this course yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-lg transition-all duration-200"
            >
              <CardHeader>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {group.description || "No description"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">
                      Members ({group.member_count})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {group.students.length > 0 ? (
                      group.students.map((student: any) => (
                        <div
                          key={student.id}
                          className="text-xs p-2 bg-muted rounded flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-muted-foreground truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No members yet
                      </p>
                    )}
                  </div>
                </div>

                {group.is_member ? (
                  <form
                    action={leaveGroupAction}
                    className="w-full"
                  >
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Leave Group
                    </Button>
                  </form>
                ) : (
                  <form
                    action={joinGroupAction}
                    className="w-full"
                  >
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <Button type="submit" className="w-full" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Group
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function GroupsFallback() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 py-6">
            <div className="h-6 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-24 w-full rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}