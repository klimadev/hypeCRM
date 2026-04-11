import path from "node:path";

const BLOQUEADOS = [/dev\.db/i, /prod/i, /production/i, /staging/i];

export function criarDatabaseUrlDeTeste(baseDir = process.cwd()): string {
  const dbPath = path.join(baseDir, ".tmp", "vitest", "test.db");
  return `file:${dbPath}`;
}

export function isDatabaseUrlSeguraParaTeste(databaseUrl: string): boolean {
  if (!databaseUrl) return false;

  const normalizada = databaseUrl.toLowerCase();
  if (!normalizada.startsWith("file:")) return false;
  if (!normalizada.includes("test")) return false;

  return !BLOQUEADOS.some((regex) => regex.test(normalizada));
}

export function assertAmbienteSeguroDeTeste(
  nodeEnv: string | undefined,
  databaseUrl: string | undefined,
): asserts databaseUrl is string {
  if (nodeEnv !== "test") {
    throw new Error(`Ambiente inseguro para testes: NODE_ENV esperado 'test', recebido '${nodeEnv ?? "(vazio)"}'.`);
  }

  if (!databaseUrl) {
    throw new Error("Ambiente inseguro para testes: DATABASE_URL ausente.");
  }

  if (!isDatabaseUrlSeguraParaTeste(databaseUrl)) {
    throw new Error(
      `Ambiente inseguro para testes: DATABASE_URL nao parece isolada de teste ('${databaseUrl}').`,
    );
  }
}
