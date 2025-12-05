"use client"

import { parseAsString, useQueryState } from "nuqs"
import { Suspense } from "react"
import { GymDashboardPage } from "./components/gym-dashboard"
import { GymStudentsPage } from "./components/gym-students"
import { GymEquipmentPage } from "./components/gym-equipment"
import { GymFinancialPage } from "./components/gym-financial"
import { GymStatsPage } from "./components/gym-stats"
import { GymSettingsPage } from "./components/gym-settings"
import { GymGamificationPage } from "./components/gym-gamification"
import { GymMoreMenu } from "@/components/gym-more-menu"

function GymHomeContent() {
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"))

  return (
    <div>
      {tab === "dashboard" && <GymDashboardPage />}
      {tab === "students" && <GymStudentsPage />}
      {tab === "equipment" && <GymEquipmentPage />}
      {tab === "financial" && <GymFinancialPage />}
      {tab === "stats" && <GymStatsPage />}
      {tab === "settings" && <GymSettingsPage />}
      {tab === "gamification" && <GymGamificationPage />}
      {tab === "more" && <GymMoreMenu />}
    </div>
  )
}

export default function GymHome() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Carregando...</div>}>
      <GymHomeContent />
    </Suspense>
  )
}

