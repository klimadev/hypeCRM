import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarTelefoneChat } from "../helpers";

type PipelineItem = {
  id: string;
  nome: string;
  padrao?: boolean;
  ordem?: number | null;
};

type EstagioItem = {
  id: string;
  id_funil: string;
  nome: string;
  ordem: number;
};

type ChatOrphanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  telefone: string;
  nomeInicial: string;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  onSubmit: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
    id_funil?: string;
    id_estagio?: string;
  }) => void;
  tipoAcao?: "registrar_lead" | "criar_negocio";
};

export function ChatOrphanDialog({
  open,
  onOpenChange,
  title,
  description,
  telefone,
  nomeInicial,
  perfil,
  onSubmit,
  tipoAcao = "registrar_lead",
}: ChatOrphanDialogProps) {
  const [nome, setNome] = useState(nomeInicial);
  const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
  const [estagios, setEstagios] = useState<EstagioItem[]>([]);
  const [pipelineSelecionado, setPipelineSelecionado] = useState("");
  const [estagioSelecionado, setEstagioSelecionado] = useState("");
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [erroDados, setErroDados] = useState<string | null>(null);

  const precisaSelecionarPipeline = tipoAcao === "criar_negocio";

  const estagiosDoPipeline = useMemo(() => {
    return estagios
      .filter((estagio) => estagio.id_funil === pipelineSelecionado)
      .sort((a, b) => a.ordem - b.ordem);
  }, [estagios, pipelineSelecionado]);

  useEffect(() => {
    if (!open) {
      setNome(nomeInicial);
      setErroDados(null);
      setPipelineSelecionado("");
      setEstagioSelecionado("");
      return;
    }

    if (!precisaSelecionarPipeline) {
      return;
    }

    let ativo = true;
    setCarregandoDados(true);
    setErroDados(null);

    void Promise.all([
      fetch("/api/pipelines", { cache: "no-store" }).then((res) => res.json()),
      fetch("/api/estagios", { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(([pipelinesJson, estagiosJson]) => {
        if (!ativo) return;

        const pipelinesRecebidos = Array.isArray(pipelinesJson?.pipelines) ? (pipelinesJson.pipelines as PipelineItem[]) : [];
        const estagiosRecebidos = Array.isArray(estagiosJson?.estagios)
          ? (estagiosJson.estagios as Array<EstagioItem & { ordem?: number | string }>).map((estagio) => ({
              id: estagio.id,
              id_funil: estagio.id_funil,
              nome: estagio.nome,
              ordem: Number(estagio.ordem ?? 0),
            }))
          : [];

        setPipelines(pipelinesRecebidos);
        setEstagios(estagiosRecebidos);

        const pipelinePadrao = pipelinesRecebidos.find((pipeline) => pipeline.padrao) ?? pipelinesRecebidos[0];
        const pipelineId = pipelinePadrao?.id ?? "";
        setPipelineSelecionado(pipelineId);

        const estagiosDoPadrao = estagiosRecebidos
          .filter((estagio) => estagio.id_funil === pipelineId)
          .sort((a, b) => a.ordem - b.ordem);

        setEstagioSelecionado(estagiosDoPadrao[0]?.id ?? "");

        if (!pipelineId || estagiosDoPadrao.length === 0) {
          setErroDados("Nao foi possivel carregar pipelines e etapas validas para criar o negocio.");
        }
      })
      .catch(() => {
        if (!ativo) return;
        setErroDados("Nao foi possivel carregar pipelines e etapas.");
      })
      .finally(() => {
        if (ativo) {
          setCarregandoDados(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [open, nomeInicial, precisaSelecionarPipeline]);

  useEffect(() => {
    if (!precisaSelecionarPipeline || !pipelineSelecionado) {
      return;
    }

    const etapas = estagios
      .filter((estagio) => estagio.id_funil === pipelineSelecionado)
      .sort((a, b) => a.ordem - b.ordem);

    if (!etapas.some((estagio) => estagio.id === estagioSelecionado)) {
      setEstagioSelecionado(etapas[0]?.id ?? "");
    }
  }, [estagioSelecionado, estagios, pipelineSelecionado, precisaSelecionarPipeline]);

  const submitDisabled = precisaSelecionarPipeline && (carregandoDados || !pipelineSelecionado || !estagioSelecionado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Telefone</label>
            <input
              type="text"
              value={formatarTelefoneChat(telefone)}
              disabled
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-tertiary)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome (opcional)</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do contato"
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          {precisaSelecionarPipeline ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Pipeline</label>
                <Select value={pipelineSelecionado} onValueChange={setPipelineSelecionado} disabled={carregandoDados || pipelines.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={carregandoDados ? "Carregando pipelines..." : "Selecione o pipeline"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Etapa inicial</label>
                <Select
                  value={estagioSelecionado}
                  onValueChange={setEstagioSelecionado}
                  disabled={carregandoDados || !pipelineSelecionado || estagiosDoPipeline.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={carregandoDados ? "Carregando etapas..." : "Selecione a etapa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {estagiosDoPipeline.map((estagio) => (
                      <SelectItem key={estagio.id} value={estagio.id}>
                        {estagio.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {erroDados ? (
                <p className="rounded-lg border border-[color:rgba(244,63,94,0.3)] bg-[color:rgba(244,63,94,0.08)] p-3 text-xs text-[var(--danger)]">
                  {erroDados}
                </p>
              ) : null}
            </>
          ) : null}

          <p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">
            {perfil === "COLABORADOR"
              ? "O lead será vinculado automaticamente a você."
              : perfil === "GERENTE"
                ? "O responsável será escolhido dentro do seu PDV após o cadastro."
                : "Você poderá complementar PDV e responsável na próxima etapa."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={submitDisabled}
            onClick={() =>
              onSubmit({
                telefone,
                nome: nome.trim() || undefined,
                id_funil: precisaSelecionarPipeline ? pipelineSelecionado : undefined,
                id_estagio: precisaSelecionarPipeline ? estagioSelecionado : undefined,
              })
            }
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
