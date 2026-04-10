import type { NextConfig } from "next";

const buildEstrito = process.env.NEXT_STRICT_BUILD === "1";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.hypecrm.com.br", "hypecrm.com.br"],

  typescript: {
    ignoreBuildErrors: !buildEstrito,
  },

  serverExternalPackages: ["@prisma/client"],

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  cacheComponents: false,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@hello-pangea/dnd",
    ],
  },

  modularizeImports: {
    lucideReact: {
      transform: "lucide-react/dist/esm/{{member}}",
    },
  },
};

export default nextConfig;
