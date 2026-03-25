import { Suspense } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, Wallet, Target, CircleDollarSign, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { formataMoeda } from "@/lib/utils";
import { DIAS_ESTAGIO_PARADO } from "@/lib/validacoes";

const GraficoVendas = dynamic(
  () => import("@/components/grafico-vendas").then((mod) => ({ default: mod.GraficoVendas })),
  {
    loading: () => (
      <div className="flex h-[280px] w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--surface-elevated)]">
        <Skeleton className="h-[280px] w-full animate-shimmer rounded-[var(--radius-card)]" />
      </div>
    ),
  }
);

const AgendaWidgetWrapper = dynamic(
  () => import("@/components/agenda-widget-wrapper").then((mod) => ({ default: mod.AgendaWidgetWrapper })),
  {
    loading: () => (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 shrink-0" rounded="control" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    ),
  }
);

const prismaCalCom = prisma as typeof prisma & {
  calComInstancia: {
    count: (args: { where: { id_empresa: string; status: string } }) => Promise<number>;
  };
};

function leadTemPendencias(
  lead: { atualizado_em: Date; estagio: { tipo: string } }
): boolean {
  const hoje = new Date();
  const dataLimiteEstagioParado = new Date(hoje);
  dataLimiteEstagioParado.setDate(dataLimiteEstagioParado.getDate() - DIAS_ESTAGIO_PARADO);

  const isGanhoOuPerdido = lead.estagio.tipo === "GANHO" || lead.estagio.tipo === "PERDIDO";
  const isEstagioParado = lead.atualizado_em < dataLimiteEstagioParado;

  return !isGanhoOuPerdido && isEstagioParado;
}

// === Parallel data fetches (started at page level, not awaited) ===

function buscarLeads(sessao: { id_empresa: string; id_usuario: string; perfil: string }) {
  const whereLeads =
    sessao.perfil === "COLABORADOR"
      ? { id_empresa: sessao.id_empresa, id_funcionario: sessao.id_usuario }
      : { id_empresa: sessao.id_empresa };

  return prisma.lead.findMany({
    where: whereLeads,
    include: { estagio: true },
  });
}

function buscarCalCom(sessao: { id_empresa: string }) {
  return prismaCalCom.calComInstancia.count({
    where: { id_empresa: sessao.id_empresa, status: "active" },
  });
}

// === Skeletons for Suspense fallbacks ===

function KpiGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0" rounded="card" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-[var(--radius-card)]" />
        </CardContent>
      </Card>
    </div>
  );
}

// === Async Server Components with own data fetching ===

