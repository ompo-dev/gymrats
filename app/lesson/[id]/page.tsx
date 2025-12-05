"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { LessonHeader } from "@/components/lesson-header"
import { MultipleChoice } from "@/components/quiz/multiple-choice"
import { TrueFalse } from "@/components/quiz/true-false"
import { LessonComplete } from "@/components/lesson-complete"
import { mockLessons } from "@/lib/mock-data"

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [lesson] = useState(() => mockLessons.find((l) => l.id === id))
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!lesson) {
      router.push("/")
    }
  }, [lesson, router])

  if (!lesson) {
    return null
  }

  const currentExercise = lesson.exercises[currentExerciseIndex]
  const progress = ((currentExerciseIndex + 1) / lesson.exercises.length) * 100

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1)
    } else {
      setLives((prev) => Math.max(0, prev - 1))
    }

    if (currentExerciseIndex < lesson.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
    } else {
      setIsComplete(true)
    }
  }

  const handleExit = () => {
    router.push("/")
  }

  const handleContinue = () => {
    router.push("/")
  }

  const calculateStars = () => {
    const accuracy = correctAnswers / lesson.exercises.length
    if (accuracy === 1) return 3
    if (accuracy >= 0.7) return 2
    if (accuracy >= 0.5) return 1
    return 0
  }

  if (isComplete) {
    return (
      <LessonComplete
        correctAnswers={correctAnswers}
        totalQuestions={lesson.exercises.length}
        xpEarned={lesson.xpReward}
        stars={calculateStars()}
        onContinue={handleContinue}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <LessonHeader progress={progress} lives={lives} onExit={handleExit} />

      <main className="flex-1 overflow-y-auto scrollbar-hide container flex items-center px-4 py-12">
        {currentExercise.type === "multiple-choice" && (
          <MultipleChoice exercise={currentExercise} onAnswer={handleAnswer} />
        )}
        {currentExercise.type === "true-false" && <TrueFalse exercise={currentExercise} onAnswer={handleAnswer} />}
      </main>
    </div>
  )
}
