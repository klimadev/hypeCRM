import { describe, expect, it } from "vitest";
import {
  assertAmbienteSeguroDeTeste,
  criarDatabaseUrlDeTeste,
  isDatabaseUrlSeguraParaTeste,
} from "@/lib/testing/test-db-safety";

describe("criarDatabaseUrlDeTeste", () => {
  it("gera DATABASE_URL isolada com marcador de teste", () => {
    // Arrange
    const baseDir = "/tmp/hype";

    // Act
    const url = criarDatabaseUrlDeTeste(baseDir);

    // Assert
    expect(url).toBe("file:/tmp/hype/.tmp/vitest/test.db");
  });
});

describe("isDatabaseUrlSeguraParaTeste", () => {
  it("retorna true para sqlite com caminho de teste", () => {
    // Arrange
    const databaseUrl = "file:/var/www/hypeCRM/.tmp/vitest/test.db";

    // Act
    const safe = isDatabaseUrlSeguraParaTeste(databaseUrl);

    // Assert
    expect(safe).toBe(true);
  });

  it("retorna false para sqlite de desenvolvimento", () => {
    // Arrange
    const databaseUrl = "file:./prisma/dev.db";

    // Act
    const safe = isDatabaseUrlSeguraParaTeste(databaseUrl);

    // Assert
    expect(safe).toBe(false);
  });
});

describe("assertAmbienteSeguroDeTeste", () => {
  it("nao lanca erro quando o ambiente e seguro", () => {
    // Arrange
    const nodeEnv = "test";
    const databaseUrl = "file:/tmp/hype/.tmp/vitest/test.db";

    // Act
    const runAssert = () => assertAmbienteSeguroDeTeste(nodeEnv, databaseUrl);

    // Assert
    expect(runAssert).not.toThrow();
  });

  it("lanca erro quando NODE_ENV nao e test", () => {
    // Arrange
    const nodeEnv = "development";
    const databaseUrl = "file:/tmp/hype/.tmp/vitest/test.db";

    // Act
    const runAssert = () => assertAmbienteSeguroDeTeste(nodeEnv, databaseUrl);

    // Assert
    expect(runAssert).toThrow("NODE_ENV esperado 'test'");
  });
});
