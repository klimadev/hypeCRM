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

const FORM_INICIAL: FormAtalho = {
  nome: "",
  slug: "",
  conteudo: "",
  tags: "",
  ativo: true,
};

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

  useEffect(() => {
    let ativo = true;

    const carregarInicial = async () => {
      setCarregandoAtalhos(true);
      const resultado = await listarAtalhosChat();
      if (!ativo) return;
      setCarregandoAtalhos(false);
      if (!resultado.ok) {
        addToast({ type: "error", title: "Erro ao carregar atalhos", description: resultado.erro });
        return;
      }
      setAtalhos(resultado.dados.atalhos);
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
    </ModulePageShell>
  );
}
