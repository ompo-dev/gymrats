"use client";

import { Trophy, Flame, Zap, TrendingUp, Calendar, Award } from "lucide-react";
import {
  mockUserProgress,
  mockWorkoutHistory,
  mockPersonalRecords,
  mockWeightHistory,
} from "@/lib/mock-data";
import { ProfileHeader } from "@/components/ui/profile-header";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { SectionCard } from "@/components/ui/section-card";
import { HistoryCard } from "@/components/ui/history-card";
import { RecordCard } from "@/components/ui/record-card";

export function ProfilePage() {
  console.log("[v0] Rendering ProfilePage");

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <ProfileHeader
        name="AtletaFit"
        username="@atletafit"
        memberSince="Jan 2025"
        stats={{
          workouts: mockUserProgress.workoutsCompleted,
          friends: 12,
          streak: mockUserProgress.currentStreak,
        }}
        quickStats={[
          { value: mockUserProgress.currentLevel, label: "Nível" },
          { value: mockUserProgress.totalXP, label: "XP Total" },
          { value: "82.5", label: "kg Atual" },
          { value: "+4.5", label: "kg Ganhos", highlighted: true },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardLarge
          icon={Flame}
          value={mockUserProgress.currentStreak}
          label="Dias seguidos"
          subtitle={`Recorde: ${mockUserProgress.longestStreak}`}
          iconColor="duo-orange"
        />
        <StatCardLarge
          icon={Zap}
          value={mockUserProgress.totalXP}
          label="XP Total"
          subtitle={`${mockUserProgress.xpToNextLevel} até nível ${
            mockUserProgress.currentLevel + 1
          }`}
          iconColor="duo-yellow"
        />
        <StatCardLarge
          icon={Trophy}
          value={`#${mockUserProgress.currentLevel}`}
          label="Nível atual"
          subtitle="Top 15% global"
          iconColor="duo-blue"
        />
        <StatCardLarge
          icon={TrendingUp}
          value={mockUserProgress.workoutsCompleted}
          label="Treinos"
          subtitle="+5 esta semana"
          iconColor="duo-green"
        />
      </div>

      <SectionCard
        icon={TrendingUp}
        title="Evolução de Peso"
        headerAction={
          <div className="text-right">
            <div className="text-2xl font-bold text-duo-green">+4.5kg</div>
            <div className="text-xs text-duo-gray-dark">Últimos 3 meses</div>
          </div>
        }
      >
        <div className="space-y-3">
          {mockWeightHistory.map((record, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="text-sm text-duo-gray-dark">
                {new Date(record.date).toLocaleDateString("pt-BR")}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-2 flex-1 rounded-full bg-duo-border"
                  style={{ width: `${record.weight}px` }}
                >
                  <div
                    className="h-full rounded-full bg-duo-green"
                    style={{ width: `${(record.weight / 85) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right font-bold text-duo-text">
                  {record.weight}kg
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Calendar} title="Histórico Recente">
          <div className="space-y-3">
            {mockWorkoutHistory.slice(0, 3).map((workout, index) => (
              <HistoryCard
                key={index}
                title={workout.workoutName}
                date={workout.date}
                status={
                  workout.overallFeedback === "excelente"
                    ? "excelente"
                    : workout.overallFeedback === "bom"
                    ? "bom"
                    : "regular"
                }
                metadata={[
                  { icon: "⏱️", label: `${workout.duration} min` },
                  {
                    icon: "💪",
                    label: `${workout.totalVolume.toLocaleString()} kg`,
                  },
                ]}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Award} title="Recordes Pessoais">
          <div className="space-y-3">
            {mockPersonalRecords.map((record, index) => (
              <RecordCard
                key={index}
                exerciseName={record.exerciseName}
                date={record.date}
                value={record.value}
                unit={record.type === "max-weight" ? "kg" : " reps"}
                previousBest={record.previousBest}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
