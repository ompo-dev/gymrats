import { create } from "zustand"
import type { UserType } from "@/lib/types"

interface UIState {
  // Student tabs
  studentTab: string
  educationView: "menu" | "muscles" | "lessons"
  
  // Gym tabs
  gymTab: string
  
  // Modals
  showLevelUpModal: boolean
  showStreakModal: boolean
  showAchievementModal: boolean
  
  // Other UI states
  showFoodSearch: boolean
  showWeightTracker: boolean
  
  // Actions
  setStudentTab: (tab: string) => void
  setEducationView: (view: "menu" | "muscles" | "lessons") => void
  setGymTab: (tab: string) => void
  setShowLevelUpModal: (show: boolean) => void
  setShowStreakModal: (show: boolean) => void
  setShowAchievementModal: (show: boolean) => void
  setShowFoodSearch: (show: boolean) => void
  setShowWeightTracker: (show: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  studentTab: "home",
  educationView: "menu",
  gymTab: "dashboard",
  showLevelUpModal: false,
  showStreakModal: false,
  showAchievementModal: false,
  showFoodSearch: false,
  showWeightTracker: false,
  setStudentTab: (tab) => set({ studentTab: tab }),
  setEducationView: (view) => set({ educationView: view }),
  setGymTab: (tab) => set({ gymTab: tab }),
  setShowLevelUpModal: (show) => set({ showLevelUpModal: show }),
  setShowStreakModal: (show) => set({ showStreakModal: show }),
  setShowAchievementModal: (show) => set({ showAchievementModal: show }),
  setShowFoodSearch: (show) => set({ showFoodSearch: show }),
  setShowWeightTracker: (show) => set({ showWeightTracker: show }),
}))

