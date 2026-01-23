import type { PostureAnalysis, PostureFeedback, FormCheckResult } from "./types"

export const mockPostureAnalyses: PostureAnalysis[] = [
  {
    id: "analysis-1",
    exerciseId: "bench-press",
    exerciseName: "Supino Reto",
    timestamp: new Date(Date.now() - 86400000),
    score: 85,
    feedback: [
      {
        type: "success",
        title: "Ótima amplitude de movimento",
        description: "Você está usando a amplitude completa corretamente",
        severity: "low",
        bodyPart: "Braços",
        suggestion: "Continue mantendo esse padrão",
      },
      {
        type: "warning",
        title: "Cotovelos ligeiramente abertos",
        description: "Seus cotovelos estão a 60 graus. O ideal é 45 graus",
        severity: "medium",
        bodyPart: "Cotovelos",
        suggestion: "Traga os cotovelos mais próximos do corpo",
      },
    ],
    keyPoints: [],
  },
  {
    id: "analysis-2",
    exerciseId: "squat",
    exerciseName: "Agachamento",
    timestamp: new Date(Date.now() - 172800000),
    score: 92,
    feedback: [
      {
        type: "success",
        title: "Profundidade perfeita",
        description: "Quadris abaixo da linha dos joelhos",
        severity: "low",
        bodyPart: "Pernas",
        suggestion: "Excelente! Continue assim",
      },
      {
        type: "success",
        title: "Coluna neutra",
        description: "Postura da coluna está correta",
        severity: "low",
        bodyPart: "Coluna",
        suggestion: "Mantenha o core contraído",
      },
    ],
    keyPoints: [],
  },
]

// Função para analisar postura (preparado para IA)
export async function analyzeFormWithAI(videoData: Blob, exerciseId: string): Promise<FormCheckResult> {
  console.log("[v0] Analyzing form for exercise:", exerciseId)

  // Simulação - futuramente conectar com IA
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock result
  const mockResults: FormCheckResult[] = [
    {
      overall: "excellent",
      score: 95,
      feedback: [
        {
          type: "success",
          title: "Técnica excelente",
          description: "Todos os aspectos da forma estão corretos",
          severity: "low",
          bodyPart: "Geral",
          suggestion: "Continue com essa execução",
        },
      ],
    },
    {
      overall: "good",
      score: 78,
      feedback: [
        {
          type: "warning",
          title: "Atenção à postura",
          description: "Pequenos ajustes necessários",
          severity: "medium",
          bodyPart: "Costas",
          suggestion: "Mantenha o peito mais elevado",
        },
      ],
    },
  ]

  return mockResults[Math.floor(Math.random() * mockResults.length)]
}

// Análise de pontos-chave do corpo
export function analyzeKeyPoints(exercise: string): PostureFeedback[] {
  const feedbackDatabase: Record<string, PostureFeedback[]> = {
    "bench-press": [
      {
        type: "warning",
        title: "Caminho da barra",
        description: "A barra deve descer em linha reta até o peito",
        severity: "high",
        bodyPart: "Trajetória",
        suggestion: "Visualize uma linha vertical da barra ao peito",
      },
      {
        type: "error",
        title: "Glúteos fora do banco",
        description: "Manter os glúteos no banco é essencial para segurança",
        severity: "high",
        bodyPart: "Quadril",
        suggestion: "Mantenha os glúteos pressionados contra o banco",
      },
    ],
    squat: [
      {
        type: "error",
        title: "Joelhos colapsando",
        description: "Joelhos estão indo para dentro durante a subida",
        severity: "high",
        bodyPart: "Joelhos",
        suggestion: "Empurre os joelhos para fora, alinhados com os pés",
      },
      {
        type: "warning",
        title: "Profundidade insuficiente",
        description: "Desça até quadris abaixo da linha dos joelhos",
        severity: "medium",
        bodyPart: "Quadril",
        suggestion: "Trabalhe mobilidade de quadril e tornozelo",
      },
    ],
    deadlift: [
      {
        type: "error",
        title: "Coluna arredondada",
        description: "A coluna está arredondando durante o movimento",
        severity: "high",
        bodyPart: "Coluna",
        suggestion: "Mantenha o peito elevado e escápulas retraídas",
      },
      {
        type: "warning",
        title: "Barra longe do corpo",
        description: "A barra deve deslizar próxima às pernas",
        severity: "high",
        bodyPart: "Trajetória",
        suggestion: "Puxe a barra para trás, ative o latíssimo",
      },
    ],
  }

  return feedbackDatabase[exercise] || []
}

// Gerar relatório de progresso de forma
export function generateFormProgress(analyses: PostureAnalysis[]): {
  averageScore: number
  improvementRate: number
  commonIssues: string[]
  strengths: string[]
} {
  const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length

  // Calcular taxa de melhoria
  const recentScores = analyses.slice(-5).map((a) => a.score)
  const oldScores = analyses.slice(0, 5).map((a) => a.score)
  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
  const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length
  const improvementRate = ((recentAvg - oldAvg) / oldAvg) * 100

  // Identificar problemas comuns
  const allFeedback = analyses.flatMap((a) => a.feedback)
  const issues = allFeedback.filter((f) => f.type === "error" || f.type === "warning")
  const commonIssues = [...new Set(issues.map((i) => i.title))].slice(0, 3)

  // Identificar pontos fortes
  const successes = allFeedback.filter((f) => f.type === "success")
  const strengths = [...new Set(successes.map((s) => s.title))].slice(0, 3)

  return {
    averageScore,
    improvementRate,
    commonIssues,
    strengths,
  }
}
