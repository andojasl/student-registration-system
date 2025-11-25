import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Mail, UserCircle } from "lucide-react";

const groups = [
  {
    id: 1,
    name: "Algorithm Study Group",
    course: "Data Structures & Algorithms",
    memberCount: 5,
    members: [
      { id: 1, name: "John Smith", email: "john.smith@university.edu", role: "Leader" },
      { id: 2, name: "Emma Wilson", email: "emma.wilson@university.edu", role: "Member" },
      { id: 3, name: "Michael Brown", email: "michael.brown@university.edu", role: "Member" },
      { id: 4, name: "Sarah Davis", email: "sarah.davis@university.edu", role: "Member" },
      { id: 5, name: "James Johnson", email: "james.johnson@university.edu", role: "Member" },
    ],
  },
  {
    id: 2,
    name: "Web Dev Team",
    course: "Web Development",
    memberCount: 4,
    members: [
      { id: 1, name: "Alice Cooper", email: "alice.cooper@university.edu", role: "Leader" },
      { id: 2, name: "Bob Martinez", email: "bob.martinez@university.edu", role: "Member" },
      { id: 3, name: "Carol White", email: "carol.white@university.edu", role: "Member" },
      { id: 4, name: "David Lee", email: "david.lee@university.edu", role: "Member" },
    ],
  },
  {
    id: 3,
    name: "Database Project Team",
    course: "Database Systems",
    memberCount: 6,
    members: [
      { id: 1, name: "Rachel Green", email: "rachel.green@university.edu", role: "Leader" },
      { id: 2, name: "Ross Geller", email: "ross.geller@university.edu", role: "Member" },
      { id: 3, name: "Monica Bing", email: "monica.bing@university.edu", role: "Member" },
      { id: 4, name: "Chandler Bing", email: "chandler.bing@university.edu", role: "Member" },
      { id: 5, name: "Joey Tribbiani", email: "joey.tribbiani@university.edu", role: "Member" },
      { id: 6, name: "Phoebe Buffay", email: "phoebe.buffay@university.edu", role: "Member" },
    ],
  },
  {
    id: 4,
    name: "Software Engineering Team A",
    course: "Software Engineering",
    memberCount: 5,
    members: [
      { id: 1, name: "Tom Anderson", email: "tom.anderson@university.edu", role: "Leader" },
      { id: 2, name: "Lisa Chen", email: "lisa.chen@university.edu", role: "Member" },
      { id: 3, name: "Mark Thompson", email: "mark.thompson@university.edu", role: "Member" },
      { id: 4, name: "Nina Patel", email: "nina.patel@university.edu", role: "Member" },
      { id: 5, name: "Oscar Kim", email: "oscar.kim@university.edu", role: "Member" },
    ],
  },
];

export default function GroupsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your study groups
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Course</th>
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
                      <div className="flex-1 text-sm text-muted-foreground">{group.course}</div>
                      <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {group.memberCount} Members
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="mt-2 space-y-2 rounded-lg border bg-muted/20 p-4">
                      <h4 className="font-semibold text-sm mb-3">Group Members</h4>
                      <div className="space-y-3">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <UserCircle className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{member.name}</p>
                                  {member.role === "Leader" && (
                                    <Badge variant="default" className="text-xs">
                                      Leader
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
