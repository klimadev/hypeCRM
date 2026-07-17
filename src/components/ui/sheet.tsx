"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

const Sheet = DrawerPrimitive.Root;
const SheetTrigger = DrawerPrimitive.Trigger;
const SheetPortal = DrawerPrimitive.Portal;
const SheetClose = DrawerPrimitive.Close;

function SheetContent({
  side = "right",
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  side?: "left" | "right" | "bottom";
}) {
  return (
    <SheetPortal>
      <DrawerPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50",
          side === "bottom" ? "bg-[var(--surface-overlay)]" : "bg-[var(--surface-overlay)] backdrop-blur-sm",
        )}
      />
      <DrawerPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-overlay)]",
          side === "right" &&
            "top-0 bottom-0 right-0 w-full max-w-md rounded-l-[var(--radius-shell)] transition-transform duration-[var(--duration-overlay)] ease-[var(--ease-productive)] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
          side === "left" &&
            "top-0 bottom-0 left-0 w-full max-w-md rounded-r-[var(--radius-shell)] transition-transform duration-[var(--duration-overlay)] ease-[var(--ease-productive)] data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
          side === "bottom" &&
            "bottom-0 left-0 right-0 max-h-[85dvh] rounded-t-[var(--radius-shell)] transition-transform duration-[var(--duration-overlay)] ease-[var(--ease-productive)] data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
          className,
        )}
        {...props}
      />
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 border-b border-[var(--border-subtle)] p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title className={cn("text-lg font-semibold tracking-tight text-[var(--text-primary)]", className)} {...props} />;
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return <DrawerPrimitive.Description className={cn("text-sm text-[var(--text-secondary)]", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] p-4", className)} {...props} />;
}

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
