"use client";

import { GymStatsScreen } from "@/components/screens/gym";
import type { Equipment, GymStats } from "@/lib/types";

interface GymStatsPageProps {
  stats: GymStats;
  equipment: Equipment[];
}

export function GymStatsPage({ stats, equipment }: GymStatsPageProps) {
  return <GymStatsScreen stats={stats} equipment={equipment} />;
}
