import type { ChatConnectionStatus } from "@/modules/whatsapp/types";

type Props = {
  status: ChatConnectionStatus;
};

export function WhatsappConnectionBadge({ status }: Props) {
  const online = status === "online";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-[var(--success)] shadow-[0_0_0_4px_rgba(16,185,129,0.08)]" : "bg-[var(--danger)] shadow-[0_0_0_4px_rgba(244,63,94,0.08)]"}`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
