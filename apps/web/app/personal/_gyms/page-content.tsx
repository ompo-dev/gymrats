"use client";

import { PersonalGymsPage } from "@/components/organisms/personal";
import { GymProfileView } from "@/app/student/_gyms/gym-profile-view";
import type { PersonalAffiliation } from "../types";

interface PersonalGymsPageContentProps {
  affiliations: PersonalAffiliation[];
  onRefresh: () => Promise<void>;
  gymId: string | null;
  onViewGym: (gymId: string) => void;
  onBackFromGym: () => void;
}

export function PersonalGymsPageContent({
  affiliations,
  onRefresh,
  gymId,
  onViewGym,
  onBackFromGym,
}: PersonalGymsPageContentProps) {
  if (gymId) {
    return (
      <GymProfileView
        gymId={gymId}
        onBack={onBackFromGym}
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
