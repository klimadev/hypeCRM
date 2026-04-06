import { readFileSync } from "fs";
import { resolve } from "path";

function carregarEnvLocal() {
  const caminho = resolve(process.cwd(), ".env");
  try {
    const conteudo = readFileSync(caminho, "utf8");
    for (const linha of conteudo.split(/\r?\n/)) {
      const texto = linha.trim();
      if (!texto || texto.startsWith("#") || texto.startsWith("export ")) continue;
      const indice = texto.indexOf("=");
      if (indice <= 0) continue;
      const chave = texto.slice(0, indice).trim();
      if (process.env[chave] !== undefined) continue;
      let valor = texto.slice(indice + 1).trim();
      if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
        valor = valor.slice(1, -1);
      }
      process.env[chave] = valor;
    }
  } catch {
    // Optional local file.
  }
}

carregarEnvLocal();

const DEFAULT_INTERVAL_MS = 60_000;

function getIntervalMs(): number {
  const raw = process.env.CHAT_SCHEDULED_MESSAGES_INTERVAL_MS;
  if (!raw) return DEFAULT_INTERVAL_MS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 5_000) return DEFAULT_INTERVAL_MS;

  return parsed;
}

async function processarUmaVez() {
  const token = process.env.INTERNAL_AUTOMATION_TOKEN?.trim();
  if (!token) {
    throw new Error("INTERNAL_AUTOMATION_TOKEN nao configurado.");
  }

  const response = await fetch("http://127.0.0.1:3434/api/internal/chat/process-scheduled-messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": token,
    },
    body: JSON.stringify({ limite: 20 }),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((json.erro as string) ?? `Falha ao processar mensagens agendadas (${response.status}).`);
  }

  console.log("[chat-scheduler] ciclo concluido", json);
}

async function main() {
  const intervaloMs = getIntervalMs();
  console.log(`[chat-scheduler] iniciado com intervalo de ${intervaloMs}ms`);

  for (;;) {
    try {
      await processarUmaVez();
    } catch (error) {
      console.error("[chat-scheduler] erro ao processar mensagens agendadas", {
        erro: error instanceof Error ? error.message : String(error),
      });
    }

    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
}

void main();
