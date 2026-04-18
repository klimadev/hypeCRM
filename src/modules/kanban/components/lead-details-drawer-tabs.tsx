"use client";

import { FileText, Link2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiLeadContato } from "@/lib/api/leads";
import type { Estagio, Funcionario, Lead, PendenciaDinamica } from "../types";
import { EmptyState } from "./empty-state";
import { NegocioDetailsTabContent } from "./lead-details-tab-content";
import { NegocioVinculosTab } from "./negocio-vinculos-tab";

type LeadDetailsDrawerTabsProps = {
  negocioSelecionado: Lead | null;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  estagios: Estagio[];
  funcionarios: Funcionario[];
  pendenciasNegocio: PendenciaDinamica[];
  salvando: boolean;
  erroDetalhesNegocio: string | null;
  setErroDetalhesNegocio: (erro: string | null) => void;
  onMudarNegocio: (negocioAtualizado: Lead) => void;
  onSalvar: () => Promise<void>;
  temAlteracoes: boolean;
  setTemAlteracoes: (value: boolean) => void;
  tabAtiva: string;
  setTabAtiva: (tab: string) => void;
  produtosDisponiveis: Array<{ id: string; nome: string; ativo: boolean }>;
  carregandoProdutosDisponiveis: boolean;
  leadsDisponiveis: ApiLeadContato[];
  carregandoLeadsDisponiveis: boolean;
  salvandoVinculos: boolean;
  erroVinculos: string | null;
  setErroVinculos: (erro: string | null) => void;
  onSalvarVinculos: (leadIds: string[]) => Promise<void>;
};

export function LeadDetailsDrawerTabs(props: LeadDetailsDrawerTabsProps) {
  const {
    negocioSelecionado,
    perfil,
    estagios,
    funcionarios,
    pendenciasNegocio,
    salvando,
    erroDetalhesNegocio,
    setErroDetalhesNegocio,
    onMudarNegocio,
    onSalvar,
    temAlteracoes,
    setTemAlteracoes,
    tabAtiva,
    setTabAtiva,
    produtosDisponiveis,
    carregandoProdutosDisponiveis,
    leadsDisponiveis,
    carregandoLeadsDisponiveis,
    salvandoVinculos,
    erroVinculos,
    setErroVinculos,
    onSalvarVinculos,
  } = props;

  const podeRenderizarConteudo = Boolean(negocioSelecionado?.id && negocioSelecionado?.nome);

  if (!podeRenderizarConteudo || !negocioSelecionado) {
    return (
      <EmptyState
        icone={<Loader2 className="h-6 w-6 animate-spin" />}
        titulo="Preparando detalhes do negócio"
        descricao="Os dados do drawer ainda não ficaram prontos para exibição."
      />
    );
  }

  return (
    <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-2">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-9">
          <TabsTrigger
            value="detalhes"
            className="rounded-lg text-[12px] font-medium text-[var(--text-tertiary)] transition-colors duration-150 data-[state=active]:bg-[var(--surface-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none border border-transparent data-[state=active]:border-[var(--border-subtle)]"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger
            value="vinculos"
            className="rounded-lg text-[12px] font-medium text-[var(--text-tertiary)] transition-colors duration-150 data-[state=active]:bg-[var(--surface-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none border border-transparent data-[state=active]:border-[var(--border-subtle)]"
          >
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            Vínculos
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="detalhes" className="m-0 flex-1 overflow-y-auto">
        <NegocioDetailsTabContent
          negocioSelecionado={negocioSelecionado}
          perfil={perfil}
          estagios={estagios}
          funcionarios={funcionarios}
          pendenciasNegocio={pendenciasNegocio}
          salvando={salvando}
          erroDetalhesNegocio={erroDetalhesNegocio}
          setErroDetalhesNegocio={setErroDetalhesNegocio}
          onMudarNegocio={(negocioAtualizado) => {
            onMudarNegocio(negocioAtualizado);
            setTemAlteracoes(true);
          }}
          onSalvar={onSalvar}
          temAlteracoes={temAlteracoes}
          setTemAlteracoes={setTemAlteracoes}
          produtosDisponiveis={produtosDisponiveis}
          carregandoProdutosDisponiveis={carregandoProdutosDisponiveis}
        />
      </TabsContent>

      <TabsContent value="vinculos" className="m-0 flex-1 overflow-y-auto">
        <NegocioVinculosTab
          key={negocioSelecionado.id}
          negocioSelecionado={negocioSelecionado}
          leadsDisponiveis={leadsDisponiveis}
          carregandoLeadsDisponiveis={carregandoLeadsDisponiveis}
          salvandoVinculos={salvandoVinculos}
          erroVinculos={erroVinculos}
          setErroVinculos={setErroVinculos}
          onSalvarVinculos={onSalvarVinculos}
        />
      </TabsContent>
    </Tabs>
  );
}
