import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  assertAmbienteSeguroDeTeste,
  criarDatabaseUrlDeTeste,
} from "./src/lib/testing/test-db-safety";

export default async function globalSetup() {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? criarDatabaseUrlDeTeste();

  assertAmbienteSeguroDeTeste(process.env.NODE_ENV, process.env.DATABASE_URL);

  const dbUrl = process.env.DATABASE_URL;
  const dbPath = dbUrl.replace("file:", "");
  const dbDir = path.dirname(dbPath);

  fs.mkdirSync(dbDir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }

  execSync("pnpm prisma migrate deploy", {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
  });
}
