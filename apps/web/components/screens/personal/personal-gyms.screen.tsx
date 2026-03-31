"use client";

import { Building2, Loader2 } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { AcademyListItemCard } from "@/components/organisms/sections/list-item-cards";

export interface PersonalGymsScreenItem {
  id: string;
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  };
}

export interface PersonalGymsScreenProps
  extends ScreenProps<{
    affiliations: PersonalGymsScreenItem[];
    gymHandleInput: string;
    isLinking?: boolean;
    unlinkingId?: string | null;
    onGymHandleInputChange: (value: string) => void;
    onLink: () => void;
    onUnlink: (gymId: string) => void;
    onViewGym?: (gymId: string) => void;
  }> {}

export const personalGymsScreenContract: ViewContract = {
  componentId: "personal-gyms-screen",
  testId: "personal-gyms-screen",
};

export function PersonalGymsScreen({
  affiliations,
  gymHandleInput,
  isLinking = false,
  unlinkingId = null,
  onGymHandleInputChange,
  onLink,
  onUnlink,
  onViewGym,
}: PersonalGymsScreenProps) {
  return (
    <ScreenShell.Root screenId={personalGymsScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading className="text-center sm:text-center">
            <ScreenShell.Title>Academias</ScreenShell.Title>
            <ScreenShell.Description>
              Academias onde você atua
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoCard.Root
            data-testid={createTestSelector(
              personalGymsScreenContract.testId,
              "link-form",
            )}
          >
            <h3 className="font-semibold text-duo-fg">Vincular nova academia</h3>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <DuoInput.Simple
                  label="Buscar por @ da academia"
                  placeholder="@academia"
                  value={gymHandleInput}
                  onChange={(event) =>
                    onGymHandleInputChange(event.target.value)
                  }
                  data-testid={createTestSelector(
                    personalGymsScreenContract.testId,
                    "link-handle",
                  )}
                />
              </div>
              <DuoButton
                onClick={onLink}
                disabled={isLinking || !gymHandleInput.trim()}
                variant="primary"
                data-testid={createTestSelector(
                  personalGymsScreenContract.testId,
                  "link-submit",
                )}
              >
                {isLinking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="mr-2 h-4 w-4" />
                )}
                Vincular
              </DuoButton>
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.2}>
          {affiliations.length === 0 ? (
            <DuoCard.Root
              data-testid={createTestSelector(
                personalGymsScreenContract.testId,
                "empty",
              )}
            >
              <p className="text-sm text-duo-fg-muted">
                Nenhuma academia vinculada no momento.
              </p>
            </DuoCard.Root>
          ) : (
            <div
              className="space-y-4"
              data-testid={createTestSelector(
                personalGymsScreenContract.testId,
                "affiliations",
              )}
            >
              {affiliations.map((item) => (
                <div
                  key={item.id}
                  data-testid={createTestSelector(
                    personalGymsScreenContract.testId,
                    "affiliation-card",
                  )}
                >
                  <AcademyListItemCard
                    image={
                      item.gym?.logo || item.gym?.image || "/placeholder.svg"
                    }
                    name={item.gym?.name || "Academia"}
                    onClick={() => onViewGym?.(item.gym.id)}
                    hoverColor="duo-blue"
                    trailingAction={
                      <DuoButton
                        variant="danger"
                        size="sm"
                        onClick={() => onUnlink(item.gym.id)}
                        disabled={unlinkingId === item.gym.id}
                      >
                        {unlinkingId === item.gym.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Desvincular
                      </DuoButton>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
