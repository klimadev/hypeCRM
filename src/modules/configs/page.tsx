"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useConfigsModule } from "./hooks/use-configs-module";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  atualizarAtalhoChat,
  criarAtalhoChat,
  excluirAtalhoChat,
  listarAtalhosChat,
  type ChatShortcut,
} from "@/lib/api/chat-shortcuts";
import {
  atualizarTemplateFollowUp,
  criarTemplateFollowUp,
  excluirTemplateFollowUp,
  listarTemplatesFollowUp,
  type FollowUpTemplate,
} from "@/lib/api/chat-follow-up";

const VARIAVEIS_PRONTAS = [
  "{{lead_nome}}",
  "{{lead_telefone}}",
  "{{lead_id}}",
  "{{estagio_nome}}",
  "{{negocio_titulo}}",
  "{{nome_funcionario}}",
  "{{nome_pdv}}",
  "{{canal}}",
] as const;

type FormAtalho = {
  nome: string;
  slug: string;
  conteudo: string;
  tags: string;
  ativo: boolean;
};

type FormCadencia = {
  nome: string;
  descricao: string;
  permiteRepeticao: boolean;
  maxCiclos: number;
  etapas: FormCadenciaEtapa[];
  ativo: boolean;
};

type FormCadenciaEtapa = {
  id: string;
  dias: number;
  horas: number;
  minutos: number;
  conteudo: string;
  ativo: boolean;
};

const FORM_INICIAL: FormAtalho = {
  nome: "",
  slug: "",
  conteudo: "",
  tags: "",
  ativo: true,
};

const FORM_CADENCIA_INICIAL: FormCadencia = {
  nome: "",
  descricao: "",
  permiteRepeticao: false,
  maxCiclos: 1,
  etapas: [{ id: crypto.randomUUID(), dias: 1, horas: 0, minutos: 0, conteudo: "", ativo: true }],
  ativo: true,
};

function converterMinutosParaTempo(minutosTotais: number) {
  const valorSeguro = Math.max(5, Math.min(43200, Math.floor(minutosTotais || 0)));
  const dias = Math.floor(valorSeguro / 1440);
  const restoDias = valorSeguro % 1440;
  const horas = Math.floor(restoDias / 60);
  const minutos = restoDias % 60;
  return { dias, horas, minutos };
}

function converterTempoParaMinutos(etapa: Pick<FormCadenciaEtapa, "dias" | "horas" | "minutos">) {
  const dias = Math.max(0, Math.floor(etapa.dias || 0));
  const horas = Math.max(0, Math.min(23, Math.floor(etapa.horas || 0)));
  const minutos = Math.max(0, Math.min(59, Math.floor(etapa.minutos || 0)));
  const total = dias * 1440 + horas * 60 + minutos;
  return Math.max(5, Math.min(43200, total));
}

function resumoTempo(minutosTotais: number) {
  const { dias, horas, minutos } = converterMinutosParaTempo(minutosTotais);
  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias}d`);
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}min`);
  return partes.length > 0 ? partes.join(" ") : "5min";
}

