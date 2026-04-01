"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowUpRight, Building2, Link2, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { EmptyState } from "@/modules/kanban/components/empty-state";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { aplicaMascaraTelefoneBr, cn, formataMoeda } from "@/lib/utils";
import {
  atualizarLeadContato,
  criarLeadContato,
  listarLeadsApi,
  removerLeadContato,
  type ApiLeadContato,
  type ApiFuncionarioContato,
  type ApiPdvContato,
} from "@/lib/api/leads";
import {
  listarNegociosApi,
  vincularLeadAoNegocio,
  type ApiNegocioResumo,
  type ListagemNegociosApi,
} from "@/lib/api/negocios";

type ApiEstagio = NonNullable<ListagemNegociosApi["estagios"]>[number];

type FormularioNovoLead = {
  nome: string;
  telefone: string;
  email: string;
  fonte: string;
  empresaOrigem: string;
  observacoes: string;
  idFuncionario: string;
};

function criarFormularioNovoLead(idFuncionario = ""): FormularioNovoLead {
  return {
    nome: "",
    telefone: "",
    email: "",
    fonte: "",
    empresaOrigem: "",
    observacoes: "",
    idFuncionario,
  };
}

function normalizarTextoOpcional(valor: string) {
  const texto = valor.trim();
  return texto.length > 0 ? texto : null;
}

function formatarData(dataIso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dataIso));
}

function rotuloOrigem(origem?: string | null) {
  switch (origem) {
    case "ANUNCIO_CTWA":
      return "Anúncio";
    case "SINCRONIZACAO_WHATSAPP":
      return "WhatsApp";
    case "MANUAL":
      return "Manual";
    default:
      return "—";
  }
}

function rotuloEstagio(estagio?: ApiEstagio | null) {
  return estagio?.nome ?? "—";
}

function rotuloNegocio(negocio?: ApiNegocioResumo | null) {
  if (!negocio) {
    return {
      titulo: "—",
      subtitulo: "Sem negócio vinculado",
    };
  }

  const leadPrincipal = negocio.lead_principal ?? negocio.leads?.[0] ?? null;
  const estagio = negocio.estagio?.nome ?? "—";
  const funil = negocio.funil?.nome ?? "Funil";

  return {
    titulo: negocio.titulo,
    subtitulo: leadPrincipal ? `${leadPrincipal.nome} • ${funil} • ${estagio}` : `${funil} • ${estagio}`,
  };
}

