"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userEmail?: string;
  role?: string | null;
}

const studentNavigation = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard },
  { name: "My Courses", href: "/student/courses", icon: BookOpen },
  { name: "My Groups", href: "/student/groups", icon: Users },
];

const lecturerNavigation = [
  { name: "Dashboard", href: "/lecturer/dashboard", icon: LayoutDashboard },
  { name: "Enrollments", href: "/lecturer/enrollments", icon: BookOpen },
];

export function Sidebar({ userEmail, role }: SidebarProps) {
  const pathname = usePathname();
  const navigation = role === "lecturer" ? lecturerNavigation : studentNavigation;

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">
          {role === "lecturer" ? "Lecturer Dashboard" : "Student Portal"}
        </h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {userEmail && (
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
            </div>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-secondary-foreground"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
