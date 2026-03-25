import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.hypecrm.com.br", "hypecrm.com.br"],
  output: "standalone",

  // [QW1] Otimiza imports de pacotes pesados - reduz bundle client
  // lucide-react (44MB) usado em 64 arquivos; recharts (8.3MB) em 2 arquivos
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // [QW2] Prisma deve ser external no server - evita bundling desnecessário
  serverExternalPackages: ["@prisma/client"],

  // [QW3] Logging de fetches em dev - ajuda a debugar data fetching
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // [ME1] Habilita Partial Prerendering (PPR) - melhora TTFB com streaming
  // Componentes estáticos são pré-renderizados, partes dinâmicas são streamed
  cacheComponents: true,
};

export default nextConfig;
