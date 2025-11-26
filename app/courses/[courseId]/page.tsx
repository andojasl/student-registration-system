import { Suspense } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Mail, UserCircle } from "lucide-react";
import {
  getCourseById,
  getGroupsByCourse,
  getCurrentStudent,
  joinGroupForCurrentStudent,
  leaveGroupForCurrentStudent,
} from "@/lib/db/queries";

async function joinGroupAction(formData: FormData) {
  "use server";
  const groupIdValue = formData.get("groupId");
  const courseIdValue = formData.get("courseId");

  const groupId =
    typeof groupIdValue === "string" ? parseInt(groupIdValue, 10) : NaN;
  const courseId = typeof courseIdValue === "string" ? courseIdValue : "";

  if (!groupId || Number.isNaN(groupId)) {
    return;
  }

  await joinGroupForCurrentStudent(groupId);

  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
  } else {
    revalidatePath("/courses");
  }
}

async function leaveGroupAction(formData: FormData) {
  "use server";
  const groupIdValue = formData.get("groupId");
  const courseIdValue = formData.get("courseId");

  const groupId =
    typeof groupIdValue === "string" ? parseInt(groupIdValue, 10) : NaN;
  const courseId = typeof courseIdValue === "string" ? courseIdValue : "";

  if (!groupId || Number.isNaN(groupId)) {
    return;
  }

  await leaveGroupForCurrentStudent(groupId);

  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
  } else {
    revalidatePath("/courses");
  }
}

type CoursePageProps = {
  params: { courseId: string };
};

export default async function CoursePage({ params }: CoursePageProps) {
  const course = await getCourseById(params.courseId);

  if (!course) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Course not found.</p>
        <Link
          href="/courses"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {course.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            {course.credits} credits
          </p>
        </div>
        <Link
          href="/courses"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to courses
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="mt-4">
            <CardContent className="p-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <div className="mt-4">
            <Suspense fallback={<CourseGroupsFallback />}>
              <CourseGroups courseId={params.courseId} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function CourseGroups({ courseId }: { courseId: string }) {
  const [groups, currentStudent] = await Promise.all([
    getGroupsByCourse(courseId),
    getCurrentStudent(),
  ]);

  const isInAnyGroupForCourse =
    currentStudent != null &&
    groups.some((group) =>
      group.students?.some((s) => s.id === currentStudent.id)
    );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Members
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
          </table>
          <Accordion type="single" collapsible className="w-full">
            {groups.map((group) => {
              const isMember =
                currentStudent &&
                group.students?.some((s) => s.id === currentStudent.id);

              return (
                <AccordionItem
                  key={group.id}
                  value={`group-${group.id}`}
                  className="border-b last:border-0"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 hover:no-underline">
                    <div className="flex w-full items-center gap-4 text-left">
                      <div className="flex-1">
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {group.students?.length || 0} Members
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="mt-2 space-y-4 rounded-lg border bg-muted/20 p-4">
                      {group.description && (
                        <p className="text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      )}

                      <div>
                        <h4 className="font-semibold text-sm mb-3">
                          Group Members
                        </h4>
                        {group.students && group.students.length > 0 ? (
                          <div className="space-y-3">
                            {group.students.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <UserCircle className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">
                                        {student.first_name}{" "}
                                        {student.last_name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      {student.email}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No members in this group yet
                          </p>
                        )}
                      </div>

                      {currentStudent == null ? null : isMember ? (
                        <form action={leaveGroupAction} className="pt-2">
                          <input
                            type="hidden"
                            name="groupId"
                            value={group.id}
                          />
                          <input
                            type="hidden"
                            name="courseId"
                            value={courseId}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md border border-destructive bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                          >
                            Leave group
                          </button>
                        </form>
                      ) : isInAnyGroupForCourse ? (
                        <div className="pt-2 text-xs text-muted-foreground">
                          You are already in another group for this course.
                        </div>
                      ) : (
                        <form action={joinGroupAction} className="pt-2">
                          <input
                            type="hidden"
                            name="groupId"
                            value={group.id}
                          />
                          <input
                            type="hidden"
                            name="courseId"
                            value={courseId}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            Join this group
                          </button>
                        </form>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseGroupsFallback() {
  return (
    <Card>
      <CardContent className="p-8 space-y-3">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}
