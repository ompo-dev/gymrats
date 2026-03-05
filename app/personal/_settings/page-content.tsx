"use client";

import { PersonalSettingsPage } from "@/components/organisms/personal";
import type { PersonalProfile } from "../types";

interface PersonalSettingsPageContentProps {
  profile: PersonalProfile | null;
}

export function PersonalSettingsPageContent({
  profile,
}: PersonalSettingsPageContentProps) {
  return <PersonalSettingsPage profile={profile} />;
}
