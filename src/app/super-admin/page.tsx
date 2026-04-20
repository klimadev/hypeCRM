import { ModuloSuperAdmin } from "@/modules/super-admin";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";
import { redirect } from "next/navigation";

export default async function PaginaSuperAdmin() {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);

  if (!sessao || !eSuperAdmin) {
    redirect("/");
  }

  return <ModuloSuperAdmin />;
}