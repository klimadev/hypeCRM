import * as React from "react";
import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-[var(--border-subtle)] [&_tr]:bg-[color:rgba(255,255,255,0.02)]", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableRow({ className, onClick, ...props }: React.ComponentProps<"tr"> & { onClick?: () => void }) {
  const isInteractive = !!onClick;

  return (
    <tr
      className={cn(
        "border-b border-[var(--border-subtle)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:bg-[color:rgba(255,255,255,0.03)] data-[state=selected]:bg-[var(--brand-soft)]",
        isInteractive && "cursor-pointer active:scale-[0.995]",
        className,
      )}
      onClick={onClick}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("h-10 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]", className)} {...props} />;
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("p-3 align-middle text-[13px] text-[var(--text-secondary)]", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
