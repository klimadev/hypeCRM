"use client";

import { motion } from "framer-motion";
import { springs } from "@/lib/animations/springs";
import type { ReactNode } from "react";

type MotionListProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
};

export function MotionList({ children, className, staggerDelay = 0.04 }: MotionListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.02,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type MotionListItemProps = {
  children: ReactNode;
  className?: string;
};

export function MotionListItem({ children, className }: MotionListItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: springs.smooth },
      }}
    >
      {children}
    </motion.div>
  );
}