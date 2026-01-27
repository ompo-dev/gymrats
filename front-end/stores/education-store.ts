import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EducationalLesson, MuscleInfo, ExerciseInfo } from "@/lib/types"

interface EducationState {
  completedLessons: string[]
  completedQuizzes: string[]
  muscleInfo: MuscleInfo[]
  exerciseInfo: ExerciseInfo[]
  setCompletedLessons: (lessonIds: string[]) => void
  completeLesson: (lessonId: string) => void
  setCompletedQuizzes: (quizIds: string[]) => void
  completeQuiz: (quizId: string) => void
  setMuscleInfo: (info: MuscleInfo[]) => void
  setExerciseInfo: (info: ExerciseInfo[]) => void
  isLessonCompleted: (lessonId: string) => boolean
  isQuizCompleted: (quizId: string) => boolean
}

export const useEducationStore = create<EducationState>()(
  persist(
    (set, get) => ({
      completedLessons: [],
      completedQuizzes: [],
      muscleInfo: [],
      exerciseInfo: [],
      setCompletedLessons: (lessonIds) => set({ completedLessons: lessonIds }),
      completeLesson: (lessonId) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(lessonId)
            ? state.completedLessons
            : [...state.completedLessons, lessonId],
        })),
      setCompletedQuizzes: (quizIds) => set({ completedQuizzes: quizIds }),
      completeQuiz: (quizId) =>
        set((state) => ({
          completedQuizzes: state.completedQuizzes.includes(quizId)
            ? state.completedQuizzes
            : [...state.completedQuizzes, quizId],
        })),
      setMuscleInfo: (info) => set({ muscleInfo: info }),
      setExerciseInfo: (info) => set({ exerciseInfo: info }),
      isLessonCompleted: (lessonId) => {
        const state = get()
        return state.completedLessons.includes(lessonId)
      },
      isQuizCompleted: (quizId) => {
        const state = get()
        return state.completedQuizzes.includes(quizId)
      },
    }),
    {
      name: "education-storage",
    }
  )
)

