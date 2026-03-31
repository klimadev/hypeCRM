"use client";

import type { ReactNode } from "react";

type MotionListProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
};

export function MotionList({ children, className, staggerDelay = 0.04 }: MotionListProps) {
  return (
    <div className={className} data-stagger-delay={staggerDelay}>
      {children}
    </div>
  );
}

type MotionListItemProps = {
  children: ReactNode;
  className?: string;
};

export function MotionListItem({ children, className }: MotionListItemProps) {
  return <div className={className}>{children}</div>;
}
