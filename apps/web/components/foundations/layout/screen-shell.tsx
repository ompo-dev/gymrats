"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenShellRootProps extends HTMLAttributes<HTMLDivElement> {
  screenId: string;
}

function ScreenShellRoot({
  screenId,
  className,
  children,
  ...props
}: ScreenShellRootProps) {
  return (
    <section
      data-screen={screenId}
      data-testid={screenId}
      className={cn("cq-screen-shell mx-auto max-w-4xl space-y-6", className)}
      {...props}
    >
      {children}
    </section>
  );
}

function ScreenShellHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header className={cn("cq-screen-header gap-4", className)} {...props}>
      {children}
    </header>
  );
}

function ScreenShellHeading({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1", className)} {...props}>
      {children}
    </div>
  );
}

function ScreenShellTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={cn("text-3xl font-bold text-duo-text", className)} {...props}>
      {children}
    </h1>
  );
}

function ScreenShellDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-duo-gray-dark", className)} {...props}>
      {children}
    </p>
  );
}

function ScreenShellActions({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("cq-screen-actions", className)} {...props}>
      {children}
    </div>
  );
}

function ScreenShellBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {children}
    </div>
  );
}

function ScreenShellSectionGrid({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)} {...props}>
      {children}
    </div>
  );
}

function ScreenShellNotice({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {children}
    </div>
  );
}

export const ScreenShell = {
  Root: ScreenShellRoot,
  Header: ScreenShellHeader,
  Heading: ScreenShellHeading,
  Title: ScreenShellTitle,
  Description: ScreenShellDescription,
  Actions: ScreenShellActions,
  Body: ScreenShellBody,
  SectionGrid: ScreenShellSectionGrid,
  Notice: ScreenShellNotice,
};