async function ResumoKpiGrid({ leadsPromise }: { leadsPromise: Promise<any[]> }) {
  const leads = await leadsPromise;

  const gainsWithAllPendenciesResolved = leads.filter((lead) => {
    if (lead.estagio.tipo !== "GANHO") return false;
    return !leadTemPendencias(lead);
  });

  const lostsWithAllPendenciesResolved = leads.filter((lead) => {
    if (lead.estagio.tipo !== "PERDIDO") return false;
    return !leadTemPendencias(lead);
  });

  const totalAberto = leads
    .filter((lead) => lead.estagio.tipo === "ABERTO")
    .reduce((acc, lead) => acc + lead.valor_oportunidade, 0);

  const ganhos = gainsWithAllPendenciesResolved;
  const perdidos = lostsWithAllPendenciesResolved;
  const totalGanho = ganhos.reduce((acc, lead) => acc + lead.valor_oportunidade, 0);
  const taxaConversao = ganhos.length + perdidos.length > 0
    ? (ganhos.length / (ganhos.length + perdidos.length)) * 100
    : 0;

  const cardsResumo = [
    {
      titulo: "Total em aberto",
      valor: formataMoeda(totalAberto),
      descricao: "Pipeline ativo aguardando fechamento.",
      icone: Wallet,
      tone: "text-[var(--brand)]",
    },
    {
      titulo: "Total fechado",
      valor: formataMoeda(totalGanho),
      descricao: "Receita confirmada no funil atual.",
      icone: CircleDollarSign,
      tone: "text-[var(--success)]",
    },
    {
      titulo: "Vendas fechadas",
      valor: String(ganhos.length),
      descricao: "Oportunidades ganhas sem pendencias.",
      icone: Target,
      tone: "text-[var(--info)]",
    },
    {
      titulo: "Taxa de conversao",
      valor: `${taxaConversao.toFixed(1)}%`,
      descricao: "Relacao entre ganhos e oportunidades encerradas.",
      icone: TrendingUp,
      tone: "text-[var(--warning)]",
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cardsResumo.map((card) => {
        const Icone = card.icone;
        return (
          <Card key={card.titulo} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-2">
                <CardTitle className="text-sm font-semibold tracking-tight text-[var(--text-secondary)]">{card.titulo}</CardTitle>
                <p className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">{card.valor}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] shadow-[var(--shadow-sm)]">
                <Icone className={`h-4.5 w-4.5 ${card.tone}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{card.descricao}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function ResumoChart({ leadsPromise }: { leadsPromise: Promise<any[]> }) {
  const leads = await leadsPromise;

  const ganhos = leads.filter((lead) => {
    if (lead.estagio.tipo !== "GANHO") return false;
    return !leadTemPendencias(lead);
  });

  const agora = new Date();
  const meses = Array.from({ length: 6 }).map((_, index) => {
    const data = new Date(agora.getFullYear(), agora.getMonth() - (5 - index), 1);
    return {
      chave: `${data.getFullYear()}-${data.getMonth() + 1}`,
      mes: data.toLocaleDateString("pt-BR", { month: "short" }),
      total: 0,
    };
  });

  for (const lead of ganhos) {
    const chave = `${lead.criado_em.getFullYear()}-${lead.criado_em.getMonth() + 1}`;
    const alvo = meses.find((mes) => mes.chave === chave);
    if (alvo) {
      alvo.total += lead.valor_oportunidade;
    }
  }

  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Vendas (ultimos meses)</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Historico consolidado das oportunidades ganhas.</p>
          </div>
          <Badge variant="info" dot>
            Tendencia recente
          </Badge>
        </CardHeader>
        <CardContent>
          <GraficoVendas dados={meses.map((m) => ({ mes: m.mes, total: m.total }))} />
        </CardContent>
      </Card>
    </div>
  );
}

async function ResumoAgenda({ calComPromise }: { calComPromise: Promise<number> }) {
  const totalInstancias = await calComPromise;

  if (totalInstancias <= 0) return null;

  return (
    <div>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Agenda comercial</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Compromissos e slots ativos conectados ao Cal.com.</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.12)]">
            <CalendarClock className="h-4.5 w-4.5 text-[var(--success)]" />
          </div>
        </CardHeader>
        <CardContent>
          <AgendaWidgetWrapper />
        </CardContent>
      </Card>
    </div>
  );
}

// === Main page: parallel fetches + Suspense streaming ===

export default async function PaginaResumo() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    return null;
  }

  // Parallel fetch: leads and CalCom start simultaneously
  const leadsPromise = buscarLeads(sessao);
  const calComPromise = buscarCalCom(sessao);

  return (
    <section className="space-y-6">
      <ModulePageHeader
        title="Resumo"
        subtitle="Indicadores operacionais do seu funil de vendas, performance recente e agenda conectada."
        icon={<TrendingUp className="h-5 w-5" />}
        iconTone="blue"
        badges={[
          <Badge key="periodo" variant="default">Ultimos 6 meses</Badge>,
          <Badge key="pipeline" variant="secondary">Pipeline em tempo real</Badge>,
        ]}
      />

      <Suspense fallback={<KpiGridSkeleton />}>
        <ResumoKpiGrid leadsPromise={leadsPromise} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<ChartSkeleton />}>
          <ResumoChart leadsPromise={leadsPromise} />
        </Suspense>

        <Suspense fallback={null}>
          <ResumoAgenda calComPromise={calComPromise} />
        </Suspense>
      </div>
    </section>
  );
}
