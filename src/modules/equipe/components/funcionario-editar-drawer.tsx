"use client";

import { useEffect, useState } from "react";
import { Briefcase, Key, User } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DadosEdicao, Funcionario, UseEquipeModuleReturn } from "../types";
import { FuncionarioEditarDrawerFooter } from "./funcionario-editar-drawer-footer";
import {
  FuncionarioEditarDrawerAcessoTab,
  FuncionarioEditarDrawerDadosTab,
  FuncionarioEditarDrawerTrabalhoTab,
} from "./funcionario-editar-drawer-fields";
import { FuncionarioEditarDrawerHeader } from "./funcionario-editar-drawer-header";
import { criarDadosEdicaoFuncionario, validarDadosFuncionarioEdicao } from "./funcionario-editar-drawer.utils";

type FuncionarioEditarDrawerProps = {
  vm: UseEquipeModuleReturn;
  funcionario: Funcionario | null;
  aberto: boolean;
  onFechar: () => void;
};

export function FuncionarioEditarDrawer({ vm, funcionario, aberto, onFechar }: FuncionarioEditarDrawerProps) {
  const [dados, setDados] = useState<DadosEdicao | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mostrarMenuAcoes, setMostrarMenuAcoes] = useState(false);

  useEffect(() => {
    if (!aberto || !funcionario) {
      return;
    }

    const sincronizacao = setTimeout(() => {
      setDados(criarDadosEdicaoFuncionario(funcionario));
      setErros({});
      setMostrarMenuAcoes(false);
    }, 0);

    return () => clearTimeout(sincronizacao);
  }, [aberto, funcionario]);

  const aoMudar = (campo: keyof DadosEdicao, valor: string) => {
    if (!dados) {
      return;
    }

    setDados({ ...dados, [campo]: valor });
    setErros({});
  };

  const handleSalvar = async () => {
    if (!dados || !funcionario) {
      return;
    }

    const novosErros = validarDadosFuncionarioEdicao(dados);
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const ok = await vm.salvarEdicaoAtual(dados);
    if (ok) {
      onFechar();
    }
  };

  const handleInativar = () => {
    if (!funcionario) {
      return;
    }

    vm.abrirModalInativacao(funcionario);
    setMostrarMenuAcoes(false);
  };

  const handleResetarSenha = () => {
    setMostrarMenuAcoes(false);
  };

  const handleVerHistorico = () => {
    setMostrarMenuAcoes(false);
  };

  const salvando = vm.statusSalvamento.id === funcionario?.id && vm.statusSalvamento.estado === "saving";
  const mensagemErro = vm.statusSalvamento.id === funcionario?.id && vm.statusSalvamento.estado === "error" ? vm.statusSalvamento.mensagem : undefined;

  return (
    <Sheet open={aberto} onOpenChange={(proximoAberto) => (!proximoAberto ? onFechar() : undefined)}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto border-l-[var(--border-subtle)] bg-[var(--surface-elevated)]">
        <FuncionarioEditarDrawerHeader funcionario={funcionario} />

        <Tabs defaultValue="dados" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1">
            <TabsTrigger value="dados" className="gap-1.5 rounded-lg text-sm font-medium">
              <User className="h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="trabalho" className="gap-1.5 rounded-lg text-sm font-medium">
              <Briefcase className="h-4 w-4" />
              Trabalho
            </TabsTrigger>
            <TabsTrigger value="acesso" className="gap-1.5 rounded-lg text-sm font-medium">
              <Key className="h-4 w-4" />
              Acesso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <FuncionarioEditarDrawerDadosTab dados={dados} erros={erros} onMudar={aoMudar} />
          </TabsContent>

          <TabsContent value="trabalho">
            <FuncionarioEditarDrawerTrabalhoTab dados={dados} erros={erros} pdvs={vm.pdvs} onMudar={aoMudar} />
          </TabsContent>

          <TabsContent value="acesso">
            <FuncionarioEditarDrawerAcessoTab onResetarSenha={handleResetarSenha} onVerHistorico={handleVerHistorico} onInativar={handleInativar} />
          </TabsContent>
        </Tabs>

        <FuncionarioEditarDrawerFooter
          salvando={salvando}
          mostrarMenuAcoes={mostrarMenuAcoes}
          onToggleMenu={() => setMostrarMenuAcoes((atual) => !atual)}
          onSalvar={() => void handleSalvar()}
          onVerHistorico={handleVerHistorico}
          onResetarSenha={handleResetarSenha}
          onInativar={handleInativar}
          mensagemErro={mensagemErro}
        />
      </SheetContent>
    </Sheet>
  );
}
