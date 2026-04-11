import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { assertAmbienteSeguroDeTeste } from "@/lib/testing/test-db-safety";

async function limparBanco() {
  const tabelas = (await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'",
  )) as Array<{ name: string }>;

  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");

  try {
    for (const tabela of tabelas) {
      await prisma.$executeRawUnsafe(`DELETE FROM \"${tabela.name}\"`);
    }

    const sqliteSequence = (await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'",
    )) as Array<{ name: string }>;
    if (sqliteSequence.length > 0) {
      await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence");
    }
  } finally {
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  }
}

assertAmbienteSeguroDeTeste(process.env.NODE_ENV, process.env.DATABASE_URL);

beforeEach(async () => {
  await limparBanco();
});

afterAll(async () => {
  await prisma.$disconnect();
});
