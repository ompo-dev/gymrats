"use client"

import { mockWeightHistory } from "@/lib/mock-data"
import { TrendingUp } from "lucide-react"

export function WeightProgressChart() {
  const maxWeight = Math.max(...mockWeightHistory.map((w) => w.weight))
  const minWeight = Math.min(...mockWeightHistory.map((w) => w.weight))
  const range = maxWeight - minWeight

  return (
    <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-duo-green" />
          <h2 className="font-bold text-duo-text">Evolução de Peso</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-duo-green">+4.5kg</div>
          <div className="text-xs text-duo-gray-dark">Últimos 3 meses</div>
        </div>
      </div>

      {/* Gráfico simples */}
      <div className="relative h-48">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-px bg-duo-border" />
          ))}
        </div>

        {/* Line chart */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#58CC02"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={mockWeightHistory
              .map((point, index) => {
                const x = (index / (mockWeightHistory.length - 1)) * 100
                const y = 100 - ((point.weight - minWeight) / range) * 80
                return `${x}%,${y}%`
              })
              .join(" ")}
          />
        </svg>

        {/* Points */}
        {mockWeightHistory.map((point, index) => {
          const x = (index / (mockWeightHistory.length - 1)) * 100
          const y = 100 - ((point.weight - minWeight) / range) * 80
          return (
            <div
              key={index}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="h-3 w-3 rounded-full border-2 border-duo-green bg-white shadow-md" />
              <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-duo-text px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {point.weight}kg
              </div>
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className="mt-4 flex justify-between text-xs text-duo-gray-dark">
        {mockWeightHistory.map((point, index) => (
          <div key={index} className="text-center">
            {new Date(point.date).toLocaleDateString("pt-BR", { month: "short" })}
          </div>
        ))}
      </div>
    </div>
  )
}
