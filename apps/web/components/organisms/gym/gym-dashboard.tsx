"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  GymDashboardScreen,
  type GymDashboardScreenProps,
} from "@/components/screens/gym";
import { CheckInModal } from "./checkin-modal";

export type GymDashboardPageProps = Omit<
  GymDashboardScreenProps,
  "onOpenCheckIn"
>;

export function GymDashboardPage({
  profile,
  stats,
  students,
  equipment,
  recentCheckIns = [],
  subscription,
}: GymDashboardPageProps) {
  const router = useRouter();
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  return (
    <>
      <GymDashboardScreen
        profile={profile}
        stats={stats}
        students={students}
        equipment={equipment}
        recentCheckIns={recentCheckIns}
        subscription={subscription}
        onOpenCheckIn={() => setIsCheckInModalOpen(true)}
      />
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSuccess={() => {
          setIsCheckInModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
