"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center rounded-[calc(var(--radius-control)+2px)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-1 text-[var(--text-tertiary)] shadow-[var(--shadow-sm)]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)] disabled:pointer-events-none disabled:text-[var(--text-disabled)] data-[state=active]:bg-[var(--surface-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-sm)] data-[state=active]:border data-[state=active]:border-[var(--border-subtle)]",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 text-[var(--text-secondary)] focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)]",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
