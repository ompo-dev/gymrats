"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import {
  ScreenShell,
  createTestSelector,
} from "@/components/foundations";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";

export interface GymMoreMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: "duo-blue" | "duo-yellow" | "duo-green";
  href?: string;
  onSelect?: () => void | Promise<void>;
}

export interface GymMoreMenuScreenProps
  extends ScreenProps<{
    items: GymMoreMenuItem[];
  }> {}

export const gymMoreMenuScreenContract: ViewContract = {
  componentId: "gym-more-menu-screen",
  testId: "gym-more-menu-screen",
};

export function GymMoreMenuScreen({ items }: GymMoreMenuScreenProps) {
  return (
    <ScreenShell.Root screenId={gymMoreMenuScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Mais</ScreenShell.Title>
            <ScreenShell.Description>
              Acesse estatísticas, configurações e áreas avançadas da
              academia.
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <div
            className="grid gap-4"
            data-testid={createTestSelector(
              gymMoreMenuScreenContract.testId,
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
                    gymMoreMenuScreenContract.testId,
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
