/**
 * Template do dashboard - animação de entrada leve sem AnimatePresence
 * Evita afetar a sidebar e problemas de renderização
 */
"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
};

const pageTransition = {
  duration: 0.18,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="animate"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}