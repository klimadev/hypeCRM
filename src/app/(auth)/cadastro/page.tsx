"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function PaginaCadastroEmpresa() {
  const router = useRouter();
  const { addToast } = useToast();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoCadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    const dados = new FormData(evento.currentTarget);
    const nome = String(dados.get("nome") ?? "");
    const email = String(dados.get("email") ?? "");
    const senha = String(dados.get("senha") ?? "");

    let resposta;
    let json = {};

    try {
      resposta = await fetch("/api/autenticacao/cadastro-empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      json = await resposta.json().catch(() => ({}));
    } catch {
      setErro("Erro de conexao. Verifique sua internet e tente novamente.");
      setCarregando(false);
      return;
    }

    if (!resposta.ok) {
      const erroApi = (json as { erro?: string }).erro;
      const mensagem = erroApi
        ?? (resposta.status === 409 ? "Este e-mail ja esta cadastrado ou possui um trial."
        : resposta.status === 429 ? "Muitas contas foram criadas nesta rede. Tente mais tarde ou use outro endereco."
        : resposta.status === 0 ? "Servidor indisponivel. Tente mais tarde."
        : "Falha ao criar conta. Tente novamente.");
      setErro(mensagem);
      setCarregando(false);
      return;
    }

    setErro(null);
    setCarregando(false);
    addToast({ type: "success", title: "Conta criada com sucesso!" });
    router.push("/resumo");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-60" />
      <section className="glass-panel relative w-full max-w-md rounded-[var(--radius-shell)] border border-[var(--border-subtle)] px-6 py-6 shadow-[var(--shadow-overlay)] md:px-7">
        <div className="mb-6 space-y-3">
          <span className="inline-flex rounded-full border border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">
            Trial onboarding
          </span>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Criar conta da empresa</h1>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">Ao cadastrar, o funil inicial sera criado automaticamente.</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={aoCadastrar}>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Nome da empresa</label>
            <Input name="nome" required />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">E-mail</label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Senha</label>
            <Input name="senha" type="password" minLength={6} required />
          </div>

          {erro ? (
            <p className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.12)] px-3 py-2 text-sm text-[var(--danger)]">
              {erro}
            </p>
          ) : null}

          <Button className="w-full" disabled={carregando}>
            {carregando ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[var(--text-secondary)]">
          Ja possui conta?{" "}
          <a className="font-medium text-[var(--brand)] underline decoration-[color:rgba(139,92,246,0.4)] underline-offset-4" href="/login">
            Fazer login
          </a>
        </p>
      </section>
    </main>
  );
}
