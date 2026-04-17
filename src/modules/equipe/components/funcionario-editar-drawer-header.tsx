import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Funcionario } from "../types";
import { getCargoLabelFuncionario, getIndiceCorAvatarFuncionario, getIniciaisFuncionario } from "./funcionario-editar-drawer.utils";

const coresAvatar = [
  "bg-gradient-to-br from-emerald-400 to-cyan-500 dark:from-emerald-500 dark:to-cyan-600",
  "bg-gradient-to-br from-violet-400 to-fuchsia-500 dark:from-violet-500 dark:to-fuchsia-600",
  "bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600",
  "bg-gradient-to-br from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600",
  "bg-gradient-to-br from-sky-400 to-blue-500 dark:from-sky-500 dark:to-blue-600",
  "bg-gradient-to-br from-lime-400 to-green-500 dark:from-lime-500 dark:to-green-600",
];

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "success" : "error"} className="px-2.5 py-1 font-medium">
      {ativo ? (
        <>
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Ativo
        </>
      ) : (
        <>
          <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Inativo
        </>
      )}
    </Badge>
  );
}

export function FuncionarioEditarDrawerHeader({ funcionario }: { funcionario: Funcionario | null }) {
  const nome = funcionario?.nome || "";
  const indiceCor = getIndiceCorAvatarFuncionario(nome || "A", coresAvatar.length);

  return (
    <SheetHeader className="border-b border-[var(--border-subtle)] pb-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg ${coresAvatar[indiceCor]}`}
        >
          {getIniciaisFuncionario(nome)}
        </div>
        <div className="min-w-0 flex-1">
          <SheetTitle className="mb-2 text-xl font-bold text-[var(--text-primary)]">Editar Colaborador</SheetTitle>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge ativo={funcionario?.ativo ?? false} />
            <Badge variant="secondary" className="font-medium">
              <Shield className="mr-1.5 h-3 w-3" />
              {getCargoLabelFuncionario(funcionario?.cargo || "")}
            </Badge>
          </div>
        </div>
      </div>
      <SheetDescription className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        Atualize as informações do colaborador. Campos marcados com * são obrigatórios.
      </SheetDescription>
    </SheetHeader>
  );
}
