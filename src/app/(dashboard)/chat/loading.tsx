export default function ChatLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="h-20 shrink-0 animate-pulse rounded-[var(--radius-shell)] bg-[var(--surface-elevated)]" />
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <div className="w-[340px] shrink-0 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-elevated)]" />
        <div className="min-h-0 flex-1 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-elevated)]" />
      </div>
    </div>
  );
}
