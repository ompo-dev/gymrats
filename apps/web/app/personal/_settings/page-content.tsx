"use client";

import { PersonalSettingsPage } from "@/components/organisms/personal";
import type { PersonalMembershipPlan } from "../actions";
import type { PersonalProfile } from "../types";

interface PersonalSettingsPageContentProps {
  profile: PersonalProfile | null;
  plans: PersonalMembershipPlan[];
  onRefresh?: () => Promise<void>;
}

export function PersonalSettingsPageContent({
  profile,
  plans,
  onRefresh,
}: PersonalSettingsPageContentProps) {
  return <PersonalSettingsPage profile={profile} plans={plans} onRefresh={onRefresh} />;
}
