"use client";

import { AgendaWidget } from "@/modules/calcom/components/agenda-widget";
import { useCalComModule } from "@/modules/calcom/hooks/use-calcom-module";

export function AgendaWidgetWrapper() {
  const { bookings, carregando, erro } = useCalComModule();
  return <AgendaWidget bookings={bookings} carregando={carregando} erro={erro} />;
}
