import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Mail, UserCircle } from "lucide-react";
import { getGroups } from "@/lib/db/queries";

export default function GroupsPage() {
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
  const groups = await getGroups();

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Members</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
            </table>
            <Accordion type="single" collapsible className="w-full">
              {groups.map((group) => (
                <AccordionItem key={group.id} value={`group-${group.id}`} className="border-b last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 hover:no-underline">
                    <div className="flex w-full items-center gap-4 text-left">
                      <div className="flex-1 font-medium">{group.name}</div>
                      <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {group.students?.length || 0} Members
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="mt-2 space-y-2 rounded-lg border bg-muted/20 p-4">
                      <h4 className="font-semibold text-sm mb-3">Group Members</h4>
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
      </Card>

      {groups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No groups found. Contact your administrator to create or join groups.</p>
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
