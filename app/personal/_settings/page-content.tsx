"use client";

import { PersonalSettingsPage } from "@/components/organisms/personal";
import type { PersonalProfile } from "../types";

interface PersonalSettingsPageContentProps {
  profile: PersonalProfile | null;
  onRefresh?: () => Promise<void>;
}

export function PersonalSettingsPageContent({
  profile,
  onRefresh,
}: PersonalSettingsPageContentProps) {
  return <PersonalSettingsPage profile={profile} onRefresh={onRefresh} />;
}
