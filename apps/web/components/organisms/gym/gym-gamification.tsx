"use client";

import { GymGamificationScreen } from "@/components/screens/gym";
import type { GymProfile } from "@/lib/types";

interface GymGamificationPageProps {
  profile: GymProfile;
}

export function GymGamificationPage({ profile }: GymGamificationPageProps) {
  return <GymGamificationScreen profile={profile} />;
}
