import type { NextConfig } from "next";

const buildEstrito = process.env.NEXT_STRICT_BUILD === "1";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.hypecrm.com.br", "hypecrm.com.br"],

  typescript: {
    ignoreBuildErrors: !buildEstrito,
  },

  // [QW2] Prisma deve ser external no server - evita bundling desnecessário
  serverExternalPackages: ["@prisma/client"],

  // [QW3] Logging de fetches em dev - ajuda a debugar data fetching
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // [ME1] Build rápido por padrão; validação estrita fica disponível em `npm run build:strict`.
  cacheComponents: false,
};

export default nextConfig;
