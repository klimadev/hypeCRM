import { Metadata } from "next";
import { AutomacoesModule } from "./automacoes-module";

export const metadata: Metadata = {
  title: "Automações | HYPE CRM",
  description: "Gerencie automações de mensagens e notificações",
};

export default function AutomacoesPage() {
  return <AutomacoesModule />;
}
