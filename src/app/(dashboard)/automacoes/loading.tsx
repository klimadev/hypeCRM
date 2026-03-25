import { Skeleton } from "@/components/ui/skeleton";

export default function AutomacoesLoading() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] px-5 py-5 shadow-[var(--shadow-md)] md:px-6 md:py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_30%)] opacity-70" />
        <div className="relative flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0" rounded="control" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Automation cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
