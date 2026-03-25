"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PaginaLogin() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEntrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    const dados = new FormData(evento.currentTarget);
    const email = String(dados.get("email") ?? "");
    const senha = String(dados.get("senha") ?? "");

    let resposta;
    let json = {};

    try {
      resposta = await fetch("/api/autenticacao/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
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
        ?? (resposta.status === 401 ? "E-mail ou senha incorretos."
        : resposta.status === 0 ? "Servidor indisponivel. Tente mais tarde."
        : "Falha ao fazer login. Tente novamente.");
      setErro(mensagem);
      setCarregando(false);
      return;
    }

    setCarregando(false);
    router.push("/resumo");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-60" />
      <section className="glass-panel relative w-full max-w-md rounded-[var(--radius-shell)] border border-[var(--border-subtle)] px-6 py-6 shadow-[var(--shadow-overlay)] md:px-7">
        <div className="mb-6 space-y-3">
          <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Workspace access
          </span>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Entrar no HYPE CRM</h1>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">Use seu e-mail e senha da empresa ou funcionario.</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={aoEntrar}>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">E-mail</label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Senha</label>
            <Input name="senha" type="password" required />
          </div>

          {erro ? (
            <p className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.12)] px-3 py-2 text-sm text-[var(--danger)]">
              {erro}
            </p>
          ) : null}

          <Button className="w-full" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[var(--text-secondary)]">
          Sem conta?{" "}
          <a className="font-medium text-[var(--brand)] underline decoration-[color:rgba(139,92,246,0.4)] underline-offset-4" href="/cadastro">
            Cadastre sua empresa
          </a>
        </p>
      </section>
    </main>
  );
}
