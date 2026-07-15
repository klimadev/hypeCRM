import { Skeleton, SkeletonKPI } from "@/components/ui/skeleton";

export default function WhatsappLoading() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-5 md:px-6 md:py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0" rounded="control" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>

      {/* KPI skeletons */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
      </div>

      {/* Wizard skeleton */}
      <div className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Instance list skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0" rounded="full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" rounded="control" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
