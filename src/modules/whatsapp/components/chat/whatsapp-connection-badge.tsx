import type { ChatConnectionStatus } from "@/modules/whatsapp/types";

type Props = {
  status: ChatConnectionStatus;
};

export function WhatsappConnectionBadge({ status }: Props) {
  const online = status === "online";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-[var(--success)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_20%,transparent)]" : "bg-[var(--danger)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--danger)_20%,transparent)]"}`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
