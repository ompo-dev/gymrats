"use client";

import { mockGymStats, mockEquipment } from "@/lib/gym-mock-data";
import {
  TrendingUp,
  Users,
  Activity,
  Dumbbell,
  Calendar,
  Clock,
  Target,
} from "lucide-react";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";

export function GymStatsPage() {
  const weeklyData = [
    { day: "Seg", checkins: 58, value: 70 },
    { day: "Ter", checkins: 62, value: 75 },
    { day: "Qua", checkins: 71, value: 86 },
    { day: "Qui", checkins: 68, value: 82 },
    { day: "Sex", checkins: 75, value: 91 },
    { day: "Sáb", checkins: 54, value: 65 },
    { day: "Dom", checkins: 35, value: 42 },
  ];

  const hourlyData = [
    { hour: "6h", students: 12 },
    { hour: "8h", students: 28 },
    { hour: "10h", students: 45 },
    { hour: "12h", students: 32 },
    { hour: "14h", students: 25 },
    { hour: "16h", students: 38 },
    { hour: "18h", students: 67 },
    { hour: "20h", students: 54 },
    { hour: "22h", students: 18 },
  ];

  const maxHourlyStudents = Math.max(...hourlyData.map((d) => d.students));

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Estatísticas Detalhadas
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Análise completa do desempenho da academia
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="grid grid-cols-2 gap-4">
          <StatCardLarge
            icon={Users}
            value={String(mockGymStats.week.totalCheckins)}
            label="Check-ins Semana"
            subtitle="+8%"
            iconColor="duo-blue"
          />
          <StatCardLarge
            icon={Activity}
            value={`${mockGymStats.month.retentionRate}%`}
            label="Taxa Retenção"
            subtitle="+5%"
            iconColor="duo-green"
          />
          <StatCardLarge
            icon={Target}
            value={String(mockGymStats.week.avgDailyCheckins)}
            label="Média Diária"
            subtitle="85%"
            iconColor="duo-purple"
          />
          <StatCardLarge
            icon={Dumbbell}
            value={String(mockEquipment.length)}
            label="Equipamentos Ativos"
            subtitle="78%"
            iconColor="duo-orange"
          />
        </div>
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard
          title="Check-ins por Dia"
          icon={Calendar}
          variant="highlighted"
        >
          <div className="space-y-3">
            {weeklyData.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-duo-gray-dark">
                      {day.day}
                    </span>
                    <span className="font-bold text-duo-text">
                      {day.checkins}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-duo-green transition-all"
                      style={{ width: `${day.value}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <SectionCard title="Horários Populares" icon={Clock} variant="orange">
          <div className="space-y-2">
            {hourlyData.map((item, index) => (
              <motion.div
                key={item.hour}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-xs font-bold text-duo-gray-dark">
                    {item.hour}
                  </div>
                  <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-gray-100">
                    <div
                      className="flex h-full items-center rounded-lg bg-duo-orange px-2 text-xs font-bold text-white transition-all"
                      style={{
                        width: `${(item.students / maxHourlyStudents) * 100}%`,
                      }}
                    >
                      {item.students > 15 && item.students}
                    </div>
                  </div>
                  <div className="w-8 text-right text-xs font-bold text-duo-text">
                    {item.students}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.4}>
        <SectionCard
          title="Equipamentos Mais Usados"
          icon={Dumbbell}
          variant="blue"
        >
          <div className="space-y-3">
            {mockEquipment.slice(0, 5).map((eq, index) => (
              <motion.div
                key={eq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <DuoCard variant="default" size="sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-duo-blue text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-duo-text">
                        {eq.name}
                      </div>
                      <div className="text-xs text-duo-gray-dark">
                        {eq.usageStats.totalUses} usos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-duo-blue">
                        {eq.usageStats.avgUsageTime}min
                      </div>
                      <div className="text-xs text-duo-gray-dark">média</div>
                    </div>
                  </div>
                </DuoCard>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </SlideIn>
    </div>
  );
}
