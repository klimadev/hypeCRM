"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, ArrowUp, ArrowUpDown, ArrowDown, CheckCircle2, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, UserPlus, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UseEquipeModuleReturn, Pdv } from "../types";
import { Avatar } from "./shared/avatar";

type EquipeLojaDrawerProps = {
  vm: UseEquipeModuleReturn;
  loja: Pdv | null;
  aberto: boolean;
  onFechar: () => void;
};

type FuncionarioItem = {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  ativo: boolean;
};

const VALOR_SEM_INSTANCIA = "__SEM_INSTANCIA__";

export function EquipeLojaDrawer({ vm, loja, aberto, onFechar }: EquipeLojaDrawerProps) {
  const { carregarFuncionarios } = vm;
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<"nome" | "email" | "cargo" | "status">("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");
  const [editandoPessoaId, setEditandoPessoaId] = useState<string | null>(null);
  const [dadosEdicaoPessoa, setDadosEdicaoPessoa] = useState<{ nome: string; email: string; cargo: string; id_pdv: string } | null>(null);
  const [errosEdicao, setErrosEdicao] = useState<Record<string, string>>({});
  const [mostrarFormularioNovo, setMostrarFormularioNovo] = useState(false);
  const [cadastroSucesso, setCadastroSucesso] = useState(false);
  const [errosCadastro, setErrosCadastro] = useState<{ nome?: string; email?: string; senha?: string }>({});
  const [trocandoWhatsapp, setTrocandoWhatsapp] = useState(false);
  const [instanciaWhatsappSelecionada, setInstanciaWhatsappSelecionada] = useState("");
  const [salvandoWhatsapp, setSalvandoWhatsapp] = useState(false);

  const lojaAtual = useMemo(() => {
    if (!loja) return null;
    return vm.pdvs.find((item) => item.id === loja.id) ?? loja;
  }, [vm.pdvs, loja]);

  useEffect(() => {
    if (aberto && lojaAtual?.id) {
      void carregarFuncionarios();
    }
  }, [aberto, lojaAtual?.id, carregarFuncionarios]);

  const pessoasLoja = useMemo<FuncionarioItem[]>(() => {
    const base = vm.funcionarios
      .filter((f) => f.pdv?.id === lojaAtual?.id || f.Pdv?.id === lojaAtual?.id)
      .map((f) => ({
        id: f.id,
        nome: f.nome,
        cargo: f.cargo,
        email: f.email,
        ativo: f.ativo,
      }));

    if (!busca.trim()) return base;

    const termo = busca.trim().toLowerCase();
    return base.filter((p) => {
      const alvo = `${p.nome} ${p.email} ${p.cargo}`.toLowerCase();
      return alvo.includes(termo);
    });
  }, [vm.funcionarios, lojaAtual?.id, busca]);

  const pessoasOrdenadas = useMemo(() => {
    const lista = [...pessoasLoja];
    lista.sort((a, b) => {
      const valorA = ordenacao === "status" ? (a.ativo ? "ATIVO" : "INATIVO") : (a[ordenacao] ?? "");
      const valorB = ordenacao === "status" ? (b.ativo ? "ATIVO" : "INATIVO") : (b[ordenacao] ?? "");
      const comparacao = String(valorA).localeCompare(String(valorB), "pt-BR", { sensitivity: "base" });
      return direcao === "asc" ? comparacao : -comparacao;
    });
    return lista;
  }, [pessoasLoja, direcao, ordenacao]);

  const alternarOrdenacao = (campo: "nome" | "email" | "cargo" | "status") => {
    if (ordenacao === campo) {
      setDirecao((atual) => (atual === "asc" ? "desc" : "asc"));
    } else {
      setOrdenacao(campo);
      setDirecao("asc");
    }
  };

  const iconeOrdenacao = (campo: string) => {
    if (ordenacao !== campo) return <ArrowUpDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
    return direcao === "asc" 
      ? <ArrowUp className="h-3.5 w-3.5 text-[var(--text-primary)]" /> 
      : <ArrowDown className="h-3.5 w-3.5 text-[var(--text-primary)]" />;
  };

  const iniciarEdicaoPessoa = (pessoa: FuncionarioItem) => {
    setDadosEdicaoPessoa({
      nome: pessoa.nome,
      email: pessoa.email,
      cargo: pessoa.cargo,
      id_pdv: lojaAtual?.id ?? "",
    });
    setErrosEdicao({});
    setEditandoPessoaId(pessoa.id);
  };

  const cancelarEdicaoPessoa = () => {
    setEditandoPessoaId(null);
    setDadosEdicaoPessoa(null);
    setErrosEdicao({});
  };

  const salvarEdicaoPessoa = async () => {
    if (!dadosEdicaoPessoa || !editandoPessoaId) return;

    const novosErros: Record<string, string> = {};
    if (!dadosEdicaoPessoa.nome.trim() || dadosEdicaoPessoa.nome.trim().length < 2) {
      novosErros.nome = "Nome deve ter ao menos 2 caracteres.";
    }
    if (!dadosEdicaoPessoa.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosEdicaoPessoa.email.trim())) {
      novosErros.email = "E-mail invalido.";
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosEdicao(novosErros);
      return;
    }

    const func = vm.funcionarios.find((f) => f.id === editandoPessoaId);
    if (!func) return;

    vm.iniciarEdicao(func);
    const ok = await vm.salvarEdicaoAtual(dadosEdicaoPessoa);
    if (ok) {
      cancelarEdicaoPessoa();
    }
  };

  const handleSubmitNovo = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErrosCadastro({});
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
      novosErros.email = "E-mail invalido";
    }
    if (!senha || senha.length < 4) {
      novosErros.senha = "Senha deve ter ao menos 4 caracteres";
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosCadastro(novosErros);
      return;
    }

    vm.setCargoSelecionado(dados.get("cargo") as string || "COLABORADOR");
    vm.setPdvSelecionado(lojaAtual?.id ?? "");

    const sucesso = await vm.adicionarFuncionario(evento);
    if (sucesso) {
      setCadastroSucesso(true);
      setMostrarFormularioNovo(false);
      setTimeout(() => setCadastroSucesso(false), 3000);
      evento.currentTarget?.reset();
    }
  };

  const getNomeCargo = (cargo: string) => {
    const map: Record<string, string> = {
      COLABORADOR: "Vendedor",
      GERENTE: "Gerente",
      ADMINISTRADOR: "Admin",
    };
    return map[cargo] || cargo;
  };

  const getStatusBadge = (ativo: boolean) => {
    if (ativo) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.1)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
          <CheckCircle2 className="h-3 w-3" />
          Ativo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[color:rgba(245,158,11,0.2)] bg-[color:rgba(245,158,11,0.1)] px-2 py-0.5 text-xs font-medium text-[var(--warning)]">
        <X className="h-3 w-3" />
        Inativo
      </span>
    );
  };

  const iniciarTrocaWhatsapp = () => {
    if (!lojaAtual) return;
    setInstanciaWhatsappSelecionada(lojaAtual.id_whatsapp_instancia ?? "");
    setTrocandoWhatsapp(true);
  };

  const cancelarTrocaWhatsapp = () => {
    setTrocandoWhatsapp(false);
    setInstanciaWhatsappSelecionada(lojaAtual?.id_whatsapp_instancia ?? "");
  };

  const salvarTrocaWhatsapp = async () => {
    if (!lojaAtual) return;

    setSalvandoWhatsapp(true);
    const ok = await vm.trocarInstanciaPdv(lojaAtual.id, instanciaWhatsappSelecionada || null);
    setSalvandoWhatsapp(false);

    if (ok) {
      setTrocandoWhatsapp(false);
    }
  };

  return (
    <Sheet
      open={aberto}
      onOpenChange={(estaAberto) => {
        if (!estaAberto) {
          onFechar();
          setEditandoPessoaId(null);
          setDadosEdicaoPessoa(null);
          setMostrarFormularioNovo(false);
          setTrocandoWhatsapp(false);
          setInstanciaWhatsappSelecionada("");
          setSalvandoWhatsapp(false);
        }
      }}
    >
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto bg-[var(--surface-elevated)] p-0">
        {editandoPessoaId && dadosEdicaoPessoa ? (
          <>
            <SheetHeader className="border-b border-[var(--border-subtle)] px-6 py-4">
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" className="h-9 w-9 rounded-lg p-0" onClick={cancelarEdicaoPessoa}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <SheetTitle className="text-lg text-[var(--text-primary)]">Editar Pessoa</SheetTitle>
                  <SheetDescription className="text-sm text-[var(--text-secondary)]">
                    Altere os dados de {dadosEdicaoPessoa.nome}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Nome</label>
                <Input
                  value={dadosEdicaoPessoa.nome}
                  onChange={(e) => setDadosEdicaoPessoa((prev) => prev ? { ...prev, nome: e.target.value } : null)}
                  placeholder="Nome completo"
                  className={errosEdicao.nome ? "border-[var(--danger)]" : ""}
                />
                {errosEdicao.nome && <p className="text-xs text-[var(--danger)]">{errosEdicao.nome}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">E-mail</label>
                <Input
                  type="email"
                  value={dadosEdicaoPessoa.email}
                  onChange={(e) => setDadosEdicaoPessoa((prev) => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="email@exemplo.com"
                  className={errosEdicao.email ? "border-[var(--danger)]" : ""}
                />
                {errosEdicao.email && <p className="text-xs text-[var(--danger)]">{errosEdicao.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Funcao</label>
                <Select
                  value={dadosEdicaoPessoa.cargo}
                  onValueChange={(valor) => setDadosEdicaoPessoa((prev) => prev ? { ...prev, cargo: valor } : null)}
                >
                  <SelectTrigger className={errosEdicao.cargo ? "border-[var(--danger)]" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLABORADOR">Vendedor</SelectItem>
                    <SelectItem value="GERENTE">Gerente</SelectItem>
                    <SelectItem value="ADMINISTRADOR">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {vm.statusSalvamento.id === editandoPessoaId && vm.statusSalvamento.estado === "error" && (
                <div className="rounded-lg bg-[color:rgba(244,63,94,0.08)] p-3 text-sm text-[var(--danger)]">
                  {vm.statusSalvamento.mensagem}
                </div>
              )}
            </div>

            <SheetFooter className="flex-col gap-2 px-6 pb-6">
              <Button
                className="h-11 w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)]"
                onClick={salvarEdicaoPessoa}
                disabled={vm.statusSalvamento.id === editandoPessoaId && vm.statusSalvamento.estado === "saving"}
              >
                {vm.statusSalvamento.id === editandoPessoaId && vm.statusSalvamento.estado === "saving" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Salvar Alteracoes
                  </>
                )}
              </Button>
              <Button variant="outline" className="h-11 w-full rounded-xl" onClick={cancelarEdicaoPessoa}>
                Cancelar
              </Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader className="border-b border-[var(--border-subtle)] px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-xl text-[var(--text-primary)]">
                    {lojaAtual?.nome}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-[var(--text-secondary)] mt-1">
                    {pessoasLoja.length} {pessoasLoja.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}
                  </SheetDescription>
                </div>
                {lojaAtual?.alerta_configuracao && (
                  <div className="flex items-center gap-2 rounded-lg border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.08)] px-3 py-2 text-xs text-[var(--warning)] shrink-0">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Sem WhatsApp</span>
                  </div>
                )}
              </div>
            </SheetHeader>

            <div className="px-6 py-4 space-y-4">
              {cadastroSucesso && (
                <div className="flex items-center gap-3 rounded-xl border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.08)] px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:rgba(16,185,129,0.12)]">
                    <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--success)]">Pessoa cadastrada com sucesso!</p>
                    <p className="text-xs text-[var(--success)]/80">Lista atualizada automaticamente</p>
                  </div>
                </div>
              )}

              {vm.podeGerenciarEmpresa && lojaAtual && (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">WhatsApp da equipe</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {lojaAtual.whatsapp_instancia?.nome ?? "Nenhuma instancia vinculada"}
                      </p>
                    </div>
                    {!trocandoWhatsapp ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg text-[var(--text-secondary)]"
                        onClick={iniciarTrocaWhatsapp}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        {lojaAtual.id_whatsapp_instancia ? "Trocar" : "Vincular"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg"
                        onClick={cancelarTrocaWhatsapp}
                        disabled={salvandoWhatsapp}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {trocandoWhatsapp ? (
                    <div className="space-y-3">
                      <Select
                        value={instanciaWhatsappSelecionada || VALOR_SEM_INSTANCIA}
                        onValueChange={(valor) => setInstanciaWhatsappSelecionada(valor === VALOR_SEM_INSTANCIA ? "" : valor)}
                      >
                        <SelectTrigger className="h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]">
                          <SelectValue placeholder="Selecione a instancia WhatsApp" />
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

                      {vm.erroGestaoPdvs ? (
                        <div className="rounded-lg border border-[color:rgba(244,63,94,0.2)] bg-[color:rgba(244,63,94,0.08)] px-3 py-2 text-xs text-[var(--danger)]">
                          {vm.erroGestaoPdvs}
                        </div>
                      ) : null}

                      {vm.instancias.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)]">
                          Nenhuma instancia disponivel no momento. Voce ainda pode remover o vinculo atual selecionando a opcao Nenhuma.
                        </p>
                      ) : null}

                      <Button
                        type="button"
                        className="h-10 w-full rounded-lg bg-[var(--brand)] font-medium text-white hover:bg-[var(--brand-strong)]"
                        disabled={salvandoWhatsapp}
                        onClick={() => void salvarTrocaWhatsapp()}
                      >
                        {salvandoWhatsapp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar WhatsApp"
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              {mostrarFormularioNovo ? (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Adicionar nova pessoa</p>
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-[var(--text-secondary)]" onClick={() => setMostrarFormularioNovo(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleSubmitNovo} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome</label>
                        <Input 
                          name="nome" 
                          placeholder="Nome completo" 
                          required 
                          className={cn(
                            "h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]",
                            errosCadastro.nome ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : ""
                          )} 
                        />
                        {errosCadastro.nome && <p className="mt-1 text-xs text-[var(--danger)]">{errosCadastro.nome}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Funcao</label>
                        <Select name="cargo" defaultValue="COLABORADOR">
                          <SelectTrigger className="h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COLABORADOR">Vendedor</SelectItem>
                            <SelectItem value="GERENTE">Gerente</SelectItem>
                            <SelectItem value="ADMINISTRADOR">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">E-mail</label>
                      <Input 
                        name="email" 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        required 
                        className={cn(
                          "h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]",
                          errosCadastro.email ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : ""
                        )} 
                      />
                      {errosCadastro.email && <p className="mt-1 text-xs text-[var(--danger)]">{errosCadastro.email}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Senha temporaria</label>
                      <Input 
                        name="senha" 
                        type="password" 
                        placeholder="Minimo 4 caracteres" 
                        required 
                        className={cn(
                          "h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]",
                          errosCadastro.senha ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : ""
                        )} 
                      />
                      {errosCadastro.senha && <p className="mt-1 text-xs text-[var(--danger)]">{errosCadastro.senha}</p>}
                    </div>
                    <input type="hidden" name="id_pdv" value={lojaAtual?.id ?? ""} />

                    {vm.erroCadastro && (
                      <div className="flex items-center gap-2 rounded-lg bg-[color:rgba(244,63,94,0.08)] border border-[color:rgba(244,63,94,0.2)] px-3 py-2">
                        <p className="text-sm text-[var(--danger)]">{vm.erroCadastro}</p>
                      </div>
                    )}
                    
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
                          Adicionar pessoa
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                <Button 
                  className="h-11 w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] font-medium"
                  onClick={() => setMostrarFormularioNovo(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar pessoa nesta loja
                </Button>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="h-10 pl-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-1.5">
                <Button type="button" size="sm" variant={ordenacao === "nome" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => alternarOrdenacao("nome")}>
                  Nome {iconeOrdenacao("nome")}
                </Button>
                <Button type="button" size="sm" variant={ordenacao === "email" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => alternarOrdenacao("email")}>
                  E-mail {iconeOrdenacao("email")}
                </Button>
                <Button type="button" size="sm" variant={ordenacao === "cargo" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => alternarOrdenacao("cargo")}>
                  Funcao {iconeOrdenacao("cargo")}
                </Button>
                <Button type="button" size="sm" variant={ordenacao === "status" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => alternarOrdenacao("status")}>
                  Status {iconeOrdenacao("status")}
                </Button>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-3">
              {vm.carregandoLista ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
                  <p className="text-sm text-[var(--text-secondary)] mt-3">Carregando pessoas...</p>
                </div>
              ) : pessoasOrdenadas.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[color:rgba(255,255,255,0.05)]">
                    <Search className="h-6 w-6 text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {busca ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa nesta loja"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {busca ? "Tente buscar por outro termo" : "Adicione sua primeira pessoa"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {pessoasOrdenadas.map((pessoa) => (
                    <li 
                      key={pessoa.id} 
                      className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar nome={pessoa.nome} tamanho="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{pessoa.nome}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{pessoa.email}</p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{getNomeCargo(pessoa.cargo)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(pessoa.ativo)}
                        
                        {vm.podeGerenciarEmpresa && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-[var(--text-secondary)]"
                              onClick={() => iniciarEdicaoPessoa(pessoa)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {pessoa.ativo && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.08)]"
                                onClick={() => {
                                  const alvo = vm.funcionarios.find((item) => item.id === pessoa.id);
                                  if (alvo) vm.abrirModalInativacao(alvo);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
