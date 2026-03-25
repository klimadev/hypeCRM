import { Skeleton } from "@/components/ui/skeleton";

export default function WhatsappLoading() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] px-5 py-5 shadow-[var(--shadow-md)] md:px-6 md:py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_30%)] opacity-70" />
        <div className="relative flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0" rounded="control" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>

      {/* Chat layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sidebar list */}
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-3 space-y-2">
          <Skeleton className="h-9 w-full mb-3" rounded="control" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-[var(--radius-control)] p-2">
              <Skeleton className="h-9 w-9 shrink-0" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </section>
  );
}