export function ModuloLeads() {
  const { addToast } = useToast();
  const [leads, setLeads] = useState<ApiLeadContato[]>([]);
  const [negocios, setNegocios] = useState<ApiNegocioResumo[]>([]);
  const [estagios, setEstagios] = useState<ApiEstagio[]>([]);
  const [funcionarios, setFuncionarios] = useState<ApiFuncionarioContato[]>([]);
  const [pdvs, setPdvs] = useState<ApiPdvContato[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dialogVinculoAberto, setDialogVinculoAberto] = useState(false);
  const [leadEmVinculo, setLeadEmVinculo] = useState<ApiLeadContato | null>(null);
  const [negocioSelecionadoId, setNegocioSelecionadoId] = useState("");
  const [buscaNegocio, setBuscaNegocio] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [erroVinculo, setErroVinculo] = useState<string | null>(null);
  const [leadParaRemover, setLeadParaRemover] = useState<ApiLeadContato | null>(null);
  const [removendoLead, setRemovendoLead] = useState(false);
  const [removerNegociosVinculados, setRemoverNegociosVinculados] = useState(false);
  const [erroRemocaoLead, setErroRemocaoLead] = useState<string | null>(null);
  const [dialogNovoLeadAberto, setDialogNovoLeadAberto] = useState(false);
  const [criandoLead, setCriandoLead] = useState(false);
  const [erroNovoLead, setErroNovoLead] = useState<string | null>(null);
  const [formularioNovoLead, setFormularioNovoLead] = useState<FormularioNovoLead>(() => criarFormularioNovoLead());
  const [leadEmEdicao, setLeadEmEdicao] = useState<ApiLeadContato | null>(null);

  const carregarDados = async (silencioso = false) => {
    if (silencioso) {
      setRecarregando(true);
    } else {
      setCarregando(true);
    }

    setErro(null);

    try {
      const [resultadoLeads, resultadoNegocios] = await Promise.all([listarLeadsApi(), listarNegociosApi()]);

      if (!resultadoLeads.ok) {
        throw new Error(resultadoLeads.erro);
      }

      if (!resultadoNegocios.ok) {
        throw new Error(resultadoNegocios.erro);
      }

      setLeads(resultadoLeads.dados.leads ?? []);
      setFuncionarios(resultadoLeads.dados.funcionarios ?? []);
      setPdvs(resultadoLeads.dados.pdvs ?? []);
      setNegocios(resultadoNegocios.dados.negocios ?? []);
      setEstagios(resultadoNegocios.dados.estagios ?? []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  useEffect(() => {
    setFormularioNovoLead((atual) => {
      if (atual.idFuncionario || funcionarios.length === 0) {
        return atual;
      }

      return {
        ...atual,
        idFuncionario: funcionarios[0]?.id ?? "",
      };
    });
  }, [funcionarios]);

  const estagiosPorId = useMemo(() => new Map(estagios.map((item) => [item.id, item] as const)), [estagios]);
  const funcionariosPorId = useMemo(() => new Map(funcionarios.map((item) => [item.id, item] as const)), [funcionarios]);
  const pdvsPorId = useMemo(() => new Map(pdvs.map((item) => [item.id, item.nome] as const)), [pdvs]);
  const negociosPorId = useMemo(() => new Map(negocios.map((item) => [item.id, item] as const)), [negocios]);

  const leadsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return leads;

    return leads.filter((lead) => {
      const responsavel = funcionariosPorId.get(lead.id_funcionario)?.nome ?? "";
      const pdvNome = lead.id_pdv ? pdvsPorId.get(lead.id_pdv) ?? "" : "";
      const estagioNome = rotuloEstagio(estagiosPorId.get(lead.id_estagio));
      const negocioNome = lead.id_negocio ? negociosPorId.get(lead.id_negocio)?.titulo ?? "" : "";

      return [lead.nome, lead.telefone, responsavel, pdvNome, estagioNome, negocioNome, rotuloOrigem(lead.origem)]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [busca, leads, estagiosPorId, funcionariosPorId, negociosPorId, pdvsPorId]);

  const negociosParaVinculo = useMemo(() => {
    const termo = buscaNegocio.trim().toLowerCase();
    if (!termo) return negocios;

    return negocios.filter((negocio) => {
      const leadPrincipal = negocio.lead_principal ?? negocio.leads?.[0] ?? null;
      const estagio = negocio.estagio?.nome ?? "";
      const funil = negocio.funil?.nome ?? "";
      const responsavel = negocio.funcionario?.nome ?? "";

      return [negocio.titulo, leadPrincipal?.nome ?? "", leadPrincipal?.telefone ?? "", estagio, funil, responsavel]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [buscaNegocio, negocios]);

  const negociosRelacionadosAoLead = useMemo(() => {
    if (!leadParaRemover) return [];

    const mapa = new Map<string, ApiNegocioResumo>();

    for (const negocio of negocios) {
      if (negocio.id === leadParaRemover.id_negocio || negocio.lead_principal?.id === leadParaRemover.id) {
        mapa.set(negocio.id, negocio);
      }
    }

    return Array.from(mapa.values());
  }, [leadParaRemover, negocios]);

  const abrirVinculo = (lead: ApiLeadContato) => {
    setLeadEmVinculo(lead);
    setNegocioSelecionadoId(lead.id_negocio && negociosPorId.has(lead.id_negocio) ? lead.id_negocio : negocios[0]?.id ?? "");
    setBuscaNegocio("");
    setErroVinculo(null);
    setDialogVinculoAberto(true);
  };

  const fecharVinculo = () => {
    if (vinculando) {
      return;
    }

    setDialogVinculoAberto(false);
    setLeadEmVinculo(null);
    setNegocioSelecionadoId("");
    setBuscaNegocio("");
    setErroVinculo(null);
  };

  const abrirRemocaoLead = (lead: ApiLeadContato) => {
    setLeadParaRemover(lead);
    setRemoverNegociosVinculados(false);
    setErroRemocaoLead(null);
  };

  const fecharRemocaoLead = () => {
    if (removendoLead) {
      return;
    }

    setLeadParaRemover(null);
    setRemoverNegociosVinculados(false);
    setErroRemocaoLead(null);
  };

  const abrirNovoLead = () => {
    setLeadEmEdicao(null);
    setFormularioNovoLead(criarFormularioNovoLead(funcionarios[0]?.id ?? ""));
    setErroNovoLead(null);
    setDialogNovoLeadAberto(true);
  };

  const abrirEdicaoLead = (lead: ApiLeadContato) => {
    setLeadEmEdicao(lead);
    setFormularioNovoLead({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email ?? "",
      fonte: lead.fonte ?? "",
      empresaOrigem: lead.empresa_origem ?? "",
      observacoes: lead.observacoes ?? "",
      idFuncionario: lead.id_funcionario,
    });
    setErroNovoLead(null);
    setDialogNovoLeadAberto(true);
  };

  const fecharNovoLead = () => {
    if (criandoLead) {
      return;
    }

    setDialogNovoLeadAberto(false);
    setErroNovoLead(null);
    setLeadEmEdicao(null);
  };

  const atualizarFormularioNovoLead = <Campo extends keyof FormularioNovoLead>(campo: Campo, valor: FormularioNovoLead[Campo]) => {
    setFormularioNovoLead((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const confirmarRemocaoLead = async () => {
    if (!leadParaRemover || removendoLead) {
      return;
    }

    setRemovendoLead(true);
    setErroRemocaoLead(null);

    try {
      const resultado = await removerLeadContato(leadParaRemover.id, {
        remover_negocios_vinculados: removerNegociosVinculados,
      });

      if (!resultado.ok) {
        setErroRemocaoLead(resultado.erro);
        return;
      }

      setLeadParaRemover(null);
      setRemoverNegociosVinculados(false);
      setLeads((atual) => atual.filter((item) => item.id !== leadParaRemover.id));

      await carregarDados(true);

      addToast({
        type: "success",
        title: "Lead removido",
        description: removerNegociosVinculados && resultado.dados.negocios_removidos && resultado.dados.negocios_removidos > 0
          ? `${leadParaRemover.nome} e ${resultado.dados.negocios_removidos} negócio(s) vinculados foram removidos.`
          : `${leadParaRemover.nome} foi removido com sucesso.`,
      });
    } catch (error) {
      setErroRemocaoLead(error instanceof Error ? error.message : "Não foi possível remover o lead.");
    } finally {
      setRemovendoLead(false);
    }
  };

  const submitNovoLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (criandoLead) {
      return;
    }

    if (funcionarios.length > 1 && !formularioNovoLead.idFuncionario) {
      setErroNovoLead("Selecione um responsável para este lead.");
      return;
    }

    setCriandoLead(true);
    setErroNovoLead(null);

    try {
      const payloadBase = {
        nome: formularioNovoLead.nome.trim(),
        telefone: formularioNovoLead.telefone,
        id_funcionario: formularioNovoLead.idFuncionario || undefined,
        email: normalizarTextoOpcional(formularioNovoLead.email),
        fonte: normalizarTextoOpcional(formularioNovoLead.fonte),
        empresa_origem: normalizarTextoOpcional(formularioNovoLead.empresaOrigem),
        observacoes: normalizarTextoOpcional(formularioNovoLead.observacoes),
      };

      const resultado = leadEmEdicao
        ? await atualizarLeadContato(leadEmEdicao.id, payloadBase)
        : await criarLeadContato({
            ...payloadBase,
            origem: "MANUAL",
          });

      if (!resultado.ok) {
        setErroNovoLead(resultado.erro);
        return;
      }

      setDialogNovoLeadAberto(false);
      setLeadEmEdicao(null);
      setFormularioNovoLead(criarFormularioNovoLead(funcionarios[0]?.id ?? ""));
      await carregarDados(true);
      addToast({
        type: "success",
        title: leadEmEdicao ? "Lead atualizado" : "Lead cadastrado",
        description: leadEmEdicao
          ? `${resultado.dados.lead.nome} foi atualizado com sucesso.`
          : `${resultado.dados.lead.nome} entrou na fila de leads com origem manual.`,
      });
    } catch (error) {
      setErroNovoLead(error instanceof Error ? error.message : `Não foi possível ${leadEmEdicao ? "atualizar" : "cadastrar"} o lead.`);
    } finally {
      setCriandoLead(false);
    }
  };

  const confirmarVinculo = async () => {
    if (!leadEmVinculo || !negocioSelecionadoId) {
      setErroVinculo("Selecione um negócio para vincular o lead.");
      return;
    }

    if (vinculando) {
      return;
    }

    setVinculando(true);
    setErroVinculo(null);

    try {
      const resultado = await vincularLeadAoNegocio(negocioSelecionadoId, leadEmVinculo.id);

      if (!resultado.ok) {
        setErroVinculo(resultado.erro);
        return;
      }

      setDialogVinculoAberto(false);
      setLeadEmVinculo(null);
      setNegocioSelecionadoId("");
      setBuscaNegocio("");

      await carregarDados(true);

      const negocioAtualizado = resultado.dados.negocio ?? negociosPorId.get(negocioSelecionadoId) ?? null;
      const negocioInfo = rotuloNegocio(negocioAtualizado);

      addToast({
        type: "success",
        title: "Lead vinculado",
        description: `${leadEmVinculo.nome} foi vinculado a ${negocioInfo.titulo}.`,
      });
    } catch (error) {
      setErroVinculo(error instanceof Error ? error.message : "Não foi possível vincular o lead.");
    } finally {
      setVinculando(false);
    }
  };

  const title = `${leadsFiltrados.length.toLocaleString("pt-BR")} lead${leadsFiltrados.length === 1 ? "" : "s"}`;

  return (
    <ModulePageShell spacing="lg" className="bg-[linear-gradient(180deg,rgba(9,9,11,0.98),rgba(12,12,14,0.96))]">
      <ModulePageHeader
        title="Leads"
        subtitle="Lista operacional de contatos e vínculos comerciais."
        icon={<Users className="h-5 w-5" />}
        badges={[
          <span key="total" className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
            {title}
          </span>,
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar lead..."
                className="h-10 w-[min(100vw-2rem,20rem)] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
              />
            </div>
            <Button
              type="button"
              className="h-10 rounded-[var(--radius-control)] bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
              onClick={abrirNovoLead}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo lead
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[var(--radius-control)]"
              onClick={() => void carregarDados(true)}
              disabled={carregando || recarregando}
            >
              {recarregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar
            </Button>
          </div>
        }
      />

      <InlineStatusAlert variant="error" message={erro} />

      {carregando ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
        </div>
      ) : leadsFiltrados.length === 0 ? (
        <EmptyState
          titulo={busca ? "Nenhum lead encontrado" : "Ainda não há leads listados"}
          descricao={busca ? "Tente outro termo ou limpe a busca." : "Os novos leads aparecerão aqui após a captura."}
          acao={busca ? <Button variant="outline" onClick={() => setBusca("")}>Limpar busca</Button> : <Button onClick={abrirNovoLead} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"><Plus className="mr-2 h-4 w-4" />Cadastrar lead</Button>}
        />
      ) : (
        <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Leads ({leadsFiltrados.length})</p>
            <p className="text-xs text-[var(--text-secondary)]">{leads.length.toLocaleString("pt-BR")} no total</p>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <Table className="min-w-[900px] w-full">
              <TableHeader className="sticky top-0 bg-[var(--surface-elevated)]">
                <TableRow className="hover:bg-[color:rgba(255,255,255,0.03)]">
                  <TableHead>Lead</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>PDV</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Negócio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsFiltrados.map((lead) => {
                  const estagio = rotuloEstagio(estagiosPorId.get(lead.id_estagio));
                  const responsavel = funcionariosPorId.get(lead.id_funcionario)?.nome ?? "—";
                  const pdv = lead.id_pdv ? pdvsPorId.get(lead.id_pdv) ?? "—" : "—";
                  const idNegocio = lead.id_negocio ?? null;
                  const negocio = idNegocio ? negociosPorId.get(idNegocio) ?? null : null;
                  const negocioResumo = negocio
                    ? rotuloNegocio(negocio)
                    : idNegocio
                      ? {
                          titulo: "Negócio vinculado",
                          subtitulo: `ID ${idNegocio}`,
                        }
                      : {
                          titulo: "—",
                          subtitulo: "Sem negócio vinculado",
                        };

                  return (
                    <TableRow key={lead.id} className="border-[var(--border-subtle)]">
                      <TableCell className="py-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text-primary)]">{lead.nome}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{lead.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-[var(--text-secondary)]">{lead.telefone}</TableCell>
                      <TableCell className="py-4 text-[var(--text-secondary)]">{estagio}</TableCell>
                      <TableCell className="py-4 text-[var(--text-secondary)]">{responsavel}</TableCell>
                      <TableCell className="py-4 text-[var(--text-secondary)]">{pdv}</TableCell>
                      <TableCell className="py-4 text-[var(--text-secondary)]">{rotuloOrigem(lead.origem)}</TableCell>
                      <TableCell className="py-4 font-semibold text-[var(--text-primary)]">{formataMoeda(lead.valor_oportunidade)}</TableCell>
                      <TableCell className="py-4 text-[var(--text-secondary)]">{formatarData(lead.atualizado_em)}</TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {idNegocio ? (
                            <div className="max-w-[18rem] text-right">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{negocioResumo.titulo}</p>
                              <p className="truncate text-xs text-[var(--text-secondary)]">{negocioResumo.subtitulo}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-tertiary)]">Sem negócio vinculado</span>
                          )}

                          <div className="flex items-center gap-2">
                            {idNegocio ? (
                              <Button asChild variant="ghost" size="sm" className="text-[var(--info)] hover:bg-[color:rgba(56,189,248,0.08)] hover:text-[var(--info-alt)]">
                                <Link href={`/kanban?negocio=${idNegocio}`} title="Abrir negócio vinculado">
                                  <ArrowUpRight className="mr-1 h-4 w-4" />
                                  Abrir
                                </Link>
                              </Button>
                            ) : null}

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-[var(--radius-control)]"
                              onClick={() => abrirEdicaoLead(lead)}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Editar
                            </Button>

                            <Button
                              type="button"
                              variant={idNegocio ? "outline" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-8 rounded-[var(--radius-control)]",
                                !idNegocio ? "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" : "",
                              )}
                              onClick={() => abrirVinculo(lead)}
                            >
                              {idNegocio ? (
                                <>
                                  <Link2 className="mr-1 h-4 w-4" />
                                  Trocar vínculo
                                </>
                              ) : (
                                <>
                                  <Link2 className="mr-1 h-4 w-4" />
                                  Vincular
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-8 rounded-[var(--radius-control)]"
                              onClick={() => abrirRemocaoLead(lead)}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <Dialog open={dialogVinculoAberto} onOpenChange={(aberto) => (aberto ? setDialogVinculoAberto(true) : fecharVinculo())}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--brand)]" />
              <DialogTitle>Vincular lead a um negócio</DialogTitle>
            </div>
            <DialogDescription>
              Escolha um negócio existente para receber este lead. Se o lead já estiver em outro negócio, ele será transferido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {leadEmVinculo ? (
              <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{leadEmVinculo.nome}</p>
                <p className="text-xs text-[var(--text-secondary)]">{leadEmVinculo.telefone}</p>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  {leadEmVinculo.id_negocio ? "O vínculo atual será substituído se você escolher outro negócio." : "Este lead ainda não possui negócio vinculado."}
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Buscar negócio</label>
              <Input
                value={buscaNegocio}
                onChange={(event) => setBuscaNegocio(event.target.value)}
                placeholder="Título, lead, funil, estágio ou responsável"
                className="h-10 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Negócios disponíveis</p>
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                  {negociosParaVinculo.length.toLocaleString("pt-BR")}
                </span>
              </div>

              <div className="max-h-[42vh] overflow-y-auto pr-1">
                {negociosParaVinculo.length === 0 ? (
                  <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-4 text-sm text-[var(--text-secondary)]">
                    Nenhum negócio encontrado com esse filtro.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {negociosParaVinculo.map((negocio) => {
                      const leadPrincipal = negocio.lead_principal ?? negocio.leads?.[0] ?? null;
                      const estagio = negocio.estagio?.nome ?? "—";
                      const funil = negocio.funil?.nome ?? "Funil";
                      const selecionado = negocio.id === negocioSelecionadoId;

                      return (
                        <button
                          key={negocio.id}
                          type="button"
                          onClick={() => setNegocioSelecionadoId(negocio.id)}
                          className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-3 text-left transition-colors",
                            selecionado
                              ? "border-[color:rgba(139,92,246,0.36)] bg-[color:rgba(139,92,246,0.12)]"
                              : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{negocio.titulo}</p>
                            <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                              {leadPrincipal ? `${leadPrincipal.nome} • ${leadPrincipal.telefone}` : "Sem lead principal"}
                            </p>
                            <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                              {funil} • {estagio} • {negocio.funcionario?.nome ?? "Responsável não informado"}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 text-[11px]">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5",
                                selecionado
                                  ? "bg-[var(--brand-soft)] text-[var(--text-primary)]"
                                  : "bg-[color:rgba(255,255,255,0.04)] text-[var(--text-tertiary)]",
                              )}
                            >
                              {selecionado ? "Selecionado" : "Selecionar"}
                            </span>
                            <span className="rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 py-0.5 text-[var(--text-tertiary)]">
                              {negocio.leads?.length ?? 0} lead{(negocio.leads?.length ?? 0) === 1 ? "" : "s"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {erroVinculo ? (
              <div className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm font-medium text-[color:#fecdd3]">
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {erroVinculo}
                </span>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={fecharVinculo} disabled={vinculando}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void confirmarVinculo()}
              disabled={vinculando || !negocioSelecionadoId || !leadEmVinculo}
              className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
            >
              {vinculando ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vinculando...
                </span>
              ) : (
                "Vincular lead"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogNovoLeadAberto}
        onOpenChange={(aberto) => {
          if (aberto) {
            setDialogNovoLeadAberto(true);
            return;
          }

          fecharNovoLead();
        }}
      >
          <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {leadEmEdicao ? <Pencil className="h-4 w-4 text-[var(--brand)]" /> : <Users className="h-4 w-4 text-[var(--brand)]" />}
              <DialogTitle>{leadEmEdicao ? "Editar lead" : "Cadastrar lead manual"}</DialogTitle>
            </div>
            <DialogDescription>
              {leadEmEdicao
                ? "Atualize os dados principais do contato sem perder o histórico comercial já existente."
                : "Adicione um contato diretamente no CRM para começar o atendimento ou vincular a um negócio depois."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitNovoLead}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Nome do lead</label>
                <Input
                  value={formularioNovoLead.nome}
                  onChange={(event) => atualizarFormularioNovoLead("nome", event.target.value)}
                  placeholder="Ex: Maria Oliveira"
                  className="h-10"
                  disabled={criandoLead}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Telefone</label>
                <Input
                  value={formularioNovoLead.telefone}
                  onChange={(event) => atualizarFormularioNovoLead("telefone", aplicaMascaraTelefoneBr(event.target.value))}
                  placeholder="(11) 99999-9999"
                  className="h-10"
                  disabled={criandoLead}
                  inputMode="tel"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">E-mail</label>
                <Input
                  value={formularioNovoLead.email}
                  onChange={(event) => atualizarFormularioNovoLead("email", event.target.value)}
                  placeholder="cliente@exemplo.com"
                  className="h-10"
                  disabled={criandoLead}
                  type="email"
                />
              </div>

              {funcionarios.length > 1 ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Responsável</label>
                  <Select
                    value={formularioNovoLead.idFuncionario}
                    onValueChange={(valor) => atualizarFormularioNovoLead("idFuncionario", valor)}
                    disabled={criandoLead}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Fonte</label>
                <Input
                  value={formularioNovoLead.fonte}
                  onChange={(event) => atualizarFormularioNovoLead("fonte", event.target.value)}
                  placeholder="Indicação, site, evento..."
                  className="h-10"
                  disabled={criandoLead}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Empresa de origem</label>
                <Input
                  value={formularioNovoLead.empresaOrigem}
                  onChange={(event) => atualizarFormularioNovoLead("empresaOrigem", event.target.value)}
                  placeholder="Empresa, parceiro ou campanha de origem"
                  className="h-10"
                  disabled={criandoLead}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Observações</label>
                <Textarea
                  value={formularioNovoLead.observacoes}
                  onChange={(event) => atualizarFormularioNovoLead("observacoes", event.target.value)}
                  placeholder="Contexto inicial, produto de interesse, urgência ou próximos passos"
                  disabled={criandoLead}
                  className="min-h-28"
                />
              </div>
            </div>

            {erroNovoLead ? (
              <div className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm font-medium text-[color:#fecdd3]">
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {erroNovoLead}
                </span>
              </div>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={fecharNovoLead} disabled={criandoLead}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criandoLead} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
                {criandoLead ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {leadEmEdicao ? "Salvando..." : "Cadastrando..."}
                  </span>
                ) : (
                  <>
                    {leadEmEdicao ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {leadEmEdicao ? "Salvar alterações" : "Salvar lead"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(leadParaRemover)}
        onOpenChange={(aberto) => {
          if (aberto) {
            return;
          }

          fecharRemocaoLead();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover lead</DialogTitle>
            <DialogDescription>
              O lead será desativado. Você pode escolher se os negócios vinculados também devem ser removidos.
            </DialogDescription>
          </DialogHeader>

          {leadParaRemover ? (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{leadParaRemover.nome}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{leadParaRemover.telefone}</p>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  {negociosRelacionadosAoLead.length > 0
                    ? `${negociosRelacionadosAoLead.length.toLocaleString("pt-BR")} negócio${negociosRelacionadosAoLead.length === 1 ? "" : "s"} relacionado${negociosRelacionadosAoLead.length === 1 ? "" : "s"} encontrado${negociosRelacionadosAoLead.length === 1 ? "" : "s"}.`
                    : "Nenhum negócio relacionado encontrado."}
                </p>
              </div>

              {negociosRelacionadosAoLead.length > 0 ? (
                <div className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Remover negócios vinculados</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {negociosRelacionadosAoLead.length === 1
                        ? "Também remover o negócio vinculado a este lead."
                        : `Também remover os ${negociosRelacionadosAoLead.length} negócios vinculados a este lead.`}
                    </p>
                  </div>
                  <Switch
                    checked={removerNegociosVinculados}
                    onCheckedChange={setRemoverNegociosVinculados}
                    disabled={removendoLead}
                  />
                </div>
              ) : (
                <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                  Este lead não possui negócios vinculados ativos.
                </p>
              )}
            </div>
          ) : null}

          {erroRemocaoLead ? (
            <p className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm font-medium text-[color:#fecdd3]">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {erroRemocaoLead}
              </span>
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={fecharRemocaoLead} disabled={removendoLead}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmarRemocaoLead()} disabled={removendoLead}>
              {removendoLead ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </span>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {negociosRelacionadosAoLead.length > 0 && removerNegociosVinculados ? "Remover lead e negócios" : "Remover lead"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  );
}
