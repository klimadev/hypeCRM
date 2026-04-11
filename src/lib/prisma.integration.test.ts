import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

describe("prisma integration smoke", () => {
  it("persiste e consulta uma empresa no banco de teste isolado", async () => {
    // Arrange
    const empresa = {
      id: "empresa-smoke-1",
      nome: "Empresa Smoke",
      email: "empresa-smoke-1@hypecrm.test",
      senha_hash: "hash",
    };

    // Act
    await prisma.empresa.create({ data: empresa });
    const encontrada = await prisma.empresa.findUnique({ where: { id: empresa.id } });

    // Assert
    expect(encontrada).not.toBeNull();
    expect(encontrada?.email).toBe("empresa-smoke-1@hypecrm.test");
  });

  it("aplica restricao unica no email de empresa", async () => {
    // Arrange
    const email = "duplicado@hypecrm.test";
    await prisma.empresa.create({
      data: {
        id: "empresa-unica-1",
        nome: "Empresa 1",
        email,
        senha_hash: "hash",
      },
    });

    // Act
    const tentativaDuplicada = prisma.empresa.create({
      data: {
        id: "empresa-unica-2",
        nome: "Empresa 2",
        email,
        senha_hash: "hash",
      },
    });

    // Assert
    await expect(tentativaDuplicada).rejects.toMatchObject({ code: "P2002" });
  });
});
