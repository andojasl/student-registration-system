export default function RootLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-background">
        <div className="h-16 border-b px-6 flex items-center">
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-4 space-y-2">
          <div className="h-10 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-4">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </main>
    </div>
  );
}


