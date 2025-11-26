import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Mail, UserCircle } from "lucide-react";
import {
  getGroups,
  createGroup,
  joinGroupForCurrentStudent,
  getCurrentStudent,
  leaveGroupForCurrentStudent,
} from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

async function createGroupAction(formData: FormData) {
  "use server";
  const nameValue = formData.get("name");
  const descriptionValue = formData.get("description");

  const name = typeof nameValue === "string" ? nameValue.trim().slice(0, 8) : "";
  const description =
    typeof descriptionValue === "string" ? descriptionValue.trim() : "";

  if (!name) {
    return;
  }

  await createGroup(name, description);
  revalidatePath("/student/groups");
}

async function joinGroupAction(formData: FormData) {
  "use server";
  const groupIdValue = formData.get("groupId");
  const groupId =
    typeof groupIdValue === "string" ? parseInt(groupIdValue, 10) : NaN;

  if (!groupId || Number.isNaN(groupId)) {
    return;
  }

  await joinGroupForCurrentStudent(groupId);
  revalidatePath("/student/groups");
}

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

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Create group</h2>
          <p className="text-sm text-muted-foreground">
            Choose a short name and description for your group.
          </p>
          <form action={createGroupAction} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                name="name"
                placeholder="Group name"
                maxLength={8}
                required
                className="w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Create group
              </button>
            </div>
            <textarea
              name="description"
              placeholder="Short description for this group"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </form>
        </CardContent>
      </Card>

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
                  group.students?.some(
                    (student) => student.id === currentStudent.id
                  );

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

                        {isMember ? (
                          <form action={leaveGroupAction} className="pt-2">
                            <input
                              type="hidden"
                              name="groupId"
                              value={group.id}
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-md border border-destructive bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                            >
                              Leave group
                            </button>
                          </form>
                        ) : (
                          <form action={joinGroupAction} className="pt-2">
                            <input
                              type="hidden"
                              name="groupId"
                              value={group.id}
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

      {groups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No groups found yet. Create a group above or join one when it
              appears in the list.
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

