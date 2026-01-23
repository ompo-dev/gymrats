"use client"

import { useState } from "react"
import type { Exercise } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface TrueFalseProps {
  exercise: Exercise
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void
}

export function TrueFalse({ exercise, onAnswer }: TrueFalseProps) {
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

  const options = [
    { value: "Verdadeiro", icon: Check, color: "success" },
    { value: "Falso", icon: X, color: "destructive" },
  ]

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">{exercise.question}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = selectedOption === option.value
          const showResult = submitted && isSelected

          return (
            <button
              key={option.value}
              onClick={() => !submitted && setSelectedOption(option.value)}
              disabled={submitted}
              className={cn(
                "flex flex-col items-center gap-4 rounded-2xl border-4 p-8 transition-all",
                !submitted && !isSelected && "border-border hover:border-primary",
                !submitted && isSelected && "border-primary bg-primary/10",
                submitted && !isSelected && "opacity-50",
                showResult && isCorrect && "border-success bg-success/10",
                showResult && !isCorrect && "border-destructive bg-destructive/10",
              )}
            >
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full",
                  option.color === "success" ? "bg-success/20" : "bg-destructive/20",
                )}
              >
                <Icon className={cn("h-10 w-10", option.color === "success" ? "text-success" : "text-destructive")} />
              </div>
              <span className="text-xl font-bold">{option.value}</span>
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
        <div className={cn("rounded-xl p-6", isCorrect ? "bg-success/10" : "bg-destructive/10")}>
          <h3 className="mb-2 text-xl font-bold">{isCorrect ? "Correto!" : "Incorreto"}</h3>
          <p className="text-foreground">{exercise.explanation}</p>
        </div>
      )}
    </div>
  )
}
