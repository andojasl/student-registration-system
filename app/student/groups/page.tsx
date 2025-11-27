import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Mail, UserCircle, BookOpen } from "lucide-react";
import {
  getGroups,
  getCurrentStudent,
  leaveGroupForCurrentStudent,
} from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

async function leaveGroupAction(formData: FormData) {
  "use server";
  const groupIdValue = formData.get("groupId");
  const groupId =
    typeof groupIdValue === "string" ? parseInt(groupIdValue, 10) : NaN;

  if (!groupId || Number.isNaN(groupId)) {
    return;
  }

  await leaveGroupForCurrentStudent(groupId);
  revalidatePath("/student/groups");
}

export default function StudentGroupsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your study groups
        </p>
      </div>

      <Suspense fallback={<GroupsFallback />}>
        <GroupsContent />
      </Suspense>
    </div>
  );
}

async function GroupsContent() {
  const [groups, currentStudent] = await Promise.all([
    getGroups(),
    getCurrentStudent(),
  ]);

  const memberGroups =
    currentStudent?.id != null
      ? groups.filter((group) =>
          group.students?.some((student) => student.id === currentStudent.id)
        )
      : [];

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Accordion type="single" collapsible className="w-full">
              {memberGroups.map((group) => (
                <AccordionItem
                  key={group.id}
                  value={`group-${group.id}`}
                  className="border-b last:border-0"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 hover:no-underline">
                    <div className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-[2fr_auto] sm:items-center">
                      <div className="space-y-2">
                        <div className="font-semibold text-base">{group.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{group.course?.name ?? "Course not linked"}</span>
                          </span>
                          {group.description && (
                            <span className="inline-flex max-w-md text-left text-muted-foreground line-clamp-2">
                              {group.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:justify-end">
                        <Users className="h-4 w-4" />
                        {group.students?.length || 0} Members
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="mt-2 space-y-5 rounded-xl border bg-muted/20 p-5">
                      {group.description && (
                        <p className="text-sm text-foreground font-medium">
                          {group.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-1 border">
                          <BookOpen className="h-4 w-4" />
                          <span>{group.course?.name ?? "Course not linked"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-1 border">
                          <Users className="h-3 w-3" />
                          <span>{group.students?.length || 0} member{(group.students?.length || 0) === 1 ? "" : "s"}</span>
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Group Members</h4>
                        </div>
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
                                        {student.first_name} {student.last_name}
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
                      <div className="flex justify-end">
                        <form action={leaveGroupAction} className="pt-2">
                          <input type="hidden" name="groupId" value={group.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md border border-destructive bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                          >
                            Leave group
                          </button>
                        </form>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
      </Card>

      {memberGroups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              You are not part of any groups yet.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function GroupsFallback() {
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

