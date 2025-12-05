"use client"

import { useState, useRef } from "react"
import { analyzeFormWithAI } from "@/lib/posture-analysis"
import type { FormCheckResult } from "@/lib/types"
import { Camera, CheckCircle, AlertTriangle, XCircle, Loader } from "lucide-react"

interface FormCheckerProps {
  exerciseName: string
  exerciseId: string
  onComplete?: (result: FormCheckResult) => void
}

export function FormChecker({ exerciseName, exerciseId, onComplete }: FormCheckerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<FormCheckResult | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setHasCamera(true)
      }
    } catch (error) {
      console.error("[v0] Camera access denied:", error)
      alert("Permita o acesso à câmera para usar esta funcionalidade")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setHasCamera(false)
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    // Simular gravação por 5 segundos
    setTimeout(() => {
      setIsRecording(false)
      analyzeForm()
    }, 5000)
  }

  const analyzeForm = async () => {
    setIsAnalyzing(true)

    // Mock video data
    const mockVideoBlob = new Blob([], { type: "video/mp4" })

    const analysisResult = await analyzeFormWithAI(mockVideoBlob, exerciseId)
    setResult(analysisResult)
    setIsAnalyzing(false)
    stopCamera()

    if (onComplete) {
      onComplete(analysisResult)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-duo-green"
    if (score >= 70) return "text-duo-yellow"
    return "text-duo-red"
  }

  const getOverallLabel = (overall: string) => {
    const labels: Record<string, string> = {
      excellent: "Excelente",
      good: "Bom",
      "needs-improvement": "Precisa Melhorar",
      poor: "Ruim",
    }
    return labels[overall] || overall
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`mb-4 text-6xl font-bold ${getScoreColor(result.score)}`}>{result.score}</div>
          <div className="mb-2 text-2xl font-bold text-duo-text">{getOverallLabel(result.overall)}</div>
          <div className="text-sm text-duo-gray-dark">{exerciseName}</div>
        </div>

        <div className="space-y-3">
          {result.feedback.map((feedback, index) => {
            const Icon =
              feedback.type === "success" ? CheckCircle : feedback.type === "warning" ? AlertTriangle : XCircle
            const colorClass =
              feedback.type === "success"
                ? "border-duo-green bg-duo-green/10"
                : feedback.type === "warning"
                  ? "border-duo-yellow bg-duo-yellow/10"
                  : "border-duo-red bg-duo-red/10"

            return (
              <div key={index} className={`rounded-2xl border-2 p-4 ${colorClass}`}>
                <div className="mb-2 flex items-start gap-3">
                  <Icon
                    className={`mt-0.5 h-6 w-6 shrink-0 ${
                      feedback.type === "success"
                        ? "text-duo-green"
                        : feedback.type === "warning"
                          ? "text-duo-yellow"
                          : "text-duo-red"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="mb-1 font-bold text-duo-text">{feedback.title}</div>
                    <div className="mb-2 text-sm text-duo-gray-dark">{feedback.description}</div>
                    <div className="rounded-lg bg-white/50 p-2 text-sm">
                      <span className="font-bold">Sugestão: </span>
                      {feedback.suggestion}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={() => setResult(null)} className="duo-button-green w-full">
          ANALISAR NOVAMENTE
        </button>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader className="h-16 w-16 animate-spin text-duo-blue" />
        <div className="text-xl font-bold text-duo-text">Analisando sua forma...</div>
        <div className="text-sm text-duo-gray-dark">Isso pode levar alguns segundos</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-duo-text">Análise de Postura</h2>
        <p className="text-sm text-duo-gray-dark">Grave um vídeo do seu exercício para análise com IA</p>
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-duo-gray-border bg-duo-gray-light">
        {hasCamera ? (
          <div className="relative aspect-[3/4]">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            {isRecording && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-duo-red px-3 py-2 text-sm font-bold text-white">
                <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
                Gravando...
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[3/4] flex-col items-center justify-center p-8 text-center">
            <Camera className="mb-4 h-20 w-20 text-duo-gray-dark" />
            <div className="mb-2 text-lg font-bold text-duo-text">Câmera Desativada</div>
            <div className="mb-6 text-sm text-duo-gray-dark">Permita o acesso à câmera para gravar seu exercício</div>
            <button onClick={startCamera} className="duo-button-green">
              ATIVAR CÂMERA
            </button>
          </div>
        )}
      </div>

      {hasCamera && !isRecording && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-duo-blue bg-duo-blue/10 p-4">
            <div className="mb-2 font-bold text-duo-text">Dicas para melhor análise:</div>
            <ul className="space-y-1 text-sm text-duo-gray-dark">
              <li>• Posicione a câmera de lado para ver seu perfil</li>
              <li>• Garanta boa iluminação</li>
              <li>• Fique completamente visível no quadro</li>
              <li>• Faça 2-3 repetições do exercício</li>
            </ul>
          </div>

          <button onClick={startRecording} className="duo-button-green w-full">
            <Camera className="mr-2 h-5 w-5" />
            INICIAR GRAVAÇÃO (5s)
          </button>
        </div>
      )}
    </div>
  )
}
