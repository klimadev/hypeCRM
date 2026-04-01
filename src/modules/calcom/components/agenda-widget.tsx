"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CalComBooking } from "../types";

type AgendaWidgetProps = {
  bookings: CalComBooking[];
  carregando: boolean;
  erro: string | null;
  hrefIntegracao?: string;
  rotuloAcao?: string;
};

export function AgendaWidget({ bookings, carregando, erro, hrefIntegracao, rotuloAcao }: AgendaWidgetProps) {
  return (
    <Card className="overflow-hidden border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.96))]">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-[color:rgba(56,189,248,0.2)] bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(255,255,255,0.03))] text-[var(--info)]">
            <Calendar className="h-4 w-4" />
          </span>
          Proximas reunioes
        </CardTitle>
        {hrefIntegracao ? (
          <Button asChild variant="link" className="h-auto min-h-0 shrink-0 gap-1 px-0 py-0 text-xs font-medium">
            <Link href={hrefIntegracao}>
              {rotuloAcao ?? "Abrir central"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {carregando ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
            Carregando agenda...
          </div>
        ) : erro ? (
          <p className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.22)] bg-[color:rgba(244,63,94,0.12)] px-3 py-2 text-sm text-[var(--danger)]">{erro}</p>
        ) : bookings.length === 0 ? (
          <p className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            Nenhuma reuniao encontrada.
          </p>
        ) : (
          bookings.map((booking) => {
            const inicio = booking.start ? new Date(booking.start) : null;
            const inicioValido = inicio ? !Number.isNaN(inicio.getTime()) : false;
            const attendee = booking.attendees[0];

            return (
              <div
                key={booking.uid}
                className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:-translate-y-px hover:border-[var(--border-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{booking.title}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{booking.instanciaNome}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {inicioValido
                        ? `${inicio?.toLocaleDateString("pt-BR")} as ${inicio?.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Data pendente"}
                    </p>
                    {attendee ? (
                      <p className="text-xs text-[var(--text-tertiary)]">{attendee.name || attendee.email}</p>
                    ) : null}
                  </div>
                  {booking.meetingUrl ? (
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-[color:rgba(139,92,246,0.22)] bg-[color:rgba(139,92,246,0.08)] px-2.5 py-1 text-xs font-medium text-[var(--brand)] hover:border-[color:rgba(139,92,246,0.36)] hover:bg-[color:rgba(139,92,246,0.14)] hover:text-[var(--brand-strong)]"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Abrir
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
