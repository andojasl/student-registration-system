"use client";

import { usePathname } from "next/navigation";

export function LayoutContent({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    return <main className="flex-1 overflow-y-auto w-full">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebar}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
