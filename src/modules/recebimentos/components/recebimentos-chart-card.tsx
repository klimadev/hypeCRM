"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formataMoeda } from "@/lib/utils";

type RecebimentosChartCardProps = {
  dados: Array<{ label: string; recebido: number; previsto: number }>;
};

export function RecebimentosChartCard({ dados }: RecebimentosChartCardProps) {
  return (
    <Card className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[var(--text-primary)]">Fluxo de recebimento</CardTitle>
        <p className="text-sm text-[var(--text-secondary)]">Compare o previsto com o efetivamente recebido ao longo do tempo.</p>
      </CardHeader>
      <CardContent>
        <div className="min-h-[280px] w-full">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} tickFormatter={(valor) => `R$ ${Math.round(Number(valor) / 1000)}k`} />
              <Tooltip formatter={(valor) => formataMoeda(Number(valor))} />
              <Bar dataKey="previsto" name="Previsto" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="recebido" name="Recebido" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
