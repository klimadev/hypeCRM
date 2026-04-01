"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Building2, CheckCircle2, Loader2, Pencil, Plus, RefreshCw, Save, Search, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UseEquipeModuleReturn } from "../types";
import { Avatar } from "./shared/avatar";
import { StatusBadge } from "./shared/status-badge";

type PdvManagementPanelProps = {
  vm: UseEquipeModuleReturn;
  drawerNovoPdvAberto: boolean;
  setDrawerNovoPdvAberto: (aberto: boolean) => void;
};

type ColaboradorDrawer = {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  ativo: boolean;
  pdv?: {
    id: string;
    nome: string;
  };
};

export function PdvManagementPanel({ vm, drawerNovoPdvAberto, setDrawerNovoPdvAberto }: PdvManagementPanelProps) {
  const VALOR_SEM_INSTANCIA = "__SEM_INSTANCIA__";
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [instanciaEdicao, setInstanciaEdicao] = useState<string>("");
  const [drawerColaboradoresAberto, setDrawerColaboradoresAberto] = useState(false);
  const [pdvColaboradoresId, setPdvColaboradoresId] = useState<string | null>(null);
  const [buscaColaboradoresDrawer, setBuscaColaboradoresDrawer] = useState("");
  const [ordenacaoDrawer, setOrdenacaoDrawer] = useState<"nome" | "email" | "cargo" | "status">("nome");
  const [direcaoDrawer, setDirecaoDrawer] = useState<"asc" | "desc">("asc");
  const [nomeNovoPdv, setNomeNovoPdv] = useState("");
  const [editandoFuncionarioNoDrawer, setEditandoFuncionarioNoDrawer] = useState<string | null>(null);
  const [novoColaboradorExpandido, setNovoColaboradorExpandido] = useState(false);
  const [cadastroSucesso, setCadastroSucesso] = useState(false);
  const [errosLocal, setErrosLocal] = useState<{ nome?: string; email?: string; senha?: string }>({});
  const [dadosEdicaoFuncionario, setDadosEdicaoFuncionario] = useState<{ nome: string; email: string; cargo: string; id_pdv: string } | null>(null);
  const [errosEdicao, setErrosEdicao] = useState<Record<string, string>>({});
  const [trocandoInstanciaPdvId, setTrocandoInstanciaPdvId] = useState<string | null>(null);
  const [novaInstanciaId, setNovaInstanciaId] = useState("");
  const [salvandoInstancia, setSalvandoInstancia] = useState(false);
  const totalPdvsSemInstancia = useMemo(() => vm.pdvs.filter((pdv) => !pdv.id_whatsapp_instancia).length, [vm.pdvs]);

  const pdvSelecionadoNoDrawer = useMemo(() => vm.pdvs.find((pdv) => pdv.id === pdvColaboradoresId) ?? null, [vm.pdvs, pdvColaboradoresId]);
  const colaboradoresDrawer = useMemo<ColaboradorDrawer[]>(() => {
    const termo = buscaColaboradoresDrawer.trim().toLowerCase();
    const base = pdvSelecionadoNoDrawer?.funcionarios ?? [];

    const enriquecidos: ColaboradorDrawer[] = base.map((funcionarioResumo) => ({
      id: funcionarioResumo.id,
      nome: funcionarioResumo.nome,
      cargo: funcionarioResumo.cargo,
      email: funcionarioResumo.email ?? "-",
      ativo: funcionarioResumo.ativo ?? true,
      pdv: pdvSelecionadoNoDrawer
        ? {
            id: pdvSelecionadoNoDrawer.id,
            nome: pdvSelecionadoNoDrawer.nome,
          }
        : undefined,
    }));

    if (!termo) {
      return enriquecidos;
    }

    return enriquecidos.filter((funcionario) => {
      const alvo = `${funcionario.nome} ${funcionario.email} ${funcionario.cargo}`.toLowerCase();
      return alvo.includes(termo);
    });
  }, [buscaColaboradoresDrawer, pdvSelecionadoNoDrawer]);
  const colaboradoresDrawerOrdenados = useMemo(() => {
    const lista = [...colaboradoresDrawer];
    lista.sort((a, b) => {
      const valorA = ordenacaoDrawer === "status" ? (a.ativo ? "ATIVO" : "INATIVO") : (a[ordenacaoDrawer] ?? "");
      const valorB = ordenacaoDrawer === "status" ? (b.ativo ? "ATIVO" : "INATIVO") : (b[ordenacaoDrawer] ?? "");
      const comparacao = String(valorA).localeCompare(String(valorB), "pt-BR", { sensitivity: "base" });
      return direcaoDrawer === "asc" ? comparacao : -comparacao;
    });
    return lista;
  }, [colaboradoresDrawer, direcaoDrawer, ordenacaoDrawer]);
  const todosSelecionadosNoDrawer =
    colaboradoresDrawerOrdenados.length > 0 &&
    colaboradoresDrawerOrdenados.every((funcionario) => vm.idsSelecionados.includes(funcionario.id));

  function alternarOrdenacaoDrawer(campo: "nome" | "email" | "cargo" | "status") {
    if (ordenacaoDrawer === campo) {
      setDirecaoDrawer((atual) => (atual === "asc" ? "desc" : "asc"));
      return;
    }
    setOrdenacaoDrawer(campo);
    setDirecaoDrawer("asc");
  }

  function iconeOrdenacaoDrawer(campo: "nome" | "email" | "cargo" | "status") {
    if (ordenacaoDrawer !== campo) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
    }
    return direcaoDrawer === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-[var(--text-primary)]" /> : <ArrowDown className="h-3.5 w-3.5 text-[var(--text-primary)]" />;
  }

  const aoCriarPdv = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const nome = nomeNovoPdv.trim();
    const criou = await vm.criarPdv(nome);

    if (criou) {
      setNomeNovoPdv("");
      setDrawerNovoPdvAberto(false);
    }
  };

  const iniciarEdicaoPdv = (id: string, nome: string, id_whatsapp_instancia?: string | null) => {
    vm.setPdvEmEdicao({ id, nome, id_whatsapp_instancia });
    setNomeEdicao(nome);
    setInstanciaEdicao(id_whatsapp_instancia ?? "");
  };

  const cancelarEdicaoPdv = () => {
    vm.setPdvEmEdicao(null);
    setNomeEdicao("");
    setInstanciaEdicao("");
  };

  const salvarEdicaoPdv = async () => {
    if (!vm.pdvEmEdicao) {
      return;
    }

    const ok = await vm.editarPdv(vm.pdvEmEdicao.id, nomeEdicao, instanciaEdicao || null);
    if (ok) {
      cancelarEdicaoPdv();
    }
  };

  const confirmarExclusaoPdv = async () => {
    if (!vm.pdvParaExcluir) {
      return;
    }

    await vm.excluirPdv(vm.pdvParaExcluir.id);
    vm.setPdvParaExcluir(null);
  };

  const iniciarTrocaInstancia = (pdvId: string, instanciaAtualId?: string | null) => {
    setTrocandoInstanciaPdvId(pdvId);
    setNovaInstanciaId(instanciaAtualId ?? "");
  };

  const cancelarTrocaInstancia = () => {
    setTrocandoInstanciaPdvId(null);
    setNovaInstanciaId("");
  };

  const salvarTrocaInstancia = async () => {
    if (!trocandoInstanciaPdvId) return;

    setSalvandoInstancia(true);
    const ok = await vm.trocarInstanciaPdv(trocandoInstanciaPdvId, novaInstanciaId || null);
    setSalvandoInstancia(false);
    if (ok) {
      cancelarTrocaInstancia();
    }
  };

  const abrirDrawerColaboradores = (id: string) => {
    setPdvColaboradoresId(id);
    setBuscaColaboradoresDrawer("");
    setNovoColaboradorExpandido(false);
    setCadastroSucesso(false);
    setErrosLocal({});
    setDrawerColaboradoresAberto(true);
  };

  const handleSubmitCadastroRapido = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErrosLocal({});
    setCadastroSucesso(false);

    const dados = new FormData(evento.currentTarget);
    const nome = (dados.get("nome") as string)?.trim() ?? "";
    const email = (dados.get("email") as string)?.trim() ?? "";
    const senha = (dados.get("senha") as string) ?? "";

    const novosErros: { nome?: string; email?: string; senha?: string } = {};
    if (!nome || nome.length < 2) {
      novosErros.nome = "Nome deve ter ao menos 2 caracteres";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      novosErros.email = "E-mail inválido";
    }
    if (!senha || senha.length < 4) {
      novosErros.senha = "Senha deve ter ao menos 4 caracteres";
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosLocal(novosErros);
      return;
    }

    const sucesso = await vm.adicionarFuncionario(evento);
    if (sucesso) {
      setCadastroSucesso(true);
      setNovoColaboradorExpandido(false);
      setTimeout(() => setCadastroSucesso(false), 3000);
    }
  };

  const iniciarEdicaoFuncionarioDrawer = (id: string) => {
    const func = vm.funcionarios.find((item) => item.id === id) ?? colaboradoresDrawer.find((item) => item.id === id);
    if (!func) {
      return;
    }
    setDadosEdicaoFuncionario({
      nome: func.nome,
      email: func.email,
      cargo: func.cargo,
      id_pdv: func.pdv?.id ?? "",
    });
    setErrosEdicao({});
    setEditandoFuncionarioNoDrawer(id);
  };

  const cancelarEdicaoFuncionarioDrawer = () => {
    setEditandoFuncionarioNoDrawer(null);
    setDadosEdicaoFuncionario(null);
    setErrosEdicao({});
  };

  const salvarEdicaoFuncionarioDrawer = async () => {
    if (!dadosEdicaoFuncionario || !editandoFuncionarioNoDrawer) return;

    const novosErros: Record<string, string> = {};
    if (!dadosEdicaoFuncionario.nome.trim() || dadosEdicaoFuncionario.nome.trim().length < 2) {
      novosErros.nome = "Nome deve ter ao menos 2 caracteres.";
    }
    if (!dadosEdicaoFuncionario.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosEdicaoFuncionario.email.trim())) {
      novosErros.email = "E-mail inválido.";
    }
    if (!dadosEdicaoFuncionario.id_pdv.trim()) {
      novosErros.id_pdv = "PDV obrigatório.";
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosEdicao(novosErros);
      return;
    }

    const func = vm.funcionarios.find((f) => f.id === editandoFuncionarioNoDrawer);
    if (!func) return;

    vm.iniciarEdicao(func);
    const ok = await vm.salvarEdicaoAtual(dadosEdicaoFuncionario);
    if (ok) {
      cancelarEdicaoFuncionarioDrawer();
    }
  };

  if (vm.carregandoPdvs) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-6 text-sm text-[var(--text-secondary)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando gestao de PDVs...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">PDVs e operacao</p>
          <p className="text-sm text-[var(--text-secondary)]">Clique no card para abrir a gestao da equipe do PDV no drawer lateral.</p>
        </div>
        {totalPdvsSemInstancia > 0 ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.08)] px-3 py-2 text-sm text-[var(--warning)]">
            <AlertCircle className="h-4 w-4" />
            {totalPdvsSemInstancia} PDV(s) sem instancia WhatsApp vinculada
          </div>
        ) : null}
      </div>

      {vm.erroGestaoPdvs ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          <AlertCircle className="h-4 w-4" />
          {vm.erroGestaoPdvs}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {vm.pdvs.map((pdv) => {
          const emEdicao = vm.pdvEmEdicao?.id === pdv.id;
          const salvando = vm.salvandoPdvId === pdv.id;
          const temColaboradores = (pdv.funcionarios ?? []).length > 0;
          const colaboradoresPreview = pdv.funcionarios?.slice(0, 4) ?? [];
          const excedente = Math.max(0, (pdv.funcionarios?.length ?? 0) - 4);

          return (
            <article
              key={pdv.id}
              className={cn(
                "group relative cursor-pointer space-y-3 overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface-elevated)] p-4 transition-all duration-200",
                "hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
                "active:scale-[0.99]",
                !pdv.id_whatsapp_instancia
                  ? "border-[color:rgba(245,158,11,0.28)] bg-[linear-gradient(135deg,rgba(245,158,11,0.1),rgba(255,255,255,0.02))] shadow-[0_10px_30px_-20px_rgba(245,158,11,0.45)]"
                  : "border-[var(--border-subtle)] shadow-[var(--shadow-sm)]",
              )}
            >
              {/* Indicador visual de clique - ícone animado */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-100/70 blur-2xl" />
              <div className="pointer-events-none absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:rgba(255,255,255,0.06)]">
                  <svg className="h-3 w-3 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="flex items-start justify-between">
                {emEdicao ? (
                  <div className="flex flex-1 flex-col gap-2">
                    <Input
                      value={nomeEdicao}
                      onChange={(evento) => setNomeEdicao(evento.target.value)}
                      disabled={salvando}
                        className="h-9 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                      placeholder="Nome do PDV"
                    />
                    <Select
                      value={instanciaEdicao || VALOR_SEM_INSTANCIA}
                      onValueChange={(valor) => setInstanciaEdicao(valor === VALOR_SEM_INSTANCIA ? "" : valor)}
                    >
                      <SelectTrigger className="h-9 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                        <SelectValue placeholder="Selecione uma instância WhatsApp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VALOR_SEM_INSTANCIA}>Nenhuma</SelectItem>
                        {vm.instancias.map((instancia) => (
                          <SelectItem key={instancia.id} value={instancia.id}>
                            {instancia.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-[var(--radius-control)]"
                        disabled={salvando}
                        onClick={() => void salvarEdicaoPdv()}
                      >
                        {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="rounded-[var(--radius-control)]" disabled={salvando} onClick={cancelarEdicaoPdv}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="flex-1 text-left group/btn"
                      onClick={() => abrirDrawerColaboradores(pdv.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                           <h3 className="text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 group-hover/btn:text-[var(--brand)]">{pdv.nome}</h3>
                          {temColaboradores && (
                            <div className="mt-2 flex items-center">
                              <div className="flex -space-x-2">
                                {colaboradoresPreview.map((func) => (
                                  <Avatar key={func.id} nome={func.nome} tamanho="sm" />
                                ))}
                                {excedente > 0 && (
                                   <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.05)] text-xs font-medium text-[var(--text-secondary)]">
                                    +{excedente}
                                  </div>
                                )}
                              </div>
                               <span className="ml-2 text-xs text-[var(--text-secondary)]">{pdv.funcionarios?.length} colaborador(es)</span>
                            </div>
                          )}
                           {!temColaboradores && <p className="mt-1 text-xs text-[var(--text-tertiary)]">Sem colaboradores</p>}
                        </div>
                        <div className="flex items-center gap-1">
                           <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />
                        </div>
                      </div>
                      {pdv.id_whatsapp_instancia ? (
                          <div className="mt-2 flex items-center gap-2">
                            <p className="text-xs text-[var(--success)]">WhatsApp: {pdv.whatsapp_instancia?.nome ?? "Vinculada"}</p>
                            {vm.podeGerenciarEmpresa && trocandoInstanciaPdvId !== pdv.id && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full bg-[color:rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] transition-colors hover:bg-[color:rgba(255,255,255,0.1)] hover:text-[var(--text-primary)]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  iniciarTrocaInstancia(pdv.id, pdv.id_whatsapp_instancia);
                                }}
                              >
                                <RefreshCw className="h-2.5 w-2.5" />
                                Trocar
                              </button>
                            )}
                          </div>
                       ) : (
                          <div className="mt-2 flex items-start gap-2 rounded-lg border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.08)] px-2.5 py-2 text-xs text-[var(--warning)]">
                           <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                           <span>Sem instância WhatsApp vinculada. Este PDV será ignorado na sincronização automática.</span>
                           {vm.podeGerenciarEmpresa && trocandoInstanciaPdvId !== pdv.id && (
                             <button
                               type="button"
                               className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-[color:rgba(245,158,11,0.16)] px-2 py-0.5 text-[10px] text-[var(--warning)] transition-colors hover:bg-[color:rgba(245,158,11,0.24)]"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 iniciarTrocaInstancia(pdv.id, null);
                               }}
                             >
                               <RefreshCw className="h-2.5 w-2.5" />
                               Vincular
                             </button>
                           )}
                         </div>
                       )}
                       {trocandoInstanciaPdvId === pdv.id && (
                         <div
                           className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-2"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <Select
                             value={novaInstanciaId || VALOR_SEM_INSTANCIA}
                             onValueChange={(valor) => setNovaInstanciaId(valor === VALOR_SEM_INSTANCIA ? "" : valor)}
                           >
                             <SelectTrigger className="h-8 flex-1 rounded-lg text-xs">
                               <SelectValue placeholder="Instância" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value={VALOR_SEM_INSTANCIA}>Nenhuma</SelectItem>
                               {vm.instancias.map((instancia) => (
                                 <SelectItem key={instancia.id} value={instancia.id}>
                                   {instancia.nome}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <Button
                             type="button"
                             size="sm"
                             className="h-8 rounded-lg"
                             disabled={salvandoInstancia}
                             onClick={() => void salvarTrocaInstancia()}
                           >
                             {salvandoInstancia ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                           </Button>
                           <Button
                             type="button"
                             size="sm"
                             variant="outline"
                             className="h-8 rounded-lg"
                             disabled={salvandoInstancia}
                             onClick={cancelarTrocaInstancia}
                           >
                             <ArrowLeft className="h-3 w-3" />
                           </Button>
                         </div>
                       )}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Dialog
        open={Boolean(vm.pdvParaExcluir)}
        onOpenChange={(aberto) => {
          if (!aberto) {
            vm.setPdvParaExcluir(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir PDV</DialogTitle>
            <DialogDescription>
              Esta acao remove o PDV permanentemente. Nao e possivel desfazer.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-[var(--text-secondary)]">
            Confirma a exclusao do PDV <span className="font-semibold">{vm.pdvParaExcluir?.nome}</span>?
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => vm.setPdvParaExcluir(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-[var(--danger)] hover:bg-[var(--danger)]/90"
              onClick={() => void confirmarExclusaoPdv()}
              disabled={!vm.pdvParaExcluir || vm.excluindoPdvId === vm.pdvParaExcluir.id}
            >
              {vm.pdvParaExcluir && vm.excluindoPdvId === vm.pdvParaExcluir.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={drawerNovoPdvAberto} onOpenChange={setDrawerNovoPdvAberto}>
        <SheetContent side="right" className="w-full max-w-md bg-[var(--surface-elevated)]">
          <SheetHeader>
            <SheetTitle className="text-[var(--text-primary)]">Novo PDV</SheetTitle>
            <SheetDescription className="text-[var(--text-secondary)]">Crie um novo ponto de venda para distribuir equipe e operacao.</SheetDescription>
          </SheetHeader>

          <form onSubmit={aoCriarPdv} className="mt-6 space-y-4 px-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Nome do PDV</label>
              <Input
                name="nome"
                placeholder="Ex.: Centro Comercial"
                required
                value={nomeNovoPdv}
                onChange={(evento) => setNomeNovoPdv(evento.target.value)}
                disabled={vm.criandoPdv}
                className="h-10"
              />
            </div>

            <SheetFooter className="flex-col gap-2 sm:flex-col">
              <Button type="submit" disabled={vm.criandoPdv || !nomeNovoPdv.trim()} className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white font-medium">
                {vm.criandoPdv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {vm.criandoPdv ? "Criando PDV..." : "Criar PDV"}
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-xl" disabled={vm.criandoPdv} onClick={() => setDrawerNovoPdvAberto(false)}>
                Cancelar
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={drawerColaboradoresAberto}
        onOpenChange={(aberto) => {
          setDrawerColaboradoresAberto(aberto);
          if (!aberto) {
            setPdvColaboradoresId(null);
            setEditandoFuncionarioNoDrawer(null);
            setNovoColaboradorExpandido(false);
            setCadastroSucesso(false);
            setErrosLocal({});
            setTrocandoInstanciaPdvId(null);
            setNovaInstanciaId("");
          }
        }}
      >
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto bg-[var(--surface-elevated)]">
          {editandoFuncionarioNoDrawer ? (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 rounded-lg p-0" onClick={cancelarEdicaoFuncionarioDrawer}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <SheetTitle className="text-[var(--text-primary)]">Editar colaborador</SheetTitle>
                    <SheetDescription className="text-[var(--text-secondary)]">Altere os dados do colaborador.</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4 px-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Nome</label>
                  <Input
                    value={dadosEdicaoFuncionario?.nome ?? ""}
                    onChange={(e) => setDadosEdicaoFuncionario((prev) => prev ? { ...prev, nome: e.target.value } : null)}
                    placeholder="Nome completo"
                    className={errosEdicao.nome ? "border-[var(--danger)]" : ""}
                  />
                  {errosEdicao.nome && <p className="text-xs text-[var(--danger)]">{errosEdicao.nome}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">E-mail</label>
                  <Input
                    type="email"
                    value={dadosEdicaoFuncionario?.email ?? ""}
                    onChange={(e) => setDadosEdicaoFuncionario((prev) => prev ? { ...prev, email: e.target.value } : null)}
                    placeholder="email@exemplo.com"
                    className={errosEdicao.email ? "border-[var(--danger)]" : ""}
                  />
                  {errosEdicao.email && <p className="text-xs text-[var(--danger)]">{errosEdicao.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Cargo</label>
                  <Select
                    value={dadosEdicaoFuncionario?.cargo ?? ""}
                    onValueChange={(valor) => setDadosEdicaoFuncionario((prev) => prev ? { ...prev, cargo: valor } : null)}
                  >
                    <SelectTrigger className={errosEdicao.cargo ? "border-[var(--danger)]" : ""}>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                      <SelectItem value="GERENTE">Gerente</SelectItem>
                      <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {errosEdicao.cargo && <p className="text-xs text-[var(--danger)]">{errosEdicao.cargo}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">PDV</label>
                  <Select
                    value={dadosEdicaoFuncionario?.id_pdv ?? ""}
                    onValueChange={(valor) => setDadosEdicaoFuncionario((prev) => prev ? { ...prev, id_pdv: valor } : null)}
                  >
                    <SelectTrigger className={errosEdicao.id_pdv ? "border-[var(--danger)]" : ""}>
                      <SelectValue placeholder="Selecione o PDV" />
                    </SelectTrigger>
                    <SelectContent>
                      {vm.pdvs.map((pdv) => (
                        <SelectItem key={pdv.id} value={pdv.id}>
                          {pdv.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errosEdicao.id_pdv && <p className="text-xs text-[var(--danger)]">{errosEdicao.id_pdv}</p>}
                </div>

                {vm.statusSalvamento.id === editandoFuncionarioNoDrawer && vm.statusSalvamento.estado === "error" && (
                  <div className="rounded-lg bg-[color:rgba(244,63,94,0.08)] p-3 text-sm text-[var(--danger)]">{vm.statusSalvamento.mensagem}</div>
                )}
              </div>

              <SheetFooter className="mt-6 px-4">
                <Button
                  className="w-full bg-[var(--brand)] hover:bg-[var(--brand-strong)]"
                  onClick={salvarEdicaoFuncionarioDrawer}
                  disabled={vm.statusSalvamento.id === editandoFuncionarioNoDrawer && vm.statusSalvamento.estado === "saving"}
                >
                  {vm.statusSalvamento.id === editandoFuncionarioNoDrawer && vm.statusSalvamento.estado === "saving" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {vm.statusSalvamento.id === editandoFuncionarioNoDrawer && vm.statusSalvamento.estado === "saving" ? "Salvando..." : "Salvar alterações"}
                </Button>
                <Button variant="outline" className="w-full" onClick={cancelarEdicaoFuncionarioDrawer}>
                  Cancelar
                </Button>
              </SheetFooter>
            </>
          ) : (
            <div className="mt-6 px-4">
              <SheetHeader className="px-0">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-[var(--text-primary)]">{pdvSelecionadoNoDrawer ? `Colaboradores - ${pdvSelecionadoNoDrawer.nome}` : "Colaboradores do PDV"}</SheetTitle>
                    <SheetDescription className="text-[var(--text-secondary)]">Gestao completa dos colaboradores deste PDV no mesmo fluxo da tabela principal.</SheetDescription>
                  </div>
                  {pdvSelecionadoNoDrawer && vm.podeGerenciarEmpresa && (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-[var(--text-secondary)]"
                        onClick={() => iniciarEdicaoPdv(pdvSelecionadoNoDrawer.id, pdvSelecionadoNoDrawer.nome, pdvSelecionadoNoDrawer.id_whatsapp_instancia)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Editar PDV
                      </Button>
                      {pdvSelecionadoNoDrawer.funcionarios?.length === 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.08)]"
                          onClick={() => vm.setPdvParaExcluir({ id: pdvSelecionadoNoDrawer.id, nome: pdvSelecionadoNoDrawer.nome })}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              </SheetHeader>
              <div className="mb-4 mt-6 space-y-3">
              {!pdvSelecionadoNoDrawer?.id_whatsapp_instancia ? (
                <div className="rounded-xl border border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.08)] px-3 py-3 text-sm text-[var(--warning)]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">PDV fora da sincronização automática</p>
                      <p className="text-xs text-[var(--warning)]">Sem instância WhatsApp vinculada.</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {/* Seção de instância WhatsApp */}
              {vm.podeGerenciarEmpresa && pdvSelecionadoNoDrawer && (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        pdvSelecionadoNoDrawer.id_whatsapp_instancia
                          ? "bg-[color:rgba(16,185,129,0.12)]"
                          : "bg-[color:rgba(245,158,11,0.12)]"
                      )}>
                        {pdvSelecionadoNoDrawer.id_whatsapp_instancia ? (
                          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-[var(--warning)]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">WhatsApp vinculado</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {pdvSelecionadoNoDrawer.whatsapp_instancia?.nome ?? "Nenhuma instância selecionada"}
                        </p>
                      </div>
                    </div>
                    {trocandoInstanciaPdvId !== pdvSelecionadoNoDrawer.id ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg text-[var(--text-secondary)]"
                        onClick={() => iniciarTrocaInstancia(pdvSelecionadoNoDrawer.id, pdvSelecionadoNoDrawer.id_whatsapp_instancia)}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        {pdvSelecionadoNoDrawer.id_whatsapp_instancia ? "Trocar" : "Vincular"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg"
                        onClick={cancelarTrocaInstancia}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {trocandoInstanciaPdvId === pdvSelecionadoNoDrawer.id && (
                    <div className="mt-3 space-y-2">
                      <Select
                        value={novaInstanciaId || VALOR_SEM_INSTANCIA}
                        onValueChange={(valor) => setNovaInstanciaId(valor === VALOR_SEM_INSTANCIA ? "" : valor)}
                      >
                        <SelectTrigger className="h-10 rounded-lg bg-[var(--surface-elevated)]">
                          <SelectValue placeholder="Selecione a instância WhatsApp" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={VALOR_SEM_INSTANCIA}>Nenhuma</SelectItem>
                          {vm.instancias.map((instancia) => (
                            <SelectItem key={instancia.id} value={instancia.id}>
                              {instancia.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        className="h-10 w-full rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] font-medium"
                        disabled={salvandoInstancia}
                        onClick={() => void salvarTrocaInstancia()}
                      >
                        {salvandoInstancia ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Confirmar troca"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {/* Seção de Adicionar Novo Colaborador */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:rgba(16,185,129,0.12)]">
                      <UserPlus className="h-5 w-5 text-[var(--success)]" />
                    </div>
                    <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Adicionar novo colaborador</p>
                      <p className="text-xs text-[var(--text-secondary)]">Cadastrar em <span className="font-medium text-[var(--success)]">{pdvSelecionadoNoDrawer?.nome}</span></p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      "h-9 rounded-lg px-4 font-medium",
                      novoColaboradorExpandido 
                        ? "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.06)]" 
                        : "bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                    )}
                    onClick={() => {
                      vm.setCargoSelecionado("COLABORADOR");
                      vm.setPdvSelecionado(pdvSelecionadoNoDrawer?.id ?? "");
                      setNovoColaboradorExpandido((atual) => !atual);
                    }}
                  >
                    {novoColaboradorExpandido ? "Cancelar" : "Novo"}
                  </Button>
                </div>

                {novoColaboradorExpandido && (
                  <form className="mt-4 space-y-3" onSubmit={handleSubmitCadastroRapido}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Nome</label>
                        <Input 
                          name="nome" 
                          placeholder="Nome completo" 
                          required 
                          className={cn(
                            "h-10 rounded-lg bg-[var(--surface-elevated)]",
                            errosLocal.nome ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : "border-[var(--border-subtle)] focus:border-[var(--border-focus)]"
                          )} 
                        />
                        {errosLocal.nome && (
                          <p className="mt-1 text-xs text-[var(--danger)]">{errosLocal.nome}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Cargo</label>
                        <Select name="cargo" defaultValue="COLABORADOR">
                          <SelectTrigger className="h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                            <SelectItem value="GERENTE">Gerente</SelectItem>
                            <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">E-mail</label>
                      <Input 
                        name="email" 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        required 
                        className={cn(
                          "h-10 rounded-lg bg-[var(--surface-elevated)]",
                          errosLocal.email ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : "border-[var(--border-subtle)] focus:border-[var(--border-focus)]"
                        )} 
                      />
                      {errosLocal.email && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{errosLocal.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Senha temporaria</label>
                      <Input 
                        name="senha" 
                        type="password" 
                        placeholder="Minimo 4 caracteres" 
                        required 
                        className={cn(
                          "h-10 rounded-lg bg-[var(--surface-elevated)]",
                          errosLocal.senha ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : "border-[var(--border-subtle)] focus:border-[var(--border-focus)]"
                        )} 
                      />
                      {errosLocal.senha && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{errosLocal.senha}</p>
                      )}
                    </div>
                    <input type="hidden" name="id_pdv" value={pdvSelecionadoNoDrawer?.id ?? ""} />
                    {vm.erroCadastro ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[color:rgba(244,63,94,0.08)] border border-[color:rgba(244,63,94,0.2)] px-3 py-2">
                        <AlertCircle className="h-4 w-4 text-[var(--danger)]" />
                        <p className="text-sm text-[var(--danger)]">{vm.erroCadastro}</p>
                      </div>
                    ) : null}
                    <Button 
                      type="submit" 
                      className="h-10 w-full rounded-lg bg-[var(--success)] text-white hover:bg-[var(--success)]/90 font-medium" 
                      disabled={vm.carregandoCadastro}
                    >
                      {vm.carregandoCadastro ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Cadastrar colaborador
                        </>
                      )}
                    </Button>
                  </form>
                )}

              {cadastroSucesso && (
                <div className="flex items-center gap-2 rounded-xl border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.08)] px-3 py-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:rgba(16,185,129,0.12)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--success)]">Colaborador cadastrado!</p>
                    <p className="text-[10px] text-[var(--success)]">Atualizando lista automaticamente...</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Total</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{pdvSelecionadoNoDrawer?.funcionarios?.length ?? 0} colaborador(es)</p>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  value={buscaColaboradoresDrawer}
                  onChange={(evento) => setBuscaColaboradoresDrawer(evento.target.value)}
                  placeholder="Buscar por nome, email ou cargo"
                  className="pl-9"
                />
              </div>

              {vm.podeExecutarAcoesLote ? (
                <div className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Acoes em lote no PDV</p>
                    <p className="text-xs text-[var(--text-secondary)]">{vm.idsSelecionados.length} selecionado(s)</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <Select value={vm.acaoLote} onValueChange={(valor) => vm.setAcaoLote(valor as "ATIVAR" | "INATIVAR" | "ALTERAR_CARGO" | "ALTERAR_PDV")}>
                      <SelectTrigger className="h-9 rounded-lg bg-[var(--surface)]">
                        <SelectValue placeholder="Acao" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVAR">Ativar</SelectItem>
                        <SelectItem value="INATIVAR">Inativar</SelectItem>
                        <SelectItem value="ALTERAR_CARGO">Mudar cargo</SelectItem>
                        <SelectItem value="ALTERAR_PDV">Mudar PDV</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" className="rounded-lg bg-[var(--surface-elevated)] text-white hover:bg-[var(--border-strong)]" disabled={vm.executandoLote || vm.idsSelecionados.length === 0} onClick={() => void vm.executarAcaoLote()}>
                      {vm.executandoLote ? "Processando..." : "Aplicar"}
                    </Button>
                  </div>
                  {vm.acaoLote === "ALTERAR_CARGO" ? (
                    <Select value={vm.cargoLote} onValueChange={vm.setCargoLote}>
                      <SelectTrigger className="h-9 rounded-lg bg-[var(--surface)]">
                        <SelectValue placeholder="Novo cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLABORADOR">COLABORADOR</SelectItem>
                        <SelectItem value="GERENTE">GERENTE</SelectItem>
                        <SelectItem value="ADMINISTRADOR">ADMINISTRADOR</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                  {vm.acaoLote === "ALTERAR_PDV" ? (
                    <Select value={vm.pdvLote} onValueChange={vm.setPdvLote}>
                      <SelectTrigger className="h-9 rounded-lg bg-[var(--surface)]">
                        <SelectValue placeholder="Novo PDV" />
                      </SelectTrigger>
                      <SelectContent>
                        {vm.pdvs.map((pdv) => (
                          <SelectItem key={pdv.id} value={pdv.id}>
                            {pdv.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              ) : null}
            </div>

              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2">
              {vm.podeExecutarAcoesLote ? (
                <label className="mr-1 flex items-center gap-2 rounded-lg bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={todosSelecionadosNoDrawer}
                    onChange={(evento) => {
                      colaboradoresDrawerOrdenados.forEach((funcionario) => vm.alternarSelecao(funcionario.id, evento.target.checked));
                    }}
                    className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--text-secondary)] focus:ring-[var(--focus-ring)]"
                  />
                  Selecionar todos
                </label>
              ) : null}
              <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => alternarOrdenacaoDrawer("nome")}>
                Nome {iconeOrdenacaoDrawer("nome")}
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => alternarOrdenacaoDrawer("email")}>
                Email {iconeOrdenacaoDrawer("email")}
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => alternarOrdenacaoDrawer("cargo")}>
                Cargo {iconeOrdenacaoDrawer("cargo")}
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => alternarOrdenacaoDrawer("status")}>
                Status {iconeOrdenacaoDrawer("status")}
              </Button>
            </div>

            {colaboradoresDrawerOrdenados.length === 0 ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">Nenhum colaborador ativo neste PDV.</div>
            ) : (
              <ul className="space-y-2">
                {colaboradoresDrawerOrdenados.map((funcionario) => (
                  <li key={funcionario.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <Avatar nome={funcionario.nome} tamanho="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{funcionario.nome}</p>
                          <p className="truncate text-xs text-[var(--text-secondary)]">{funcionario.email}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-secondary)]">{funcionario.cargo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {vm.podeExecutarAcoesLote ? (
                          <input
                            type="checkbox"
                            checked={vm.idsSelecionados.includes(funcionario.id)}
                            onChange={(evento) => vm.alternarSelecao(funcionario.id, evento.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-[var(--border-strong)] text-[var(--text-secondary)] focus:ring-[var(--focus-ring)]"
                          />
                        ) : null}
                        <StatusBadge ativo={funcionario.ativo} />
                      </div>
                    </div>
                    {vm.podeGerenciarEmpresa && (
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-[var(--text-secondary)]"
                          onClick={() => iniciarEdicaoFuncionarioDrawer(funcionario.id)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        {funcionario.ativo && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.08)] hover:text-[var(--danger)]"
                            onClick={() => {
                              const alvo = vm.funcionarios.find((item) => item.id === funcionario.id);
                              if (alvo) {
                                vm.abrirModalInativacao(alvo);
                              }
                            }}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Inativar
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
