import { Skeleton } from "@/components/ui/skeleton";

export function ModuleSkeleton() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-md)] md:px-6 md:py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--brand)_14%,transparent),transparent_34%),radial-gradient(circle_at_bottom_left,color-mix(in_srgb,var(--info-alt)_10%,transparent),transparent_30%)] opacity-70" />
        <div className="relative flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0" rounded="control" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" rounded="control" />
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" rounded="control" />
            <Skeleton className="h-12 w-full" rounded="control" />
            <Skeleton className="h-12 w-full" rounded="control" />
            <Skeleton className="h-12 w-full" rounded="control" />
            <Skeleton className="h-12 w-full" rounded="control" />
          </div>
        </div>
      </div>
    </section>
  );
}
