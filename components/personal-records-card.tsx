"use client"

import { mockPersonalRecords } from "@/lib/mock-data"
import { Award, TrendingUp } from "lucide-react"

export function PersonalRecordsCard() {
  return (
    <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-duo-yellow" />
        <h2 className="font-bold text-duo-text">Recordes Pessoais</h2>
      </div>

      <div className="space-y-3">
        {mockPersonalRecords.map((record) => (
          <div key={record.exerciseId} className="rounded-xl bg-gradient-to-r from-duo-yellow/10 to-transparent p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-duo-text">{record.exerciseName}</h3>
              <div className="text-2xl font-bold text-duo-yellow">
                {record.value}
                {record.type === "max-weight" ? "kg" : " reps"}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-duo-gray-dark">
                {new Date(record.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              {record.previousBest && (
                <div className="flex items-center gap-1 font-bold text-duo-green">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{record.value - record.previousBest}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
