"use client";

import type { LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import {
  ScreenShell,
  createTestSelector,
} from "@/components/foundations";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";

export interface PersonalMoreMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: "duo-blue" | "duo-yellow" | "duo-green";
  onSelect?: () => void | Promise<void>;
}

export interface PersonalMoreMenuScreenProps
  extends ScreenProps<{
    items: PersonalMoreMenuItem[];
  }> {}

export const personalMoreMenuScreenContract: ViewContract = {
  componentId: "personal-more-menu-screen",
  testId: "personal-more-menu-screen",
};

export function PersonalMoreMenuScreen({
  items,
}: PersonalMoreMenuScreenProps) {
  return (
    <ScreenShell.Root screenId={personalMoreMenuScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Mais</ScreenShell.Title>
            <ScreenShell.Description>
              Atalhos para configurações, assinatura e relatórios do personal.
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <div
            className="grid gap-4"
            data-testid={createTestSelector(
              personalMoreMenuScreenContract.testId,
              "items",
            )}
          >
            {items.map((item) => (
              <div key={item.id}>
                <NavigationButtonCard
                  icon={item.icon}
                  title={item.label}
                  description={item.description}
                  color={item.color}
                  onClick={item.onSelect}
                  data-testid={createTestSelector(
                    personalMoreMenuScreenContract.testId,
                    "item",
                  )}
                />
              </div>
            ))}
          </div>
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
