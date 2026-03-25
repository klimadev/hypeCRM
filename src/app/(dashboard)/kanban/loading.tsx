import { Skeleton } from "@/components/ui/skeleton";

export default function KanbanLoading() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] px-5 py-5 shadow-[var(--shadow-md)] md:px-6 md:py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_30%)] opacity-70" />
        <div className="relative flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0" rounded="control" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] flex-1 space-y-3">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
              <KanbanCardSkeleton />
              <KanbanCardSkeleton />
              {i < 2 && <KanbanCardSkeleton />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KanbanCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
