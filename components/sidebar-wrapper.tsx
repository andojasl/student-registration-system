import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { getUser } from "@/app/auth/actions";
import { getCurrentUserProfile } from "@/lib/db/queries";

async function SidebarContent() {
  const [user, profile] = await Promise.all([
    getUser(),
    getCurrentUserProfile(),
  ]);

  return (
    <Sidebar
      userEmail={user?.email}
      role={user?.role}
      userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
      avatarUrl={profile?.avatar_url || undefined}
    />
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Student Portal</h1>
      </div>
      <div className="flex-1 animate-pulse p-4 space-y-2">
        <div className="h-10 bg-muted rounded-lg" />
        <div className="h-10 bg-muted rounded-lg" />
        <div className="h-10 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export function SidebarWrapper() {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarContent />
    </Suspense>
  );
}
