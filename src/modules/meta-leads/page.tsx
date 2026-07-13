"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  PlugZap,
  Plus,
  Power,
  PowerOff,
  RefreshCcw,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMetaLeadsModule } from "./hooks/use-meta-leads-module";
import type { ModuloMetaLeadsProps, MetaLeadsToken, MetaLeadsTestResult, MetaLeadSample, CampoMapping, CampoMappingForm } from "./types";

function formatarData(iso: string | null) {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("pt-BR");
}

function extrairCampoLead(lead: MetaLeadSample, campo: string): string {
  const f = lead.field_data.find((fd) => fd.name === campo);
  return f?.values?.[0] ?? "—";
}

function LeadCard({ lead }: { lead: MetaLeadSample }) {
  return (
    <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {extrairCampoLead(lead, "full_name") || extrairCampoLead(lead, "name") || "Sem nome"}
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {new Date(lead.created_time).toLocaleDateString("pt-BR")}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          {extrairCampoLead(lead, "phone_number") || extrairCampoLead(lead, "email") || "—"}
        </p>
        <p className="text-[11px] text-[var(--text-tertiary)] truncate">
          ID: {lead.id}
        </p>
      </CardContent>
    </Card>
  );
}

export function ModuloMetaLeads({ perfil }: ModuloMetaLeadsProps) {
  const vm = useMetaLeadsModule();

  // Token manual input
  const [tokenInput, setTokenInput] = useState("");
  const [tokensAdicionados, setTokensAdicionados] = useState<Array<{ raw: string; pageId: string; pageName: string }>>([]);

  // UI state
  const [testando, setTestando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [feedbackErro, setFeedbackErro] = useState<string | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);
  const [dadosTeste, setDadosTeste] = useState<MetaLeadsTestResult | null>(null);
  const [syncResult, setSyncResult] = useState<{ importados: number; ignorados: number; debug: string[] } | null>(null);

  // Mapping state
  const [campoMapping, setCampoMapping] = useState<CampoMapping>({});
  const [formSkip, setFormSkip] = useState<Record<string, boolean>>({}); // true = skip

  // ponytail: sincronizar config inicial + mapping
  useEffect(() => {
    if (vm.config) {
      if (vm.config.pageTokens.length) {
        setTokensAdicionados(
          vm.config.pageTokens.map((t) => ({
            raw: t.token,
            pageId: t.pageId,
            pageName: t.pageName,
          })),
        );
      }
      if (vm.config.campoMapping) {
        setCampoMapping(vm.config.campoMapping);
        const skip: Record<string, boolean> = {};
        for (const formId of (vm.config.campoMapping as any)._skip ?? []) {
          skip[formId] = true;
        }
        setFormSkip(skip);
      }
    }
  }, [vm.config]);

  const ativo = vm.config?.ativo ?? false;
  const temTokens = tokensAdicionados.length > 0;

  function adicionarToken() {
    const tok = tokenInput.trim();
    if (!tok) return;

    // Extrai page info colando token + opcionalmente pageId:pageName
    // Por enquanto so salva o token bruto, o test resolve pageId/name
    setTokensAdicionados((prev) => [
      ...prev,
      { raw: tok, pageId: "", pageName: `Token ${prev.length + 1}` },
    ]);
    setTokenInput("");
    setFeedbackErro(null);
  }

  function removerToken(index: number) {
    setTokensAdicionados((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleTestar() {
    setTestando(true);
    setFeedbackErro(null);
    setFeedbackSucesso(null);
    setDadosTeste(null);

    try {
      // Envia tokens brutos pro servidor — ele extrai page tokens via /me/accounts
      const res = await vm.testarConexao(
        tokensAdicionados.map((t) => ({ raw: t.raw, pageId: t.pageId, pageName: t.pageName })),
      );
      if (res.sucesso && res.dados) {
        setDadosTeste(res.dados);
        // Substitui tokens pelas páginas extraídas com Page Tokens
        setTokensAdicionados(
          res.dados.pages.map((p) => ({
            raw: p.token,
            pageId: p.pageId,
            pageName: p.pageName,
          })),
        );
        // Init mapping: keep saved, use auto_mapping for new forms
        const novoMapping = { ...campoMapping };
        for (const page of res.dados.pages) {
          for (const form of page.forms) {
            if (!novoMapping[form.id]) {
              novoMapping[form.id] = form.auto_mapping;
            }
          }
        }
        setCampoMapping(novoMapping);
        setFeedbackSucesso("Conexao testada com sucesso!");
      } else {
        setFeedbackErro(res.erro ?? "Erro ao testar conexao.");
      }
    } catch {
      setFeedbackErro("Erro de rede ao testar conexao com a Meta.");
    } finally {
      setTestando(false);
    }
  }

  async function handleAtivar() {
    setSalvando(true);
    setFeedbackErro(null);
    const tokens: MetaLeadsToken[] = tokensAdicionados.map((t) => ({
      pageId: t.pageId,
      pageName: t.pageName,
      token: t.raw,
    }));
    // ponytail: incluir skip list no mapping
    const skipForms = Object.entries(formSkip).filter(([, v]) => v).map(([k]) => k);
    const mappingFinal = { ...campoMapping };
    if (skipForms.length) (mappingFinal as any)._skip = skipForms;
    const res = await vm.salvarConfig(tokens, true, mappingFinal);
    if (res.sucesso) {
      setFeedbackSucesso("Integracao ativada! Leads serao sincronizados a cada 5 minutos.");
      setDadosTeste(null);
    } else {
      setFeedbackErro(res.erro ?? "Erro ao salvar.");
    }
    setSalvando(false);
  }

  async function handleDesativar() {
    const tokens: MetaLeadsToken[] = tokensAdicionados.map((t) => ({
      pageId: t.pageId,
      pageName: t.pageName,
      token: t.raw,
    }));
    await vm.salvarConfig(tokens, false);
    setFeedbackSucesso("Integracao desativada.");
    setSyncResult(null);
  }

  async function handleSyncManual() {
    setSincronizando(true);
    setFeedbackErro(null);
    const res = await vm.syncAgora();
    if (res) {
      setSyncResult({ importados: res.total_importados, ignorados: res.total_ignorados, debug: res.debug ?? [] });
      setFeedbackSucesso(`Sync concluido: ${res.total_importados} importados, ${res.total_ignorados} ignorados.`);
    } else {
      setFeedbackErro("Erro ao sincronizar.");
    }
    setSincronizando(false);
  }

  function handleMappingChange(formId: string, campo: keyof CampoMappingForm, value: string) {
    setCampoMapping(prev => ({
      ...prev,
      [formId]: { ...prev[formId], [campo]: value },
    }));
  }

  function handleFormSkipToggle(formId: string) {
    setFormSkip(prev => ({ ...prev, [formId]: !prev[formId] }));
  }

  const totalLeadsPreview = dadosTeste?.pages.reduce((sum, p) => sum + p.leads.length, 0) ?? 0;

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Meta Lead Ads"
        subtitle="Conecte a Central de Leads do Facebook e Instagram para importar leads automaticamente."
        icon={<Users className="h-5 w-5" />}
        iconTone="blue"
        className="px-4 py-4 md:px-5 md:py-4"
        badges={[
          ativo ? (
            <Badge key="status" variant="success" dot>
              Sincronizacao Ativa
            </Badge>
          ) : (
            <Badge key="status" variant="secondary">
              Nao configurado
            </Badge>
          ),
          temTokens ? (
            <Badge key="tokens" variant="info" dot>
              {tokensAdicionados.length} pagina(s)
            </Badge>
          ) : null,
        ].filter(Boolean)}
      />

      {vm.carregando && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      )}

      {!vm.carregando && (vm.erro || feedbackErro) && (
        <InlineStatusAlert variant="error" message={vm.erro ?? feedbackErro ?? ""} />
      )}

      {!vm.carregando && feedbackSucesso && !feedbackErro && (
        <InlineStatusAlert variant="success" message={feedbackSucesso} />
      )}

      {!vm.carregando && (
        <>
          {/* Estado 3: Ativo */}
          {ativo && (
            <div className="space-y-4">
              <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
                      <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Integracao Ativa</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Sincronizando a cada 5 minutos. Ultima sync: {formatarData(vm.config?.ultimaSync ?? null)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncManual}
                      disabled={sincronizando}
                    >
                      {sincronizando ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <RefreshCcw className="h-4 w-4 mr-1" />
                      )}
                      Sincronizar Agora
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDesativar}
                      className="text-[var(--danger)] border-[var(--danger-border)] hover:bg-[var(--danger-bg)]"
                    >
                      <PowerOff className="h-4 w-4 mr-1" />
                      Desativar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {syncResult && (
                <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resultado da ultima sincronizacao</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-4 text-sm">
                      <span className="text-[var(--success)]">{syncResult.importados} importados</span>
                      <span className="text-[var(--text-tertiary)]">{syncResult.ignorados} ignorados (ja existiam)</span>
                    </div>
                    {syncResult.debug.length > 0 && (
                      <details className="text-xs text-[var(--text-tertiary)] mt-2">
                        <summary className="cursor-pointer hover:text-[var(--text-primary)]">
                          Ver debug ({syncResult.debug.length} linhas)
                        </summary>
                        <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 font-mono text-[11px] leading-relaxed">
                          {syncResult.debug.join('\n')}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ponytail: mostrar mapping ativo */}
              {vm.config?.campoMapping && Object.keys(vm.config.campoMapping).length > 0 && (
                <details className="text-xs text-[var(--text-tertiary)]">
                  <summary className="cursor-pointer hover:text-[var(--text-primary)] font-medium">
                    Mapeamento de campos ({Object.keys(vm.config.campoMapping).length} formulario(s))
                  </summary>
                  <div className="mt-2 space-y-2">
                    {Object.entries(vm.config.campoMapping).map(([formId, m]) => {
                      if (formId === '_skip') return null;
                      const skipList = (vm.config?.campoMapping as any)._skip ?? [];
                      const skipped = skipList.includes(formId);
                      return (
                        <div key={formId} className={`rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 ${skipped ? 'opacity-50' : ''}`}>
                          <p className="text-xs text-[var(--text-tertiary)]">Form: {formId}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs">Nome: <strong className="text-[var(--text-primary)]">{m.nome || 'auto'}</strong></span>
                            <span className="text-xs">Tel: <strong className="text-[var(--text-primary)]">{m.telefone || 'auto'}</strong></span>
                            <span className="text-xs">Email: <strong className="text-[var(--text-primary)]">{m.email || 'auto'}</strong></span>
                            {skipped && <Badge variant="warning" size="sm">Pulado</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}

              {tokensAdicionados.map((t, i) => (
                <Card key={i} className="border-[var(--border-subtle)] bg-[var(--surface)]">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{t.pageName}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">Page ID: {t.pageId || "—"}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate max-w-md">
                        Token: {t.raw.slice(0, 20)}...{t.raw.slice(-10)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Estados 1 e 2: Configuracao + Preview */}
          {!ativo && (
            <div className="space-y-4">
              {/* Tokens input */}
              <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
                <CardHeader>
                  <CardTitle>Tokens de Acesso</CardTitle>
                  <CardDescription>
                    Cole um ou mais User Tokens do Facebook. O sistema extrai automaticamente os Page Tokens de cada pagina que voce administra.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="EAA..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") adicionarToken(); }}
                      className="flex-1"
                    />
                    <Button onClick={adicionarToken} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {tokensAdicionados.length > 0 && (
                    <div className="space-y-2">
                      {tokensAdicionados.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{t.pageName}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {t.raw.slice(0, 20)}...{t.raw.slice(-10)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerToken(i)}
                            className="text-[var(--danger)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleTestar}
                    disabled={!temTokens || testando}
                    className="w-full"
                  >
                    {testando ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <PlugZap className="h-4 w-4 mr-1" />
                    )}
                    Testar Conexao
                  </Button>
                </CardContent>
              </Card>

              {/* Preview pos-teste */}
              {dadosTeste && (
                <div className="space-y-4">
                  {dadosTeste.pages.map((page, pi) => (
                    <Card key={pi} className="border-[var(--border-subtle)] bg-[var(--surface)]">
                      <CardHeader>
                        <CardTitle className="text-base">{page.pageName}</CardTitle>
                        <CardDescription>
                          Page ID: {page.pageId} · {page.forms.length} formulario(s) · {page.leads.length} lead(s) de preview
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {page.forms.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] mb-2">
                              Formularios encontrados
                            </p>
                            <div className="space-y-2">
                              {page.forms.map((form) => (
                                <div
                                  key={form.id}
                                  className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm text-[var(--text-primary)]">{form.name}</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">ID: {form.id}</p>
                                  </div>
                                  <Badge variant={form.status === "ACTIVE" ? "success" : "secondary"}>
                                    {form.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {page.leads.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] mb-2">
                              Preview dos leads (ultimos {page.leads.length})
                            </p>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                              {page.leads.map((lead) => (
                                <LeadCard key={lead.id} lead={lead} />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* ponytail: wizard de mapping */}
                  <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
                    <CardHeader>
                      <CardTitle className="text-base">Mapeamento de Campos</CardTitle>
                      <CardDescription>
                        Configure de qual campo de cada formulario extrair nome, telefone e email. Formularios nao mapeados usam deteccao automatica.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dadosTeste.pages.flatMap(page =>
                        page.forms.map(form => {
                          const mapping = campoMapping[form.id] ?? form.auto_mapping;
                          const skipped = formSkip[form.id] ?? false;
                          return (
                            <div
                              key={form.id}
                              className={`rounded-lg border p-4 space-y-3 ${skipped ? 'border-[var(--warning-border)] opacity-60' : 'border-[var(--border-subtle)]'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-[var(--text-primary)]">{form.name}</p>
                                  <p className="text-xs text-[var(--text-tertiary)]">{page.pageName} · ID: {form.id}</p>
                                </div>
                                <label className="flex items-center gap-2 text-xs cursor-pointer whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={skipped}
                                    onChange={() => handleFormSkipToggle(form.id)}
                                    className="h-4 w-4 rounded border-[var(--border-subtle)]"
                                  />
                                  Pular
                                </label>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {form.campos_disponiveis.map(c => (
                                  <span key={c} className="inline-flex rounded bg-[var(--surface-elevated)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-tertiary)]">
                                    {c}
                                  </span>
                                ))}
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                {(['nome', 'telefone', 'email'] as const).map(campo => (
                                  <div key={campo} className="space-y-1">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] capitalize">
                                      {campo === 'nome' ? 'Nome' : campo === 'telefone' ? 'Telefone' : 'E-mail'}
                                    </label>
                                    <select
                                      value={mapping?.[campo] ?? ''}
                                      onChange={e => handleMappingChange(form.id, campo, e.target.value)}
                                      disabled={skipped}
                                      className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] disabled:opacity-50"
                                    >
                                      <option value="">— Auto-detect</option>
                                      {form.campos_disponiveis.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-[var(--success-border)] bg-[var(--success-bg)]">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">
                          Pronto para ativar!
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {totalLeadsPreview} leads encontrados no preview. Ao ativar, novos leads serao importados automaticamente a cada 5 minutos.
                        </p>
                      </div>
                      <Button onClick={handleAtivar} disabled={salvando}>
                        {salvando ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Power className="h-4 w-4 mr-1" />
                        )}
                        Ativar Integracao
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Como funciona */}
              {!dadosTeste && (
                <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
                  <CardHeader>
                    <CardTitle className="text-base">Como funciona</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">1</span>
                        <p>Cole seu <strong className="text-[var(--text-primary)]">User Token</strong> do Facebook com permissoes de leads_retrieval e pages_show_list</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">2</span>
                        <p>O sistema extrai os <strong className="text-[var(--text-primary)]">Page Tokens</strong> e busca formularios e leads de teste</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">3</span>
                        <p>Revise os leads de preview e clique em <strong className="text-[var(--text-primary)]">Ativar</strong></p>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">4</span>
                        <p>Novos leads serao importados automaticamente a cada <strong className="text-[var(--text-primary)]">5 minutos</strong></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </ModulePageShell>
  );
}
