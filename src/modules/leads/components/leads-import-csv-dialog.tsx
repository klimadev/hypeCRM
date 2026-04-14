"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiFuncionarioContato, PayloadImportarLeadsCsv } from "@/lib/api/leads";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";

type CsvMapKey = "nome" | "telefone" | "email" | "fonte" | "empresa_origem" | "observacoes";
type CsvPreviewRow = Record<string, string>;

type LeadsImportCsvDialogProps = {
  open: boolean;
  funcionarios: ApiFuncionarioContato[];
  idFuncionarioPadrao: string;
  importing: boolean;
  erro: string | null;
  onOpenChange: (aberto: boolean) => void;
  onSubmit: (payload: PayloadImportarLeadsCsv) => Promise<void>;
};

const REQUIRED_FIELDS: CsvMapKey[] = ["nome", "telefone"];
const OPTIONAL_FIELDS: CsvMapKey[] = ["email", "fonte", "empresa_origem", "observacoes"];

const FIELD_LABEL: Record<CsvMapKey, string> = {
  nome: "Nome",
  telefone: "Telefone",
  email: "E-mail",
  fonte: "Fonte",
  empresa_origem: "Empresa origem",
  observacoes: "Observações",
};

const SYNONYMS: Record<CsvMapKey, string[]> = {
  nome: ["nome", "lead", "cliente", "contato", "name"],
  telefone: ["telefone", "celular", "whatsapp", "fone", "phone", "tel", "numero"],
  email: ["email", "e-mail", "mail"],
  fonte: ["fonte", "origem", "source", "canal"],
  empresa_origem: ["empresa", "empresa_origem", "organizacao", "company"],
  observacoes: ["observacoes", "observacao", "nota", "notas", "comments"],
};

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, "").trim());
}

function detectDelimiter(lines: string[]) {
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestScore = -1;

  for (const delimiter of candidates) {
    const score = lines
      .slice(0, 5)
      .map((line) => parseCsvLine(line, delimiter).length)
      .reduce((acc, size) => acc + size, 0);

    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }

  return best;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "").trim();
}

function suggestMapping(headers: string[]) {
  const mapping: Partial<Record<CsvMapKey, string>> = {};
  const normalized = headers.map((header) => ({ raw: header, normalized: normalizeHeader(header) }));

  for (const [key, aliases] of Object.entries(SYNONYMS) as Array<[CsvMapKey, string[]]>) {
    const found = normalized.find((header) => aliases.some((alias) => header.normalized.includes(normalizeHeader(alias))));
    if (found) {
      mapping[key] = found.raw;
    }
  }

  return mapping;
}

function detectHeaderRow(firstRow: string[]) {
  const normalizedCells = firstRow.map((cell) => normalizeHeader(cell));

  return normalizedCells.some((cell) => {
    if (!cell) return false;
    return (Object.values(SYNONYMS) as string[][])
      .flat()
      .some((alias) => cell.includes(normalizeHeader(alias)));
  });
}

function buildHeadersWithoutHeader(columnCount: number) {
  return Array.from({ length: columnCount }, (_, index) => {
    if (index === 0) return "nome";
    if (index === 1) return "telefone";
    return `coluna_${index + 1}`;
  });
}

function toLeadPayload(row: CsvPreviewRow, mapping: Partial<Record<CsvMapKey, string>>) {
  const nome = mapping.nome ? row[mapping.nome] ?? "" : "";
  const telefone = mapping.telefone ? row[mapping.telefone] ?? "" : "";
  const email = mapping.email ? row[mapping.email] ?? "" : "";
  const fonte = mapping.fonte ? row[mapping.fonte] ?? "" : "";
  const empresaOrigem = mapping.empresa_origem ? row[mapping.empresa_origem] ?? "" : "";
  const observacoes = mapping.observacoes ? row[mapping.observacoes] ?? "" : "";

  return {
    nome: nome.trim(),
    telefone: telefone.trim(),
    email: email.trim() || null,
    fonte: fonte.trim() || null,
    empresa_origem: empresaOrigem.trim() || null,
    observacoes: observacoes.trim() || null,
  };
}

