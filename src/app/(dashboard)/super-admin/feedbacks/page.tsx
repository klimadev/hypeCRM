import { redirect } from "next/navigation";
import { ModuloFeedbackAdmin } from "@/modules/feedback/feedback";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";

export default async function PaginaFeedbackSuperAdmin() {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);

  if (!sessao || !eSuperAdmin) {
    redirect("/");
  }

  return <ModuloFeedbackAdmin />;
}