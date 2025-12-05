import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  UserProgress,
  UserStats,
  Achievement,
  WorkoutHistory,
  PersonalRecord,
  ExerciseLog,
  DayPass,
} from "@/lib/types"
import { mockUserProgress, mockUserStats } from "@/lib/mock-data"
import { mockDayPasses } from "@/lib/gym-mock-data"

interface StudentState {
  progress: UserProgress
  stats: UserStats
  workoutHistory: WorkoutHistory[]
  personalRecords: PersonalRecord[]
  dayPasses: DayPass[]
  currentWorkout: {
    workoutId: string | null
    exerciseLogs: ExerciseLog[]
    currentExerciseIndex: number
  }
  setProgress: (progress: Partial<UserProgress>) => void
  addXP: (amount: number) => void
  incrementStreak: () => void
  resetStreak: () => void
  addAchievement: (achievement: Achievement) => void
  completeWorkout: (workoutId: string, xp: number) => void
  addWorkoutHistory: (history: WorkoutHistory) => void
  addPersonalRecord: (record: PersonalRecord) => void
  setCurrentWorkout: (workoutId: string | null) => void
  addExerciseLog: (log: ExerciseLog) => void
  setCurrentExerciseIndex: (index: number) => void
  clearCurrentWorkout: () => void
  addDayPass: (dayPass: DayPass) => void
  setDayPasses: (dayPasses: DayPass[]) => void
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      progress: mockUserProgress,
      stats: mockUserStats,
      workoutHistory: [],
      personalRecords: [],
      dayPasses: mockDayPasses,
      currentWorkout: {
        workoutId: null,
        exerciseLogs: [],
        currentExerciseIndex: 0,
      },
      setProgress: (newProgress) =>
        set((state) => ({
          progress: { ...state.progress, ...newProgress },
        })),
      addXP: (amount) =>
        set((state) => {
          const newTotalXP = state.progress.totalXP + amount
          const newTodayXP = state.progress.todayXP + amount
          const level = Math.floor(newTotalXP / 100) + 1
          const xpToNextLevel = level * 100 - newTotalXP

          return {
            progress: {
              ...state.progress,
              totalXP: newTotalXP,
              todayXP: newTodayXP,
              currentLevel: level,
              xpToNextLevel,
            },
          }
        }),
      incrementStreak: () =>
        set((state) => {
          const newStreak = state.progress.currentStreak + 1
          return {
            progress: {
              ...state.progress,
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, state.progress.longestStreak),
              lastActivityDate: new Date().toISOString(),
            },
          }
        }),
      resetStreak: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentStreak: 0,
            lastActivityDate: new Date().toISOString(),
          },
        })),
      addAchievement: (achievement) =>
        set((state) => ({
          progress: {
            ...state.progress,
            achievements: [...state.progress.achievements, achievement],
          },
        })),
      completeWorkout: (workoutId, xp) =>
        set((state) => {
          const newWorkoutsCompleted = state.progress.workoutsCompleted + 1
          const newTotalXP = state.progress.totalXP + xp
          const newTodayXP = state.progress.todayXP + xp
          const level = Math.floor(newTotalXP / 100) + 1
          const xpToNextLevel = level * 100 - newTotalXP

          return {
            progress: {
              ...state.progress,
              workoutsCompleted: newWorkoutsCompleted,
              totalXP: newTotalXP,
              todayXP: newTodayXP,
              currentLevel: level,
              xpToNextLevel,
            },
          }
        }),
      addWorkoutHistory: (history) =>
        set((state) => ({
          workoutHistory: [...state.workoutHistory, history],
        })),
      addPersonalRecord: (record) =>
        set((state) => ({
          personalRecords: [...state.personalRecords, record],
        })),
      setCurrentWorkout: (workoutId) =>
        set({
          currentWorkout: {
            workoutId,
            exerciseLogs: [],
            currentExerciseIndex: 0,
          },
        }),
      addExerciseLog: (log) =>
        set((state) => ({
          currentWorkout: {
            ...state.currentWorkout,
            exerciseLogs: [...state.currentWorkout.exerciseLogs, log],
          },
        })),
      setCurrentExerciseIndex: (index) =>
        set((state) => ({
          currentWorkout: {
            ...state.currentWorkout,
            currentExerciseIndex: index,
          },
        })),
      clearCurrentWorkout: () =>
        set({
          currentWorkout: {
            workoutId: null,
            exerciseLogs: [],
            currentExerciseIndex: 0,
          },
        }),
      addDayPass: (dayPass) =>
        set((state) => ({
          dayPasses: [...state.dayPasses, dayPass],
        })),
      setDayPasses: (dayPasses) => set({ dayPasses }),
    }),
    {
      name: "student-storage",
    }
  )
)

