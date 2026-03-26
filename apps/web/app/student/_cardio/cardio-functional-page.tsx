"use client";

import { useState } from "react";
import { StudentCardioScreen } from "@/components/screens/student";
import { CardioTracker } from "@/components/organisms/trackers/cardio-tracker";
import { FunctionalWorkout } from "@/components/organisms/workout/functional-workout";

export function CardioFunctionalPage() {
  const [view, setView] = useState<"menu" | "cardio" | "functional">("menu");

  return (
    <StudentCardioScreen
      cardioSlot={<CardioTracker.Simple />}
      functionalSlot={<FunctionalWorkout.Simple />}
      onBackToMenu={() => setView("menu")}
      onSelectView={setView}
      view={view}
    />
  );
}
