"use client";

import {
  Activity,
  Calendar,
  Clock,
  Dumbbell,
  Target,
  Users,
} from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import type { Equipment, GymStats } from "@/lib/types";
import { normalizeEquipmentList } from "@/lib/utils/gym/normalize-equipment";

export interface GymStatsScreenProps
  extends ScreenProps<{
    stats: GymStats;
    equipment: Equipment[];
  }> {}

export const gymStatsScreenContract: ViewContract = {
  componentId: "gym-stats-screen",
  testId: "gym-stats-screen",
};

export function GymStatsScreen({ stats, equipment }: GymStatsScreenProps) {
  const safeEquipment = normalizeEquipmentList(equipment);

  return (
    <ScreenShell.Root screenId={gymStatsScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading className="text-center sm:text-center">
            <ScreenShell.Title>Estatísticas Detalhadas</ScreenShell.Title>
            <ScreenShell.Description>
              Análise completa do desempenho da academia
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoStatsGrid.Root
            columns={2}
            className="gap-4"
            data-testid={createTestSelector(
              gymStatsScreenContract.testId,
              "metrics",
            )}
          >
            <DuoStatCard.Simple
              icon={Users}
              value={String(stats.week.totalCheckins)}
              label="Check-ins Semana"
              badge="+8%"
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={Activity}
              value={`${stats.month.retentionRate}%`}
              label="Taxa Retenção"
              badge="+5%"
              iconColor="var(--duo-primary)"
            />
            <DuoStatCard.Simple
              icon={Target}
              value={String(stats.week.avgDailyCheckins)}
              label="Média Diária"
              badge="85%"
              iconColor="#A560E8"
            />
            <DuoStatCard.Simple
              icon={Dumbbell}
              value={String(safeEquipment.length)}
              label="Equipamentos Ativos"
              badge="78%"
              iconColor="var(--duo-accent)"
            />
          </DuoStatsGrid.Root>
        </SlideIn>

        <SlideIn delay={0.2}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              gymStatsScreenContract.testId,
              "checkins-by-day",
            )}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Calendar
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-[var(--duo-fg)]">
                  Check-ins por Dia
                </h2>
              </div>
            </DuoCard.Header>
            <p className="mb-4 text-sm font-medium text-duo-text">
              Últimos 7 dias • Total: {stats.week.totalCheckins} check-ins
            </p>
            <div className="space-y-3">
              {(stats.week.checkinsByDay ?? []).length === 0 ? (
                <DuoCard.Root
                  variant="default"
                  size="default"
                  className="p-8 text-center"
                >
                  <Calendar className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
                  <p className="font-bold text-duo-gray-dark">
                    Nenhum check-in na última semana
                  </p>
                  <p className="mt-1 text-sm text-duo-gray-dark">
                    Os dados aparecerão aqui conforme os alunos fizerem check-in.
                  </p>
                </DuoCard.Root>
              ) : (
                (stats.week.checkinsByDay ?? []).map((day, index) => {
                  const maxCheckins = Math.max(
                    ...(stats.week.checkinsByDay ?? []).map((item) => item.checkins),
                    1,
                  );
                  const percent = Math.round((day.checkins / maxCheckins) * 100);

                  return (
                    <div key={day.dayKey} className={index > 0 ? "pt-0" : undefined}>
                      <DuoCard.Root variant="default" size="default">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-duo-green/10">
                            <Calendar className="h-5 w-5 text-duo-green" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-duo-text">
                                {day.day}
                              </span>
                              <span className="text-sm font-bold text-duo-green">
                                {day.checkins} check-ins
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-duo-green transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </DuoCard.Root>
                    </div>
                  );
                })
              )}
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.3}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              gymStatsScreenContract.testId,
              "popular-hours",
            )}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Clock
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-[var(--duo-fg)]">
                  Horários Populares
                </h2>
              </div>
            </DuoCard.Header>
            <p className="mb-4 text-sm font-medium text-duo-text">
              Distribuição por hora (6h–22h) • Pico: {stats.today.peakHour}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(stats.week.checkinsByHour ?? []).length === 0 ? (
                <DuoCard.Root
                  variant="default"
                  size="default"
                  className="col-span-full p-8 text-center"
                >
                  <Clock className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
                  <p className="font-bold text-duo-gray-dark">
                    Nenhum dado de horário ainda
                  </p>
                  <p className="mt-1 text-sm text-duo-gray-dark">
                    Os horários mais movimentados aparecerão conforme os
                    check-ins.
                  </p>
                </DuoCard.Root>
              ) : (
                (stats.week.checkinsByHour ?? []).map((item, index) => {
                  const maxCheckins = Math.max(
                    ...(stats.week.checkinsByHour ?? []).map((entry) => entry.checkins),
                    1,
                  );
                  const percent = Math.round((item.checkins / maxCheckins) * 100);

                  return (
                    <div key={item.hour} className={index > 0 ? "pt-0" : undefined}>
                      <DuoCard.Root variant="default" size="default">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-duo-orange/10">
                            <Clock className="h-5 w-5 text-duo-orange" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-duo-text">
                                {item.hour}
                              </span>
                              <span className="text-sm font-bold text-duo-orange">
                                {item.checkins} check-ins
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-duo-orange transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </DuoCard.Root>
                    </div>
                  );
                })
              )}
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.4}>
          <DuoCard.Root
            variant="blue"
            padding="md"
            data-testid={createTestSelector(
              gymStatsScreenContract.testId,
              "equipment-usage",
            )}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Dumbbell
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-[var(--duo-fg)]">
                  Equipamentos Mais Usados
                </h2>
              </div>
            </DuoCard.Header>
            <div className="space-y-3">
              {safeEquipment.slice(0, 5).map((equipmentItem, index) => (
                <div
                  key={equipmentItem.id}
                  className={index > 0 ? "pt-0" : undefined}
                >
                  <DuoCard.Root variant="default" size="sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-duo-blue text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-duo-text">
                          {equipmentItem.name}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          {equipmentItem.usageStats.totalUses} usos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-duo-blue">
                          {equipmentItem.usageStats.avgUsageTime}min
                        </div>
                        <div className="text-xs text-duo-gray-dark">média</div>
                      </div>
                    </div>
                  </DuoCard.Root>
                </div>
              ))}
            </div>
          </DuoCard.Root>
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
