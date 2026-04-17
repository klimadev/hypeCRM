"use client";

import { useMemo, useState } from "react";
import { Boxes, Loader2, PackagePlus, PencilLine, Trash2 } from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { atualizarProduto, criarProduto, listarProdutos, removerProduto, type Produto } from "@/lib/api/produtos";

type ModuloProdutosProps = {
  produtosIniciais: Produto[];
  erroInicial: string | null;
};

type FormState = {
  nome: string;
  descricao: string;
  ativo: boolean;
};

const formVazio: FormState = { nome: "", descricao: "", ativo: true };

export function ModuloProdutos({ produtosIniciais, erroInicial }: ModuloProdutosProps) {
  const { addToast } = useToast();
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [erro, setErro] = useState<string | null>(erroInicial);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState<FormState>(formVazio);

  const totalAtivos = useMemo(() => produtos.filter((item) => item.ativo).length, [produtos]);

  async function recarregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarProdutos();
    setCarregando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setProdutos(resultado.dados.produtos);
  }

  function abrirCriacao() {
    setEditando(null);
    setForm(formVazio);
    setDialogAberto(true);
  }

  function abrirEdicao(produto: Produto) {
    setEditando(produto);
    setForm({ nome: produto.nome, descricao: produto.descricao ?? "", ativo: produto.ativo });
    setDialogAberto(true);
  }

  async function salvar() {
    if (form.nome.trim().length < 2) {
      setErro("Nome do produto deve ter ao menos 2 caracteres.");
      return;
    }
    setSalvando(true);
    setErro(null);
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
    };
    const resultado = editando ? await atualizarProduto(editando.id, payload) : await criarProduto(payload);
    setSalvando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setDialogAberto(false);
    await recarregar();
    addToast({ type: "success", title: editando ? "Produto atualizado" : "Produto criado", description: `${resultado.dados.produto.nome} salvo com sucesso.` });
  }

  async function alternarStatus(produto: Produto) {
    setErro(null);
    const resultado = await atualizarProduto(produto.id, { ativo: !produto.ativo });
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setProdutos((atual) => atual.map((item) => (item.id === produto.id ? resultado.dados.produto : item)));
  }

  async function remover(id: string) {
    setRemovendoId(id);
    setErro(null);
    const resultado = await removerProduto(id);
    setRemovendoId(null);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setProdutos((atual) => atual.filter((item) => item.id !== id));
    addToast({ type: "success", title: "Produto removido", description: "Catalogo atualizado." });
  }

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Catalogo de produtos"
        subtitle="Cadastro simples para o time operar sem template complexo."
        icon={<Boxes className="h-6 w-6" />}
        badges={[<Badge key="total" variant="secondary">{produtos.length} itens</Badge>, <Badge key="ativos" variant="success">{totalAtivos} ativos</Badge>]}
        actions={<Button onClick={abrirCriacao}><PackagePlus className="mr-2 h-4 w-4" />Novo produto</Button>}
      />

      {erro ? <div className="rounded-[12px] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] p-3 text-sm text-[var(--danger)]">{erro}</div> : null}

      {carregando ? (
        <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : produtos.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-[var(--text-secondary)]">Nenhum produto cadastrado.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {produtos.map((produto) => (
            <Card key={produto.id}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{produto.nome}</p>
                    <p className="mt-1 text-sm font-normal text-[var(--text-secondary)]">{produto.descricao || "Sem descricao."}</p>
                  </div>
                  <Badge variant={produto.ativo ? "success" : "secondary"}>{produto.ativo ? "Ativo" : "Inativo"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => abrirEdicao(produto)}><PencilLine className="mr-2 h-4 w-4" />Editar</Button>
                <Button variant="outline" size="sm" onClick={() => void alternarStatus(produto)}>{produto.ativo ? "Inativar" : "Ativar"}</Button>
                <Button variant="outline" size="sm" className="text-[var(--danger)]" onClick={() => void remover(produto.id)} disabled={removendoId === produto.id}>
                  {removendoId === produto.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Remover
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editando ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={form.nome} onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))} placeholder="Nome" />
            <Textarea value={form.descricao} onChange={(event) => setForm((atual) => ({ ...atual, descricao: event.target.value }))} placeholder="Descricao interna" />
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={form.ativo ? "default" : "outline"} onClick={() => setForm((atual) => ({ ...atual, ativo: true }))}>Ativo</Button>
              <Button type="button" size="sm" variant={!form.ativo ? "default" : "outline"} onClick={() => setForm((atual) => ({ ...atual, ativo: false }))}>Inativo</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button onClick={() => void salvar()} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  );
}
