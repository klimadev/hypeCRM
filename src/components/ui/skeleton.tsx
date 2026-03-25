import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  /** Match the radius of the content it represents */
  rounded?: "control" | "card" | "shell" | "full";
};

export function Skeleton({ className, rounded = "control" }: SkeletonProps) {
  const radiusMap = {
    control: "rounded-[var(--radius-control)]",
    card: "rounded-[var(--radius-card)]",
    shell: "rounded-[var(--radius-shell)]",
    full: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-shimmer",
        radiusMap[rounded],
        className,
      )}
    />
  );
}

// === PRE-BUILT SKELETON PATTERNS ===

/** Skeleton for a text line */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  if (lines === 1) {
    return <Skeleton className={cn("h-4 w-full", className)} />;
  }
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

/** Skeleton for an avatar */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  return <Skeleton className={sizeMap[size]} rounded="full" />;
}

/** Skeleton for a button */
export function SkeletonButton({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeMap = {
    sm: "h-9 w-20",
    default: "h-10 w-28",
    lg: "h-11 w-36",
  };
  return <Skeleton className={sizeMap[size]} rounded="control" />;
}

/** Skeleton for a card */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-6", className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <SkeletonButton size="sm" />
        <SkeletonButton size="sm" />
      </div>
    </div>
  );
}

/** Skeleton for a table row */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--border-subtle)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn("h-4", i === 0 ? "w-24" : "w-16")} />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for a KPI card */
export function SkeletonKPI() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-2 h-7 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/** Skeleton for kanban card */
export function SkeletonKanbanCard() {
  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-12" rounded="full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}