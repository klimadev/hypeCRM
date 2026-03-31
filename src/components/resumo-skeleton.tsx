import { Skeleton } from "@/components/ui/skeleton";

export function ResumoSkeleton() {
  return (
    <section className="space-y-6">
      {/* Header skeleton */}
      <div className="relative overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] px-5 py-5 shadow-[var(--shadow-md)] md:px-6 md:py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_30%)] opacity-70" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-11 w-11 shrink-0" rounded="control" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-64" />
              <div className="mt-2 flex gap-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-36 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid skeleton - 4 cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart + Agenda row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCardSkeleton />
        </div>
        <div>
          <AgendaCardSkeleton />
        </div>
      </div>
    </section>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0" rounded="card" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-row items-center justify-between gap-3 p-6">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="px-6 pb-6">
        <div className="flex h-[280px] items-end gap-2">
          <Skeleton className="h-[55%] flex-1" rounded="control" />
          <Skeleton className="h-[72%] flex-1" rounded="control" />
          <Skeleton className="h-[45%] flex-1" rounded="control" />
          <Skeleton className="h-[88%] flex-1" rounded="control" />
          <Skeleton className="h-[62%] flex-1" rounded="control" />
          <Skeleton className="h-[38%] flex-1" rounded="control" />
        </div>
      </div>
    </div>
  );
}

function AgendaCardSkeleton() {
  return (
    <div className="h-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-row items-center justify-between gap-3 p-6">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0" rounded="card" />
      </div>
      <div className="px-6 pb-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 shrink-0" rounded="control" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
