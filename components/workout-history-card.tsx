"use client"

import { mockWorkoutHistory } from "@/lib/mock-data"
import { Calendar, Clock, TrendingUp, Weight } from "lucide-react"

export function WorkoutHistoryCard() {
  return (
    <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-duo-blue" />
          <h2 className="font-bold text-duo-text">Histórico de Treinos</h2>
        </div>
        <button className="text-sm font-bold text-duo-blue hover:underline">Ver todos</button>
      </div>

      <div className="space-y-3">
        {mockWorkoutHistory.slice(0, 5).map((workout, index) => (
          <div
            key={index}
            className="group cursor-pointer rounded-xl border-2 border-duo-border bg-gray-50 p-4 transition-all hover:border-duo-blue hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="mb-1 font-bold text-duo-text">{workout.workoutName}</h3>
                <p className="text-xs text-duo-gray-dark">
                  {new Date(workout.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  workout.overallFeedback === "excelente"
                    ? "bg-duo-green/20 text-duo-green"
                    : workout.overallFeedback === "bom"
                      ? "bg-duo-blue/20 text-duo-blue"
                      : "bg-duo-yellow/20 text-duo-yellow",
                )}
              >
                {workout.overallFeedback}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-duo-gray-dark">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{workout.duration}min</span>
              </div>
              <div className="flex items-center gap-1">
                <Weight className="h-3.5 w-3.5" />
                <span>{workout.totalVolume}kg</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{workout.exercises.length} exercícios</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
