"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, Store, Trash2, Users, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UseEquipeModuleReturn, Pdv } from "../types";
import { Avatar } from "./shared/avatar";

type EquipeLojaGridProps = {
  vm: UseEquipeModuleReturn;
  drawerNovaLojaAberto: boolean;
  setDrawerNovaLojaAberto: (aberto: boolean) => void;
  onAbrirLoja: (loja: Pdv) => void;
};

export function EquipeLojaGrid({ vm, drawerNovaLojaAberto, setDrawerNovaLojaAberto, onAbrirLoja }: EquipeLojaGridProps) {
  const [nomeNovaLoja, setNomeNovaLoja] = useState("");
  const [editandoLojaId, setEditandoLojaId] = useState<string | null>(null);
  const [nomeEdicaoLoja, setNomeEdicaoLoja] = useState("");
  const [lojaParaExcluir, setLojaParaExcluir] = useState<Pdv | null>(null);

  const totalLojasSemWhats = vm.pdvs.filter((loja) => !loja.whatsapp_instancia).length;

  const aoCriarLoja = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const nome = nomeNovaLoja.trim();
    const criou = await vm.criarPdv(nome);

    if (criou) {
      setNomeNovaLoja("");
      setDrawerNovaLojaAberto(false);
    }
  };

  const iniciarEdicaoLoja = (loja: Pdv) => {
    setEditandoLojaId(loja.id);
    setNomeEdicaoLoja(loja.nome);
  };

  const cancelarEdicaoLoja = () => {
    setEditandoLojaId(null);
    setNomeEdicaoLoja("");
  };

  const salvarEdicaoLoja = async () => {
    if (!editandoLojaId || !nomeEdicaoLoja.trim()) return;

    const salvou = await vm.editarPdv(editandoLojaId, nomeEdicaoLoja.trim());
    if (salvou) {
      cancelarEdicaoLoja();
    }
  };

  const confirmarExclusaoLoja = async () => {
    if (!lojaParaExcluir) return;
    await vm.excluirPdv(lojaParaExcluir.id);
    setLojaParaExcluir(null);
  };

  if (vm.carregandoPdvs) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-8 text-sm text-[var(--text-secondary)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando suas lojas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Suas Lojas</p>
          <p className="text-xs text-[var(--text-secondary)]">Clique em uma loja para gerenciar as pessoas</p>
        </div>
        {totalLojasSemWhats > 0 ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.08)] px-3 py-2 text-xs text-[var(--warning)]">
            <WifiOff className="h-3.5 w-3.5" />
            {totalLojasSemWhats} {totalLojasSemWhats === 1 ? "loja sem WhatsApp" : "lojas sem WhatsApp"}
          </div>
        ) : null}
      </div>

      {vm.erroGestaoPdvs ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          <AlertCircle className="h-4 w-4" />
          {vm.erroGestaoPdvs}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vm.pdvs.map((loja) => {
          const emEdicao = editandoLojaId === loja.id;
          const salvando = vm.salvandoPdvId === loja.id;
          const pessoas = loja.funcionarios ?? [];
          const qtdePessoas = pessoas.length;

          return (
            <article
              key={loja.id}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface-elevated)] p-5 transition-all duration-200",
                "hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
                "active:scale-[0.99]",
                loja.alerta_configuracao
                  ? "border-[color:rgba(245,158,11,0.28)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))]"
                  : "border-[var(--border-subtle)]",
              )}
              onClick={() => !emEdicao && onAbrirLoja(loja)}
            >
              {emEdicao ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={nomeEdicaoLoja}
                    onChange={(e) => setNomeEdicaoLoja(e.target.value)}
                    disabled={salvando}
                    className="h-10 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]"
                    placeholder="Nome da loja"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-[var(--radius-control)]"
                      disabled={salvando || !nomeEdicaoLoja.trim()}
                      onClick={salvarEdicaoLoja}
                    >
                      {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-[var(--radius-control)]" disabled={salvando} onClick={cancelarEdicaoLoja}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[color:rgba(139,92,246,0.1)]">
                          <Store className="h-4 w-4 text-[var(--brand)]" />
                        </div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">{loja.nome}</h3>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Users className="h-4 w-4" />
                          <span>{qtdePessoas} {qtdePessoas === 1 ? "pessoa" : "pessoas"}</span>
                        </div>
                        {loja.whatsapp_instancia ? (
                          <div className="flex items-center gap-1.5 text-[var(--success)]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{loja.whatsapp_instancia.nome}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[var(--warning)]">
                            <WifiOff className="h-4 w-4" />
                            <span>Sem WhatsApp</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {vm.podeGerenciarEmpresa && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[color:rgba(255,255,255,0.06)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            iniciarEdicaoLoja(loja);
                          }}
                          title="Editar nome"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                        </button>
                        {qtdePessoas === 0 && (
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[color:rgba(244,63,94,0.08)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLojaParaExcluir(loja);
                            }}
                            title="Excluir loja"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {pessoas.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                      <div className="flex -space-x-2">
                        {pessoas.slice(0, 4).map((pessoa) => (
                          <Avatar key={pessoa.id} nome={pessoa.nome} tamanho="sm" />
                        ))}
                        {pessoas.length > 4 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.05)] text-xs font-medium text-[var(--text-secondary)]">
                            +{pessoas.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {vm.podeGerenciarEmpresa && (
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center transition-all duration-200 hover:border-[var(--brand)] hover:bg-[color:rgba(139,92,246,0.04)]"
            onClick={() => setDrawerNovaLojaAberto(true)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[color:rgba(139,92,246,0.08)]">
              <Plus className="h-5 w-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Adicionar Loja</p>
              <p className="text-xs text-[var(--text-secondary)]">Crie uma nova loja</p>
            </div>
          </button>
        )}
      </div>

      <Dialog
        open={Boolean(lojaParaExcluir)}
        onOpenChange={(aberto) => {
          if (!aberto) setLojaParaExcluir(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Loja</DialogTitle>
            <DialogDescription>
              Esta acao remove a loja permanentemente. Nao e possivel desfazer.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-[var(--text-secondary)]">
            Confirma a exclusao da loja <span className="font-semibold text-[var(--text-primary)]">{lojaParaExcluir?.nome}</span>?
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLojaParaExcluir(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-[var(--danger)] hover:bg-[var(--danger)]/90"
              onClick={confirmarExclusaoLoja}
              disabled={!lojaParaExcluir || vm.excluindoPdvId === lojaParaExcluir.id}
            >
              {lojaParaExcluir && vm.excluindoPdvId === lojaParaExcluir.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={drawerNovaLojaAberto} onOpenChange={setDrawerNovaLojaAberto}>
        <SheetContent side="right" className="w-full max-w-md bg-[var(--surface-elevated)]">
          <SheetHeader>
            <SheetTitle className="text-[var(--text-primary)]">Nova Loja</SheetTitle>
            <SheetDescription className="text-[var(--text-secondary)]">
              Crie uma nova loja para organizar sua equipe.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={aoCriarLoja} className="mt-6 space-y-4 px-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Nome da Loja</label>
              <Input
                name="nome"
                placeholder="Ex.: Loja Centro"
                required
                value={nomeNovaLoja}
                onChange={(e) => setNomeNovaLoja(e.target.value)}
                disabled={vm.criandoPdv}
                className="h-11"
                autoFocus
              />
            </div>

            <SheetFooter className="flex-col gap-2 sm:flex-col">
              <Button 
                type="submit" 
                disabled={vm.criandoPdv || !nomeNovaLoja.trim()} 
                className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white font-medium h-11"
              >
                {vm.criandoPdv ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Loja
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full rounded-xl" 
                disabled={vm.criandoPdv} 
                onClick={() => setDrawerNovaLojaAberto(false)}
              >
                Cancelar
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
