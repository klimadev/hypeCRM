import { Prisma } from "@prisma/client";
import { conflict, notFound, serverError } from "@/lib/api/http";

function codigoPrisma(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export function mapRouteError(error: unknown, fallbackMessage: string, logPrefix?: string) {
  const code = codigoPrisma(error);

  if (code === "P2002") {
    return conflict("Ja existe um registro com esses dados.");
  }
  if (code === "P2025") {
    return notFound();
  }
  if (logPrefix) {
    console.error(logPrefix, error);
  }
  return serverError(fallbackMessage);
}

export function handleRouteError(error: unknown, fallbackMessage: string, logPrefix?: string) {
  return mapRouteError(error, fallbackMessage, logPrefix);
}
