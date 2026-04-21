import { redirect } from "next/navigation";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";

export default async function PaginaSuperAdmin() {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);

  if (!sessao || !eSuperAdmin) {
    redirect("/");
  }

  redirect("/super-admin/usuarios");
}