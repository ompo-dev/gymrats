"use client"

import { useState } from "react"
import { placementQuestions, calculatePlacementResult } from "@/lib/mock-data"
import type { PlacementTestResult } from "@/lib/types"
import { Check } from "lucide-react"

interface PlacementTestProps {
  onComplete: (result: PlacementTestResult) => void
}

export function PlacementTest({ onComplete }: PlacementTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const question = placementQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / placementQuestions.length) * 100

  const handleAnswer = (answer: string | string[]) => {
    const newResponses = { ...responses, [question.id]: answer }
    setResponses(newResponses)

    if (currentQuestion < placementQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedOptions([])
      }, 300)
    } else {
      const result = calculatePlacementResult(newResponses)
      setTimeout(() => onComplete(result), 500)
    }
  }

  const handleMultipleSelection = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option]
    setSelectedOptions(newSelected)
  }

  const isMultipleSelection = question.type === "selection"

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-white pb-4 pt-6">
        <div className="container px-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-duo-gray-dark">Teste de Nivelamento</span>
            <span className="font-bold text-duo-green">
              {currentQuestion + 1}/{placementQuestions.length}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-duo-gray-light">
            <div
              className="h-full rounded-full bg-duo-green transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Question icon */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-duo-blue/20 to-duo-green/20 text-5xl">
              {question.icon}
            </div>
            <h2 className="text-2xl font-bold text-duo-text">{question.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isSelected = isMultipleSelection
                ? selectedOptions.includes(option)
                : responses[question.id] === option

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isMultipleSelection) {
                      handleMultipleSelection(option)
                    } else {
                      handleAnswer(option)
                    }
                  }}
                  className={`w-full rounded-2xl border-2 p-6 text-left font-bold transition-all hover:scale-[1.02] ${
                    isSelected
                      ? "border-duo-green bg-duo-green/10 text-duo-green"
                      : "border-duo-gray-border bg-white text-duo-text hover:border-duo-gray-dark"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{option}</span>
                    {isSelected && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-duo-green">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Continue button for multiple selection */}
          {isMultipleSelection && selectedOptions.length > 0 && (
            <button onClick={() => handleAnswer(selectedOptions)} className="duo-button-green mt-6 w-full">
              CONTINUAR
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
