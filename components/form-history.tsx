"use client"

import { mockPostureAnalyses } from "@/lib/posture-analysis"
import { generateFormProgress } from "@/lib/posture-analysis"
import type { PostureAnalysis } from "@/lib/types"
import { TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react"

export function FormHistory() {
  const analyses = mockPostureAnalyses
  const progress = generateFormProgress(analyses)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Histórico de Análises</h1>
        <p className="text-sm text-duo-gray-dark">Acompanhe a evolução da sua técnica</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-4 text-center">
          <Award className="mx-auto mb-2 h-10 w-10 text-duo-blue" />
          <div className="mb-1 text-2xl font-bold text-duo-text">{progress.averageScore.toFixed(0)}</div>
          <div className="text-xs font-bold text-duo-gray-dark">pontuação média</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-green bg-gradient-to-br from-duo-green/10 to-duo-yellow/10 p-4 text-center">
          {progress.improvementRate >= 0 ? (
            <TrendingUp className="mx-auto mb-2 h-10 w-10 text-duo-green" />
          ) : (
            <TrendingDown className="mx-auto mb-2 h-10 w-10 text-duo-red" />
          )}
          <div className="mb-1 text-2xl font-bold text-duo-text">
            {progress.improvementRate >= 0 ? "+" : ""}
            {progress.improvementRate.toFixed(1)}%
          </div>
          <div className="text-xs font-bold text-duo-gray-dark">de melhoria</div>
        </div>
      </div>

      {/* Strengths */}
      {progress.strengths.length > 0 && (
        <div className="rounded-2xl border-2 border-duo-green bg-duo-green/10 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-duo-text">
            <Award className="h-6 w-6 text-duo-green" />
            Seus Pontos Fortes
          </h3>
          <div className="flex flex-wrap gap-2">
            {progress.strengths.map((strength, i) => (
              <span key={i} className="rounded-xl bg-duo-green/20 px-3 py-2 text-sm font-bold text-duo-green">
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Common issues */}
      {progress.commonIssues.length > 0 && (
        <div className="rounded-2xl border-2 border-duo-yellow bg-duo-yellow/10 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-duo-text">
            <AlertCircle className="h-6 w-6 text-duo-yellow" />
            Áreas para Melhorar
          </h3>
          <div className="space-y-2">
            {progress.commonIssues.map((issue, i) => (
              <div key={i} className="rounded-lg bg-white p-3 text-sm font-bold text-duo-text">
                {issue}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis history */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-duo-text">Análises Recentes</h3>
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalysisCard({ analysis }: { analysis: PostureAnalysis }) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-duo-green"
    if (score >= 70) return "bg-duo-yellow"
    return "bg-duo-red"
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="mb-1 font-bold text-duo-text">{analysis.exerciseName}</div>
          <div className="text-xs font-bold text-duo-gray-dark">{formatDate(analysis.timestamp)}</div>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${getScoreColor(analysis.score)}`}>
          <span className="text-xl font-bold text-white">{analysis.score}</span>
        </div>
      </div>

      {analysis.feedback.length > 0 && (
        <div className="space-y-2">
          {analysis.feedback.slice(0, 2).map((feedback, i) => (
            <div key={i} className="rounded-lg bg-duo-gray-light p-2 text-sm">
              <div className="font-bold text-duo-text">{feedback.title}</div>
              <div className="text-xs text-duo-gray-dark">{feedback.bodyPart}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