export function LeadsImportCsvDialog({
  open,
  funcionarios,
  idFuncionarioPadrao,
  importing,
  erro,
  onOpenChange,
  onSubmit,
}: LeadsImportCsvDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvPreviewRow[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<CsvMapKey, string>>>({});
  const [idFuncionario, setIdFuncionario] = useState(idFuncionarioPadrao);
  const [deduplicar, setDeduplicar] = useState(true);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const requiredMapped = REQUIRED_FIELDS.every((field) => Boolean(mapping[field]));

  const parsedLeads = useMemo(() => rows.map((row) => toLeadPayload(row, mapping)), [mapping, rows]);

  const resumo = useMemo(() => {
    const invalidos = parsedLeads.filter((lead) => {
      const telefone = normalizarTelefoneParaWhatsapp(lead.telefone);
      return !lead.nome || !telefone.valido;
    }).length;

    const dedupeKeys = new Set<string>();
    let duplicados = 0;
    for (const lead of parsedLeads) {
      const telefone = normalizarTelefoneParaWhatsapp(lead.telefone);
      const chave = `${telefone.waNumber ?? "sem-telefone"}|${(lead.email ?? "").toLowerCase()}`;
      if (dedupeKeys.has(chave)) duplicados += 1;
      dedupeKeys.add(chave);
    }

    return {
      total: parsedLeads.length,
      invalidos,
      validos: Math.max(parsedLeads.length - invalidos, 0),
      duplicadosNoArquivo: duplicados,
    };
  }, [parsedLeads]);

  const resetState = () => {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setErroLocal(null);
    setIdFuncionario(idFuncionarioPadrao);
    setDeduplicar(true);
  };

  const handleClose = (value: boolean) => {
    if (!value && !importing) {
      resetState();
    }
    onOpenChange(value);
  };

  const parseRawCsv = (raw: string, forcedDelimiter?: string) => {
    const lines = raw
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new Error("Não foram encontradas linhas importáveis no arquivo.");
    }

    const delimiterEfetivo = forcedDelimiter ?? detectDelimiter(lines);

    const parsedLines = lines.map((line) => parseCsvLine(line, delimiterEfetivo));
    const maxColumns = parsedLines.reduce((acc, cells) => Math.max(acc, cells.length), 0);
    if (maxColumns < 2) {
      throw new Error("O CSV precisa conter ao menos 2 colunas (nome e telefone).");
    }

    const firstRow = parsedLines[0] ?? [];
    const hasHeader = detectHeaderRow(firstRow);

    const csvHeaders = hasHeader
      ? firstRow.map((header, index) => header || `coluna_${index + 1}`)
      : buildHeadersWithoutHeader(maxColumns);

    const contentRows = hasHeader ? parsedLines.slice(1) : parsedLines;
    const csvRows = contentRows.map((cells) => {
      return csvHeaders.reduce<CsvPreviewRow>((acc, header, index) => {
        acc[header] = cells[index] ?? "";
        return acc;
      }, {});
    });

    if (csvRows.length === 0) {
      throw new Error("Não foram encontradas linhas importáveis no arquivo.");
    }

    if (csvRows.length > 2000) {
      throw new Error("Limite de 2000 linhas por importação.");
    }

    setHeaders(csvHeaders);
    setRows(csvRows);
    setMapping((current) => {
      const suggestion = hasHeader
        ? suggestMapping(csvHeaders)
        : {
            nome: csvHeaders[0],
            telefone: csvHeaders[1],
          };
      return { ...suggestion, ...current };
    });
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setErroLocal(null);
    setFileName(file.name);

    try {
      const raw = await file.text();
      parseRawCsv(raw);
      setStep(2);
    } catch (error) {
      setErroLocal(error instanceof Error ? error.message : "Falha ao processar o CSV.");
    }
  };

  const handleSubmit = async () => {
    if (importing) return;
    if (!requiredMapped) {
      setErroLocal("Mapeie ao menos Nome e Telefone para continuar.");
      return;
    }

    const leads = parsedLeads.filter((lead) => {
      const tel = normalizarTelefoneParaWhatsapp(lead.telefone);
      return lead.nome && tel.valido;
    });

    if (leads.length === 0) {
      setErroLocal("Nenhum lead válido para importar.");
      return;
    }

    setErroLocal(null);
    await onSubmit({
      id_funcionario: idFuncionario,
      deduplicar,
      leads,
    });
  };

  const erroExibido = erroLocal ?? erro;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[var(--brand)]" />
            <DialogTitle>Importar leads por CSV</DialogTitle>
          </div>
          <DialogDescription>
            Wizard em 3 passos para importar qualquer CSV com mapeamento flexível, deduplicação e validação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          <Badge size="sm" variant={step >= 1 ? "info" : "secondary"}>1. Arquivo</Badge>
          <Badge size="sm" variant={step >= 2 ? "info" : "secondary"}>2. Mapeamento</Badge>
          <Badge size="sm" variant={step >= 3 ? "info" : "secondary"}>3. Revisão</Badge>
        </div>

        {step === 1 ? (
          <div className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Arquivo .csv</label>
            <Input type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} disabled={importing} />
            {fileName ? <p className="text-sm text-[var(--text-secondary)]">Arquivo selecionado: {fileName}</p> : null}
            <p className="text-xs text-[var(--text-tertiary)]">Suporta delimitadores `;`, `,`, `|` e tabulação com ou sem cabeçalho.</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    {FIELD_LABEL[field]} {REQUIRED_FIELDS.includes(field) ? "*" : ""}
                  </label>
                  <Select
                    value={mapping[field] ?? "__none__"}
                    onValueChange={(value) => setMapping((current) => ({ ...current, [field]: value === "__none__" ? undefined : value }))}
                    disabled={importing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Não mapear</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={`${field}-${header}`} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Prévia (5 linhas)</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)]">
                      {headers.map((header) => (
                        <th key={header} className="px-2 py-2 font-medium">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, index) => (
                      <tr key={`preview-${index}`} className="border-b border-[color:rgba(255,255,255,0.04)] text-[var(--text-secondary)]">
                        {headers.map((header) => (
                          <td key={`${index}-${header}`} className="px-2 py-2">{row[header]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Total lido</p>
                <p className="text-xl font-semibold text-[var(--text-primary)]">{resumo.total}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[color:rgba(16,185,129,0.22)] bg-[color:rgba(16,185,129,0.08)] p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Válidos</p>
                <p className="text-xl font-semibold text-[var(--success)]">{resumo.validos}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[color:rgba(245,158,11,0.22)] bg-[color:rgba(245,158,11,0.08)] p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Inválidos</p>
                <p className="text-xl font-semibold text-[var(--warning)]">{resumo.invalidos}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[color:rgba(56,189,248,0.22)] bg-[color:rgba(56,189,248,0.08)] p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Duplicados no CSV</p>
                <p className="text-xl font-semibold text-[var(--info)]">{resumo.duplicadosNoArquivo}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Responsável dos novos leads</label>
                <Select value={idFuncionario} onValueChange={setIdFuncionario} disabled={importing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>{funcionario.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={deduplicar}
                  onChange={(event) => setDeduplicar(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
                  disabled={importing}
                />
                Deduplicar por telefone/e-mail contra o CRM e dentro do arquivo
              </label>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-tertiary)]">
              Segurança aplicada: limite de 2000 linhas, validação de campos e normalização de telefone antes de persistir.
            </div>
          </div>
        ) : null}

        {erroExibido ? (
          <div className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm font-medium text-[color:#fecdd3]">
            <span className="inline-flex items-center gap-2"><AlertCircle className="h-4 w-4" />{erroExibido}</span>
          </div>
        ) : null}

        <DialogFooter>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={importing}>Cancelar</Button>
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))} disabled={importing}>Voltar</Button>
              ) : null}
            </div>

            <div className="flex gap-2">
              {step < 3 ? (
                <Button
                  type="button"
                  className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
                  onClick={() => setStep((prev) => (prev === 1 ? 2 : 3))}
                  disabled={importing || (step === 1 && rows.length === 0) || (step === 2 && !requiredMapped)}
                >
                  Próximo
                </Button>
              ) : (
                <Button type="button" className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]" onClick={() => void handleSubmit()} disabled={importing}>
                  {importing ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Importando...</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Upload className="h-4 w-4" />Importar leads</span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>

        {step === 3 && !erroExibido ? (
          <div className="inline-flex items-center gap-2 text-xs text-[var(--success)]">
            <CheckCircle2 className="h-4 w-4" />
            Configuração pronta para importação.
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