function toPayload(form: FormAtalho) {
  const tags = form.tags
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return {
    nome: form.nome,
    slug: form.slug.replace(/^\//, "").toLowerCase(),
    conteudo: form.conteudo,
    tags,
    ativo: form.ativo,
  };
}

export function ModuloConfigs() {
  const vm = useConfigsModule();
  const { addToast } = useToast();
  const [atalhos, setAtalhos] = useState<ChatShortcut[]>([]);
  const [carregandoAtalhos, setCarregandoAtalhos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormAtalho>(FORM_INICIAL);
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([]);
  const [carregandoTemplates, setCarregandoTemplates] = useState(false);
  const [salvandoTemplate, setSalvandoTemplate] = useState(false);
  const [editandoTemplateId, setEditandoTemplateId] = useState<string | null>(null);
  const [formCadencia, setFormCadencia] = useState<FormCadencia>(FORM_CADENCIA_INICIAL);

  const carregarAtalhos = useCallback(async () => {
    setCarregandoAtalhos(true);
    const resultado = await listarAtalhosChat();
    setCarregandoAtalhos(false);
    if (!resultado.ok) {
      addToast({ type: "error", title: "Erro ao carregar atalhos", description: resultado.erro });
      return;
    }
    setAtalhos(resultado.dados.atalhos);
  }, [addToast]);

  const carregarTemplates = useCallback(async () => {
    setCarregandoTemplates(true);
    const resultado = await listarTemplatesFollowUp();
    setCarregandoTemplates(false);
    if (!resultado.ok) {
      addToast({ type: "error", title: "Erro ao carregar cadencias", description: resultado.erro });
      return;
    }
    setTemplates(resultado.dados.templates);
  }, [addToast]);

  useEffect(() => {
    let ativo = true;

    const carregarInicial = async () => {
      setCarregandoAtalhos(true);
      setCarregandoTemplates(true);
      const [resultadoAtalhos, resultadoTemplates] = await Promise.all([
        listarAtalhosChat(),
        listarTemplatesFollowUp(),
      ]);
      if (!ativo) return;
      setCarregandoAtalhos(false);
      setCarregandoTemplates(false);

      if (!resultadoAtalhos.ok) {
        addToast({ type: "error", title: "Erro ao carregar atalhos", description: resultadoAtalhos.erro });
      } else {
        setAtalhos(resultadoAtalhos.dados.atalhos);
      }

      if (!resultadoTemplates.ok) {
        addToast({ type: "error", title: "Erro ao carregar cadencias", description: resultadoTemplates.erro });
      } else {
        setTemplates(resultadoTemplates.dados.templates);
      }
    };

    void carregarInicial();
    return () => {
      ativo = false;
    };
  }, [addToast]);

  const tituloFormulario = useMemo(() => (editandoId ? "Editar atalho" : "Novo atalho"), [editandoId]);

  async function salvarAtalho() {
    if (!form.nome.trim() || !form.slug.trim() || !form.conteudo.trim()) {
      addToast({ type: "error", title: "Campos obrigatórios", description: "Preencha nome, /atalho e conteúdo." });
      return;
    }

    setSalvando(true);
    const payload = toPayload(form);
    const resultado = editandoId
      ? await atualizarAtalhoChat(editandoId, payload)
      : await criarAtalhoChat(payload);
    setSalvando(false);

    if (!resultado.ok) {
      addToast({ type: "error", title: "Erro ao salvar atalho", description: resultado.erro });
      return;
    }

    addToast({ type: "success", title: editandoId ? "Atalho atualizado" : "Atalho criado" });
    setForm(FORM_INICIAL);
    setEditandoId(null);
    await carregarAtalhos();
  }

  async function removerAtalho(id: string) {
    const resultado = await excluirAtalhoChat(id);
    if (!resultado.ok) {
      addToast({ type: "error", title: "Erro ao excluir atalho", description: resultado.erro });
      return;
    }
    addToast({ type: "success", title: "Atalho removido" });
    if (editandoId === id) {
      setForm(FORM_INICIAL);
      setEditandoId(null);
    }
    await carregarAtalhos();
  }

  function iniciarEdicao(atalho: ChatShortcut) {
    setEditandoId(atalho.id);
    setForm({
      nome: atalho.nome,
      slug: atalho.slug,
      conteudo: atalho.conteudo,
      tags: atalho.tags.join(", "),
      ativo: atalho.ativo,
    });
  }

  function iniciarEdicaoTemplate(template: FollowUpTemplate) {
    const etapasOrdenadas = [...template.etapas].sort((a, b) => a.ordem - b.ordem);
    setEditandoTemplateId(template.id);
    setFormCadencia({
      nome: template.nome,
      descricao: template.descricao ?? "",
      permiteRepeticao: template.permiteRepeticao,
      maxCiclos: template.maxCiclos,
      etapas: etapasOrdenadas.length > 0
        ? etapasOrdenadas.map((etapa) => ({
          id: etapa.id,
          ...converterMinutosParaTempo(etapa.delayMinutos),
          conteudo: etapa.conteudo,
          ativo: etapa.ativo,
        }))
        : [{ id: crypto.randomUUID(), dias: 1, horas: 0, minutos: 0, conteudo: "", ativo: true }],
      ativo: template.ativo,
    });
  }

  async function salvarTemplate() {
    const etapasValidas = formCadencia.etapas.filter((etapa) => etapa.conteudo.trim().length > 0);
    if (!formCadencia.nome.trim() || etapasValidas.length === 0) {
      addToast({ type: "error", title: "Campos obrigatorios", description: "Preencha nome e mensagem da etapa." });
      return;
    }

    setSalvandoTemplate(true);
    const payload = {
      nome: formCadencia.nome.trim(),
      descricao: formCadencia.descricao.trim() || null,
      canal: "whatsapp" as const,
      ativo: formCadencia.ativo,
      permiteRepeticao: formCadencia.permiteRepeticao,
      maxCiclos: formCadencia.permiteRepeticao ? formCadencia.maxCiclos : 1,
      pausarSeResponder: true,
      etapas: etapasValidas.map((etapa, indice) => ({
        ordem: indice + 1,
        delayMinutos: converterTempoParaMinutos(etapa),
        conteudo: etapa.conteudo.trim(),
        ativo: etapa.ativo,
      })),
    };
    const resultado = editandoTemplateId
      ? await atualizarTemplateFollowUp(editandoTemplateId, payload)
      : await criarTemplateFollowUp(payload);
    setSalvandoTemplate(false);

    if (!resultado.ok) {
      addToast({ type: "error", title: "Erro ao salvar cadencia", description: resultado.erro });
      return;
    }

    addToast({ type: "success", title: editandoTemplateId ? "Cadencia atualizada" : "Cadencia criada" });
    setEditandoTemplateId(null);
    setFormCadencia(FORM_CADENCIA_INICIAL);
    await carregarTemplates();
  }

  async function removerTemplate(id: string) {
    const resultado = await excluirTemplateFollowUp(id);
    if (!resultado.ok) {
      addToast({ type: "error", title: "Erro ao excluir cadencia", description: resultado.erro });
      return;
    }
    addToast({ type: "success", title: "Cadencia removida" });
    if (editandoTemplateId === id) {
      setEditandoTemplateId(null);
      setFormCadencia(FORM_CADENCIA_INICIAL);
    }
    await carregarTemplates();
  }

  function adicionarEtapaCadencia() {
    setFormCadencia((prev) => ({
      ...prev,
      etapas: [...prev.etapas, { id: crypto.randomUUID(), dias: 1, horas: 0, minutos: 0, conteudo: "", ativo: true }],
    }));
  }

  function removerEtapaCadencia(etapaId: string) {
    setFormCadencia((prev) => {
      if (prev.etapas.length <= 1) return prev;
      return { ...prev, etapas: prev.etapas.filter((etapa) => etapa.id !== etapaId) };
    });
  }

  function atualizarEtapaCadencia(etapaId: string, campo: keyof FormCadenciaEtapa, valor: string | boolean) {
    setFormCadencia((prev) => ({
      ...prev,
      etapas: prev.etapas.map((etapa) => {
        if (etapa.id !== etapaId) return etapa;
        if (campo === "ativo") return { ...etapa, ativo: Boolean(valor) };
        if (campo === "conteudo") return { ...etapa, conteudo: String(valor) };
        const numero = Math.max(0, Math.floor(Number(valor) || 0));
        if (campo === "horas") return { ...etapa, horas: Math.min(23, numero) };
        if (campo === "minutos") return { ...etapa, minutos: Math.min(59, numero) };
        return { ...etapa, dias: numero };
      }),
    }));
  }

  return (
    <ModulePageShell>
      <ModulePageHeader
        title="Configuracoes"
        subtitle="Gerencie PDVs e estagios do funil."
        icon={(
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      />
      <InlineStatusAlert variant="error" message={vm.erro} />

      <section className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Atalhos de mensagem</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditandoId(null);
                setForm(FORM_INICIAL);
              }}
              className="h-8 rounded-lg"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Novo
            </Button>
          </div>

          <div className="space-y-2">
            {carregandoAtalhos ? <p className="text-xs text-[var(--text-secondary)]">Carregando atalhos...</p> : null}
            {!carregandoAtalhos && atalhos.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">Nenhum atalho criado ainda.</p>
            ) : null}
            {atalhos.map((atalho) => (
              <div key={atalho.id} className="rounded-xl border border-[var(--border-subtle)] bg-black/10 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="min-w-0 text-left" onClick={() => iniciarEdicao(atalho)}>
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">/{atalho.slug} · {atalho.nome}</p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">{atalho.conteudo}</p>
                    {atalho.tags.length > 0 ? (
                      <p className="mt-1 truncate text-[10px] text-[var(--text-tertiary)]">{atalho.tags.join(" • ")}</p>
                    ) : null}
                  </button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => void removerAtalho(atalho.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{tituloFormulario}</h2>
          <div className="space-y-3">
            <Input
              value={form.nome}
              onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
              placeholder="Nome interno"
            />
            <Input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value.replace(/^\//, "") }))}
              placeholder="atalho-sem-barra"
            />
            <Textarea
              value={form.conteudo}
              onChange={(event) => setForm((prev) => ({ ...prev, conteudo: event.target.value }))}
              placeholder="Olá {{lead_nome}}, tudo bem?"
              className="min-h-28"
            />
            <Input
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="vendas, followup, boas-vindas"
            />
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.checked }))}
              />
              Atalho ativo no chat
            </label>
            <Button type="button" onClick={() => void salvarAtalho()} disabled={salvando} className="w-full">
              <Save className="mr-1 h-4 w-4" />
              {salvando ? "Salvando..." : editandoId ? "Atualizar atalho" : "Criar atalho"}
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-black/10 p-3">
            <p className="mb-2 text-[11px] font-medium text-[var(--text-primary)]">Variáveis disponíveis</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIAVEIS_PRONTAS.map((variavel) => (
                <span key={variavel} className="rounded-md border border-[var(--border-subtle)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
                  {variavel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Cadencias de follow-up</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditandoTemplateId(null);
                setFormCadencia(FORM_CADENCIA_INICIAL);
              }}
              className="h-8 rounded-lg"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nova
            </Button>
          </div>

          <div className="space-y-2">
            {carregandoTemplates ? <p className="text-xs text-[var(--text-secondary)]">Carregando cadencias...</p> : null}
            {!carregandoTemplates && templates.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">Nenhuma cadencia criada ainda.</p>
            ) : null}
            {templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-[var(--border-subtle)] bg-black/10 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="min-w-0 text-left" onClick={() => iniciarEdicaoTemplate(template)}>
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{template.nome}</p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {template.etapas.length} etapas · {template.permiteRepeticao ? `repete ate ${template.maxCiclos} ciclos` : "sem repeticao"}
                    </p>
                    <p className="truncate text-[10px] text-[var(--text-tertiary)]">
                      {template.etapas.length > 0
                        ? template.etapas
                          .slice()
                          .sort((a, b) => a.ordem - b.ordem)
                          .map((etapa) => `#${etapa.ordem} ${resumoTempo(etapa.delayMinutos)}`)
                          .join(" · ")
                        : "Sem etapa"}
                    </p>
                  </button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => void removerTemplate(template.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{editandoTemplateId ? "Editar cadencia" : "Nova cadencia"}</h2>
          <div className="space-y-3">
            <Input value={formCadencia.nome} onChange={(event) => setFormCadencia((prev) => ({ ...prev, nome: event.target.value }))} placeholder="Nome da cadencia" />
            <Input value={formCadencia.descricao} onChange={(event) => setFormCadencia((prev) => ({ ...prev, descricao: event.target.value }))} placeholder="Descricao (opcional)" />

            <div className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-black/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[var(--text-primary)]">Passos da cadencia</p>
                <Button type="button" variant="outline" size="sm" onClick={adicionarEtapaCadencia} className="h-7 rounded-lg px-2">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Adicionar passo
                </Button>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)]">Cada passo dispara apenas se o lead nao responder ao passo anterior.</p>

              <div className="space-y-2">
                {formCadencia.etapas.map((etapa, indice) => (
                  <div key={etapa.id} className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Mensagem {indice + 1}</p>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removerEtapaCadencia(etapa.id)}
                        disabled={formCadencia.etapas.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={etapa.dias}
                        onChange={(event) => atualizarEtapaCadencia(etapa.id, "dias", event.target.value)}
                        placeholder="Dias"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={etapa.horas}
                        onChange={(event) => atualizarEtapaCadencia(etapa.id, "horas", event.target.value)}
                        placeholder="Horas"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={etapa.minutos}
                        onChange={(event) => atualizarEtapaCadencia(etapa.id, "minutos", event.target.value)}
                        placeholder="Minutos"
                      />
                    </div>

                    <p className="text-[10px] text-[var(--text-tertiary)]">Disparo em {resumoTempo(converterTempoParaMinutos(etapa))} depois da mensagem anterior.</p>

                    <Textarea
                      value={etapa.conteudo}
                      onChange={(event) => atualizarEtapaCadencia(etapa.id, "conteudo", event.target.value)}
                      placeholder={`Mensagem ${indice + 1}`}
                      className="min-h-20"
                    />

                    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={etapa.ativo}
                        onChange={(event) => atualizarEtapaCadencia(etapa.id, "ativo", event.target.checked)}
                      />
                      Passo ativo
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input type="checkbox" checked={formCadencia.permiteRepeticao} onChange={(event) => setFormCadencia((prev) => ({ ...prev, permiteRepeticao: event.target.checked }))} />
              Repetir ciclo
            </label>
            {formCadencia.permiteRepeticao ? (
              <Input type="number" min={1} max={365} value={formCadencia.maxCiclos} onChange={(event) => setFormCadencia((prev) => ({ ...prev, maxCiclos: Number(event.target.value) || 1 }))} placeholder="Maximo de ciclos" />
            ) : null}
            <p className="text-[11px] text-[var(--text-secondary)]">Se o lead responder, a cadencia e encerrada automaticamente e os proximos disparos sao cancelados.</p>
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input type="checkbox" checked={formCadencia.ativo} onChange={(event) => setFormCadencia((prev) => ({ ...prev, ativo: event.target.checked }))} />
              Cadencia ativa
            </label>

            <Button type="button" onClick={() => void salvarTemplate()} disabled={salvandoTemplate} className="w-full">
              <Save className="mr-1 h-4 w-4" />
              {salvandoTemplate ? "Salvando..." : editandoTemplateId ? "Atualizar cadencia" : "Criar cadencia"}
            </Button>
          </div>
        </div>
      </section>
    </ModulePageShell>
  );
}
