"use client"

import { useState, useEffect } from "react"
import { educationalLessons } from "@/lib/educational-data"
import type { EducationalLesson } from "@/lib/types"
import { CheckCircle, Clock, Zap } from "lucide-react"

interface EducationalLessonsProps {
  lessonId?: string | null
  onLessonSelect?: (id: string) => void
  onBack?: () => void
}

export function EducationalLessons({
  lessonId,
  onLessonSelect,
  onBack,
}: EducationalLessonsProps) {
  const [selectedLesson, setSelectedLesson] = useState<EducationalLesson | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // Sincronizar com search params
  useEffect(() => {
    if (lessonId) {
      const lesson = educationalLessons.find((l) => l.id === lessonId)
      if (lesson) setSelectedLesson(lesson)
    } else {
      setSelectedLesson(null)
    }
  }, [lessonId])

  const handleLessonSelect = (lesson: EducationalLesson) => {
    setSelectedLesson(lesson)
    onLessonSelect?.(lesson.id)
  }

  const handleBack = () => {
    setSelectedLesson(null)
    setShowQuiz(false)
    setQuizAnswers([])
    setQuizScore(null)
    onBack?.()
  }

  const handleCompleteLesson = () => {
    if (selectedLesson?.quiz) {
      setShowQuiz(true)
    } else {
      // Mark as completed and award XP
      console.log("[v0] Lesson completed, awarding XP:", selectedLesson?.xpReward)
      handleBack()
    }
  }

  const handleSubmitQuiz = () => {
    if (!selectedLesson?.quiz) return

    let correct = 0
    selectedLesson.quiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctAnswer) correct++
    })

    const score = (correct / selectedLesson.quiz.questions.length) * 100
    setQuizScore(score)

    if (score >= 70) {
      console.log("[v0] Quiz passed! Awarding XP:", selectedLesson.xpReward)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      anatomy: "🦴",
      nutrition: "🥗",
      "training-science": "🔬",
      recovery: "😴",
      form: "✓",
    }
    return icons[category] || "📚"
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      anatomy: "Anatomia",
      nutrition: "Nutrição",
      "training-science": "Ciência do Treino",
      recovery: "Recuperação",
      form: "Técnica",
    }
    return labels[category] || category
  }

  if (showQuiz && selectedLesson?.quiz) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-duo-text">Quiz: {selectedLesson.title}</h2>
          <p className="text-sm text-duo-gray-dark">Responda corretamente para ganhar {selectedLesson.xpReward} XP</p>
        </div>

        <div className="space-y-4">
          {selectedLesson.quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
              <div className="mb-4 font-bold text-duo-text">
                {qIndex + 1}. {question.question}
              </div>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => {
                      const newAnswers = [...quizAnswers]
                      newAnswers[qIndex] = oIndex
                      setQuizAnswers(newAnswers)
                    }}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                      quizAnswers[qIndex] === oIndex
                        ? "border-duo-blue bg-duo-blue/10 font-bold text-duo-blue"
                        : "border-duo-gray-border text-duo-text hover:border-duo-gray-dark"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {quizScore === null ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={quizAnswers.length < selectedLesson.quiz.questions.length}
            className="duo-button-green w-full disabled:opacity-50"
          >
            ENVIAR RESPOSTAS
          </button>
        ) : (
          <div
            className={`rounded-2xl border-2 p-6 text-center ${
              quizScore >= 70 ? "border-duo-green bg-duo-green/10" : "border-duo-red bg-duo-red/10"
            }`}
          >
            <div className="mb-2 text-4xl font-bold text-duo-text">{quizScore.toFixed(0)}%</div>
            <div className="mb-4 text-duo-gray-dark">
              {quizScore >= 70 ? "Parabéns! Você passou!" : "Continue estudando e tente novamente"}
            </div>
            <button
              onClick={() => {
                setShowQuiz(false)
                setQuizAnswers([])
                setQuizScore(null)
                if (quizScore >= 70) handleBack()
              }}
              className="duo-button-green w-full"
            >
              {quizScore >= 70 ? "CONTINUAR" : "TENTAR NOVAMENTE"}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (selectedLesson) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 font-bold text-duo-blue hover:underline"
        >
          ← Voltar
        </button>

        <div className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-6">
          <div className="mb-2 text-4xl">{getCategoryIcon(selectedLesson.category)}</div>
          <h2 className="mb-2 text-2xl font-bold text-duo-text">{selectedLesson.title}</h2>
          <div className="flex items-center gap-4 text-sm font-bold text-duo-gray-dark">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {selectedLesson.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-duo-yellow" />
              {selectedLesson.xpReward} XP
            </span>
            <span className="rounded-full bg-duo-blue/20 px-2 py-0.5 text-xs font-bold text-duo-blue">
              {getCategoryLabel(selectedLesson.category)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
          <div className="prose max-w-none text-duo-text">
            {selectedLesson.content.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-duo-green bg-duo-green/10 p-6">
          <h3 className="mb-3 text-lg font-bold text-duo-text">Pontos-Chave</h3>
          <ul className="space-y-2">
            {selectedLesson.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-duo-green" />
                <span className="text-duo-text">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={handleCompleteLesson} className="duo-button-green w-full">
          {selectedLesson.quiz ? "FAZER QUIZ" : "CONCLUIR LIÇÃO"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Lições Educacionais</h1>
        <p className="text-sm text-duo-gray-dark">Aprenda ciência do fitness com evidências</p>
      </div>

      <div className="space-y-3">
        {educationalLessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => handleLessonSelect(lesson)}
            className="w-full rounded-2xl border-2 border-duo-gray-border bg-white p-4 text-left transition-all hover:border-duo-blue hover:shadow-lg"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-blue/20 text-2xl">
                  {getCategoryIcon(lesson.category)}
                </div>
                <div>
                  <div className="mb-1 font-bold text-duo-text">{lesson.title}</div>
                  <div className="text-xs font-bold text-duo-gray-dark">{getCategoryLabel(lesson.category)}</div>
                </div>
              </div>
              {lesson.completed && <CheckCircle className="h-6 w-6 text-duo-green" />}
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-duo-gray-dark">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lesson.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-duo-yellow" />
                {lesson.xpReward} XP
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
