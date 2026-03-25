import { Metadata } from "next";
import { ModuloAutmacoesClient } from "./modulo-automacoes-client";

export const metadata: Metadata = {
  title: "Automações | HYPE CRM",
  description: "Gerencie automações de mensagens e notificações",
};

export default function AutomacoesPage() {
  return <ModuloAutmacoesClient />;
}
