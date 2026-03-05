"use client";

import { PersonalGymsPage } from "@/components/organisms/personal";
import type { PersonalAffiliation } from "../types";

interface PersonalGymsPageContentProps {
  affiliations: PersonalAffiliation[];
  onRefresh: () => Promise<void>;
}

export function PersonalGymsPageContent({
  affiliations,
  onRefresh,
}: PersonalGymsPageContentProps) {
  return (
    <PersonalGymsPage
      affiliations={affiliations}
      onRefresh={onRefresh}
    />
  );
}
