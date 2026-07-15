import type { ChatConnectionStatus } from "@/modules/whatsapp/types";

type Props = {
  status: ChatConnectionStatus;
};

export function WhatsappConnectionBadge({ status }: Props) {
  const online = status === "online";
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
