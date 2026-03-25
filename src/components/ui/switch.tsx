"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "peer h-5 w-9 rounded-full border border-transparent bg-[color:rgba(255,255,255,0.08)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] transition-[background-color,border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
            "peer-checked:border-[color:rgba(16,185,129,0.28)] peer-checked:bg-[var(--success)] peer-focus-visible:border-[var(--border-focus)] peer-focus-visible:shadow-[var(--focus-ring)]",
            "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
            "after:h-4 after:w-4 after:rounded-full after:bg-[var(--text-primary)] after:shadow-[0_6px_16px_-10px_rgba(0,0,0,0.85)]",
            "after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-snappy)]",
            "peer-checked:after:translate-x-full",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            className,
          )}
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
