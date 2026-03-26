"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  createContext,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useContext,
} from "react";
import { cn } from "@/lib/utils";
import { useControllableState } from "./use-controllable-state";

interface DuoTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

type DuoTabsVariant = "underline" | "pill" | "button";

interface DuoTabsProps
  extends Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "children"> {
  tabs: DuoTab[];
  defaultTab?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: DuoTabsVariant;
}

const DuoTabsVariantContext = createContext<DuoTabsVariant>("pill");

interface DuoTabsRootProps
  extends ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: DuoTabsVariant;
}

function DuoTabsRoot({
  variant = "pill",
  className,
  children,
  ...props
}: DuoTabsRootProps) {
  return (
    <DuoTabsVariantContext.Provider value={variant}>
      <TabsPrimitive.Root
        data-slot="duo-tabs"
        className={cn("flex flex-col gap-4", className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </DuoTabsVariantContext.Provider>
  );
}

function useDuoTabsVariant() {
  return useContext(DuoTabsVariantContext);
}

function DuoTabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  const variant = useDuoTabsVariant();

  return (
    <TabsPrimitive.List
      data-slot="duo-tabs-list"
      className={cn(
        "flex gap-1",
        variant === "underline" &&
          "gap-0 border-b-2 border-[var(--duo-border)]",
        variant === "pill" && "rounded-xl bg-[var(--duo-bg-elevated)] p-1",
        variant === "button" && "gap-2",
        className,
      )}
      {...props}
    />
  );
}

interface DuoTabsTriggerProps
  extends ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: ReactNode;
}

function DuoTabsTrigger({
  icon,
  className,
  children,
  ...props
}: DuoTabsTriggerProps) {
  const variant = useDuoTabsVariant();

  return (
    <TabsPrimitive.Trigger
      data-slot="duo-tabs-trigger"
      className={cn(
        "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-bold transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--duo-primary)]",
        variant === "underline" && [
          "-mb-[2px] rounded-t-lg border-b-2",
          "border-transparent text-[var(--duo-fg-muted)] hover:text-[var(--duo-fg)]",
          "data-[state=active]:border-[var(--duo-primary)] data-[state=active]:text-[var(--duo-primary)]",
        ],
        variant === "pill" && [
          "flex-1 justify-center rounded-lg",
          "text-[var(--duo-fg-muted)] hover:text-[var(--duo-fg)]",
          "data-[state=active]:bg-[var(--duo-primary)] data-[state=active]:text-white data-[state=active]:shadow-sm",
        ],
        variant === "button" && [
          "rounded-xl border-2",
          "border-[var(--duo-border)] text-[var(--duo-fg-muted)] hover:border-[var(--duo-fg-muted)]",
          "data-[state=active]:border-[var(--duo-primary)] data-[state=active]:bg-[var(--duo-primary)]/10 data-[state=active]:text-[var(--duo-primary)]",
        ],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </TabsPrimitive.Trigger>
  );
}

function DuoTabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="duo-tabs-content"
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 duration-300",
        className,
      )}
      {...props}
    />
  );
}

function DuoTabsSimple({
  tabs,
  defaultTab,
  value,
  onValueChange,
  variant = "pill",
  className,
  ...props
}: DuoTabsProps) {
  const [activeTab, setActiveTab] = useControllableState({
    prop: value,
    defaultProp: defaultTab ?? tabs[0]?.id,
    onChange: onValueChange,
  });

  return (
    <DuoTabsRoot
      value={activeTab}
      onValueChange={setActiveTab}
      variant={variant}
      className={className}
      {...props}
    >
      <DuoTabsList>
        {tabs.map((tab) => (
          <DuoTabsTrigger key={tab.id} value={tab.id} icon={tab.icon}>
            {tab.label}
          </DuoTabsTrigger>
        ))}
      </DuoTabsList>
      {tabs.map((tab) => (
        <DuoTabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </DuoTabsContent>
      ))}
    </DuoTabsRoot>
  );
}

export const DuoTabs = {
  Root: DuoTabsRoot,
  List: DuoTabsList,
  Trigger: DuoTabsTrigger,
  Content: DuoTabsContent,
  Simple: DuoTabsSimple,
};
