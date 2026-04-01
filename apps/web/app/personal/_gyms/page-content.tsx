"use client";

import { GymProfileView } from "@/app/student/_gyms/gym-profile-view";
import {
  PersonalGymAccessPage,
  PersonalGymsPage,
} from "@/components/organisms/personal";
import type { PersonalAffiliation } from "../types";

interface PersonalGymsPageContentProps {
  affiliations: PersonalAffiliation[];
  onRefresh: () => Promise<void>;
  gymId: string | null;
  gymView: string | null;
  onViewGym: (gymId: string) => void;
  onBackFromGym: () => void;
  onOpenGymAccess: () => void;
  onBackFromAccess: () => void;
}

export function PersonalGymsPageContent({
  affiliations,
  onRefresh,
  gymId,
  gymView,
  onViewGym,
  onBackFromGym,
  onOpenGymAccess,
  onBackFromAccess,
}: PersonalGymsPageContentProps) {
  if (gymId) {
    if (gymView === "catracas") {
      return (
        <PersonalGymAccessPage
          gymId={gymId}
          onBack={onBackFromAccess}
          returnHref={`/personal?tab=gyms&gymId=${gymId}&gymView=profile`}
        />
      );
    }

    return (
      <GymProfileView
        gymId={gymId}
        onBack={onBackFromGym}
        onOpenAccess={onOpenGymAccess}
        variant="personal"
      />
    );
  }

  return (
    <PersonalGymsPage
      affiliations={affiliations}
      onRefresh={onRefresh}
      onViewGym={onViewGym}
    />
  );
}
