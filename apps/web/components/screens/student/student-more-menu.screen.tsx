"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";

export interface StudentMoreMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color:
    | "duo-red"
    | "duo-green"
    | "duo-blue"
    | "duo-purple"
    | "duo-yellow";
  href?: string;
  onSelect?: () => void | Promise<void>;
}

export interface StudentMoreMenuScreenProps
  extends ScreenProps<{
    items: StudentMoreMenuItem[];
  }> {}

export const studentMoreMenuScreenContract: ViewContract = {
  componentId: "student-more-menu-screen",
  testId: "student-more-menu-screen",
};

export function StudentMoreMenuScreen({ items }: StudentMoreMenuScreenProps) {
  return (
    <ScreenShell.Root screenId={studentMoreMenuScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Mais</ScreenShell.Title>
            <ScreenShell.Description>
              Acesse academias, personais, pagamentos e configurações da sua
              jornada.
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <div
            className="grid gap-4"
            data-testid={createTestSelector(
              studentMoreMenuScreenContract.testId,
              "items",
            )}
          >
            {items.map((item) => {
              const card = (
                <NavigationButtonCard
                  icon={item.icon}
                  title={item.label}
                  description={item.description}
                  color={item.color}
                  onClick={item.href ? undefined : item.onSelect}
                  data-testid={createTestSelector(
                    studentMoreMenuScreenContract.testId,
                    "item",
                  )}
                />
              );

              return (
                <div key={item.id}>
                  {item.href ? <Link href={item.href}>{card}</Link> : card}
                </div>
              );
            })}
          </div>
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
