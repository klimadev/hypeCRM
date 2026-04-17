import type { Metadata } from "next";
import { Providers } from "./providers";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HYPE CRM",
  description: "CRM multi-tenant para vendas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning className="bg-background text-foreground">
      <body className="antialiased">
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
