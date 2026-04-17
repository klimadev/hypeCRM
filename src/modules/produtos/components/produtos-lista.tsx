import { CalendarClock, CheckCircle2, CircleOff, Eye, Files, PencilLine, Rows3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { parseSchemaLayout } from "@/lib/api/produtos";
import type { UseProdutosCatalogoReturn } from "../types";

type ProdutosListaProps = {
  vm: UseProdutosCatalogoReturn;
};

export function ProdutosLista({ vm }: ProdutosListaProps) {
  if (vm.carregando) {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Card key={`skeleton-${indice}`} className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            <CardHeader className="space-y-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--shimmer-card-a)]" />
                  <div className="h-7 w-52 animate-pulse rounded-full bg-[var(--shimmer-card-a)]" />
                </div>
                <div className="h-11 w-24 animate-pulse rounded-[16px] bg-[var(--shimmer-card-a)]" />
              </div>
              <div className="h-20 animate-pulse rounded-[16px] bg-[var(--shimmer-card-a)]" />
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-0 sm:p-8 sm:pt-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-24 animate-pulse rounded-[16px] bg-[var(--shimmer-card-a)]" />
                <div className="h-24 animate-pulse rounded-[16px] bg-[var(--shimmer-card-a)]" />
                <div className="h-24 animate-pulse rounded-[16px] bg-[var(--shimmer-card-a)]" />
              </div>
              <div className="space-y-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
                <div className="h-12 animate-pulse rounded-[16px] bg-[var(--shimmer-card-b)]" />
                <div className="h-12 animate-pulse rounded-[16px] bg-[var(--shimmer-card-b)]" />
                <div className="h-12 animate-pulse rounded-[16px] bg-[var(--shimmer-card-b)]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (vm.falhaCarregamentoInicial) {
    return (
      <Card className="overflow-hidden rounded-[24px] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center sm:px-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-[20px] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)] shadow-[var(--shadow-sm)]">
            <CircleOff className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">Nao foi possivel carregar o catalogo</h3>
            <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">Tente atualizar a lista antes de criar ou editar templates.</p>
          </div>
          <Button onClick={() => void vm.recarregar()} className="h-12 rounded-[16px] bg-[var(--brand)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--brand-strong)]">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (vm.produtos.length === 0) {
    return (
      <Card className="overflow-hidden rounded-[24px] border-dashed border-[var(--border-strong)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--brand)_14%,transparent),transparent_26%),var(--surface)] shadow-[var(--shadow-sm)]">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-16 text-center sm:px-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-[20px] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)] shadow-[var(--shadow-sm)]">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">Crie o primeiro template de produto</h3>
            <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">Monte o formulario e use no lead.</p>
          </div>
          <Button onClick={vm.abrirCriacao} className="h-12 rounded-[16px] bg-[var(--brand)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--brand-strong)]">
            <Files className="mr-2 h-4 w-4" />
            Criar primeiro produto
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Catalogo</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-xl">Produtos prontos para o time usar</h3>
        </div>
        <div className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)]">
          {vm.totalProdutos} {vm.totalProdutos === 1 ? "template" : "templates"}
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-2">
      {vm.produtos.map((produto) => {
        const schema = parseSchemaLayout(produto.schema_layout);
        const camposResumo = schema.campos.filter((campo) => campo.visivelNoResumo);
        const camposObrigatorios = schema.campos.filter((campo) => campo.obrigatorio).length;
        const atualizadoEm = new Date(produto.atualizado_em).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return (
          <Card
            key={produto.id}
            className={cn(
              "overflow-hidden rounded-[16px] border shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
              produto.ativo
                ? "border-[var(--border-subtle)] bg-[var(--surface)]"
                : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:shadow-[var(--shadow-sm)]",
            )}
          >
            <CardHeader className="space-y-4 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={produto.ativo ? "success" : "secondary"}>{produto.ativo ? "Ativo" : "Inativo"}</Badge>
                    <Badge variant="info">{schema.campos.length} campos</Badge>
                    {camposObrigatorios > 0 ? <Badge variant="secondary">{camposObrigatorios} obrigatorios</Badge> : null}
                  </div>
                  <CardTitle className="flex items-start gap-3 text-[var(--text-primary)]">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[14px] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)] ring-1 ring-[color-mix(in_srgb,var(--success)_20%,transparent)]">
                      <Rows3 className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-xl">{produto.nome}</span>
                      <p className="max-w-2xl text-sm font-normal leading-6 text-[var(--text-secondary)]">
                        {produto.descricao || "Formulario interno para uso no lead."}
                      </p>
                    </div>
                  </CardTitle>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => vm.abrirEdicao(produto)} className="h-10 rounded-xl px-4 sm:w-auto">
                  <PencilLine className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    <Eye className="h-3.5 w-3.5" />
                    Resumo visivel
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{camposResumo.length}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">campos no resumo rapido</p>
                </div>
                <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    {produto.ativo ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" /> : <CircleOff className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
                    Status operacional
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{produto.ativo ? "Pronto" : "Pausado"}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{produto.ativo ? "Disponivel para novos leads" : "Mantido sem uso imediato"}</p>
                </div>
                <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Atualizacao
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{atualizadoEm}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">ultima revisao registrada</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Perguntas que o time vai enxergar</p>

                {schema.campos.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                    Sem campos configurados.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {schema.campos.slice(0, 4).map((campo) => (
                      <div key={campo.id} className="flex flex-col gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text-primary)]">{campo.label}</p>
                          <p className="truncate text-xs text-[var(--text-tertiary)]">{campo.placeholder || campo.ajuda || "Campo do formulario."}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {campo.obrigatorio ? <Badge variant="secondary">Obrigatorio</Badge> : null}
                          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">{campo.tipo}</span>
                        </div>
                      </div>
                    ))}
                    {schema.campos.length > 4 ? (
                      <p className="text-xs font-medium text-[var(--text-tertiary)]">+ {schema.campos.length - 4} campos</p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
                <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                <span className="rounded-full border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] px-3 py-1 text-[var(--success)]">Interno</span>
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1">Lead</span>
                <span className="rounded-full border border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[color-mix(in_srgb,var(--info)_14%,transparent)] px-3 py-1 text-[var(--info)]">Dinamico</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => vm.abrirEdicao(produto)} className="rounded-xl px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Abrir painel
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
