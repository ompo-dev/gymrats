"use client"

import { useState } from "react"
import type { Exercise } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MultipleChoiceProps {
  exercise: Exercise
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void
}

export function MultipleChoice({ exercise, onAnswer }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const handleSubmit = () => {
    if (!selectedOption) return

    const correct = selectedOption === exercise.correctAnswer
    setIsCorrect(correct)
    setSubmitted(true)
    setTimeout(() => {
      onAnswer(correct, selectedOption)
    }, 1500)
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">{exercise.question}</h2>
        {exercise.imageUrl && (
          <img src={exercise.imageUrl || "/placeholder.svg"} alt="Exercise illustration" className="mt-4 rounded-xl" />
        )}
      </div>

      <div className="space-y-3">
        {exercise.options?.map((option) => {
          const isSelected = selectedOption === option
          const showResult = submitted && isSelected

          return (
            <button
              key={option}
              onClick={() => !submitted && setSelectedOption(option)}
              disabled={submitted}
              className={cn(
                "w-full rounded-xl border-2 p-4 text-left transition-all",
                !submitted && !isSelected && "border-border hover:border-primary hover:bg-primary/5",
                !submitted && isSelected && "border-primary bg-primary/10",
                submitted && !isSelected && "opacity-50",
                showResult && isCorrect && "border-success bg-success/10",
                showResult && !isCorrect && "border-destructive bg-destructive/10",
              )}
            >
              <span className="font-medium">{option}</span>
            </button>
          )
        })}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!selectedOption} size="lg" className="w-full">
          Verificar
        </Button>
      )}

      {submitted && (
        <div
          className={cn(
            "rounded-xl p-6",
            isCorrect ? "bg-success/10 text-success-foreground" : "bg-destructive/10 text-destructive-foreground",
          )}
        >
          <h3 className="mb-2 text-xl font-bold">{isCorrect ? "Correto!" : "Incorreto"}</h3>
          <p className={isCorrect ? "text-foreground" : "text-foreground"}>{exercise.explanation}</p>
        </div>
      )}
    </div>
  )
}
