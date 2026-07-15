import { Skeleton } from "@/components/ui/skeleton";

export default function RecebimentosLoading() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-sm)] md:px-6 md:py-5">
        <div className="relative flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0" rounded="control" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <Skeleton className="mb-3 h-3 w-20" />
            <Skeleton className="mb-2 h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--border-subtle)] px-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
