"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Dumbbell,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import {
  DuoButton,
  DuoCard,
  DuoInput,
  DuoSelect,
  DuoStatCard,
  DuoStatsGrid,
} from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDatePtBr, getTimeMs } from "@/lib/utils/date-safe";

interface GymEquipmentOverview {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
}

export interface GymEquipmentScreenProps
  extends ScreenProps<{
    equipment: Equipment[];
    searchQuery: string;
    statusFilter: string;
    statsOverview: GymEquipmentOverview;
    onSearchQueryChange: (value: string) => void;
    onStatusFilterChange: (
      value: "all" | "available" | "in-use" | "maintenance" | "broken",
    ) => void;
    onOpenAddEquipment: () => void;
    onSelectEquipment: (equipmentId: string) => void;
  }> {}

export const gymEquipmentScreenContract: ViewContract = {
  componentId: "gym-equipment-screen",
  testId: "gym-equipment-screen",
};

function getStatusColor(status: string) {
  switch (status) {
    case "available":
      return "bg-duo-green text-white";
    case "in-use":
      return "bg-duo-blue text-white";
    case "maintenance":
      return "bg-duo-orange text-white";
    case "broken":
      return "bg-duo-red text-white";
    default:
      return "bg-gray-300 text-duo-gray-dark";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "available":
      return <CheckCircle2 className="h-5 w-5" />;
    case "in-use":
      return <Activity className="h-5 w-5" />;
    case "maintenance":
      return <Wrench className="h-5 w-5" />;
    case "broken":
      return <AlertTriangle className="h-5 w-5" />;
    default:
      return null;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "available":
      return "Disponível";
    case "in-use":
      return "Em Uso";
    case "maintenance":
      return "Manutenção";
    case "broken":
      return "Quebrado";
    default:
      return status;
  }
}

export function GymEquipmentScreen({
  equipment,
  searchQuery,
  statusFilter,
  statsOverview,
  onSearchQueryChange,
  onStatusFilterChange,
  onOpenAddEquipment,
  onSelectEquipment,
}: GymEquipmentScreenProps) {
  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "available", label: "Disponíveis" },
    { value: "in-use", label: "Em Uso" },
    { value: "maintenance", label: "Manutenção" },
  ];

  return (
    <ScreenShell.Root screenId={gymEquipmentScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Gestão de Equipamentos</ScreenShell.Title>
            <ScreenShell.Description>
              {equipment.length} equipamento
              {equipment.length !== 1 ? "s" : ""} encontrado
              {equipment.length !== 1 ? "s" : ""}
            </ScreenShell.Description>
          </ScreenShell.Heading>
          <ScreenShell.Actions>
            <DuoButton
              onClick={onOpenAddEquipment}
              className="flex items-center gap-2"
              data-testid={createTestSelector(
                gymEquipmentScreenContract.testId,
                "add-trigger",
              )}
            >
              <Plus className="h-5 w-5" />
              Novo Equipamento
            </DuoButton>
          </ScreenShell.Actions>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoStatsGrid.Root
            columns={4}
            className="gap-4"
            data-testid={createTestSelector(
              gymEquipmentScreenContract.testId,
              "metrics",
            )}
          >
            <DuoStatCard.Simple
              icon={Dumbbell}
              value={String(statsOverview.total)}
              label="Total"
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={CheckCircle2}
              value={String(statsOverview.available)}
              label="Disponíveis"
              iconColor="var(--duo-primary)"
            />
            <DuoStatCard.Simple
              icon={Activity}
              value={String(statsOverview.inUse)}
              label="Em Uso"
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={Wrench}
              value={String(statsOverview.maintenance)}
              label="Manutenção"
              iconColor="var(--duo-accent)"
            />
          </DuoStatsGrid.Root>
        </SlideIn>

        <SlideIn delay={0.2}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              gymEquipmentScreenContract.testId,
              "filters",
            )}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Search
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-[var(--duo-fg)]">
                  Buscar e Filtrar
                </h2>
              </div>
            </DuoCard.Header>
            <div className="space-y-4">
              <DuoInput.Simple
                placeholder="Buscar por nome ou tipo..."
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
                className="h-12"
                data-testid={createTestSelector(
                  gymEquipmentScreenContract.testId,
                  "search",
                )}
              />
              <DuoSelect.Simple
                options={statusOptions}
                value={statusFilter}
                onChange={(value) =>
                  onStatusFilterChange(
                    value as
                      | "all"
                      | "available"
                      | "in-use"
                      | "maintenance"
                      | "broken",
                  )
                }
                placeholder="Status"
                data-testid={createTestSelector(
                  gymEquipmentScreenContract.testId,
                  "status-filter",
                )}
              />
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.3}>
          <div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid={createTestSelector(
              gymEquipmentScreenContract.testId,
              "results",
            )}
          >
            {equipment.map((equipmentItem, index) => (
              <div
                key={equipmentItem.id}
                className={index > 0 ? "pt-0" : undefined}
                data-testid={createTestSelector(
                  gymEquipmentScreenContract.testId,
                  "equipment-card",
                )}
              >
                <DuoCard.Root
                  variant="default"
                  size="default"
                  onClick={() => onSelectEquipment(equipmentItem.id)}
                  className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
                >
                  <div className="mb-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="flex-1 text-xl font-bold text-duo-text">
                        {equipmentItem.name}
                      </h3>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                          getStatusColor(equipmentItem.status),
                        )}
                      >
                        {getStatusIcon(equipmentItem.status)}
                        {getStatusText(equipmentItem.status)}
                      </span>
                    </div>
                    <p className="text-sm text-duo-gray-dark">
                      {equipmentItem.brand} - {equipmentItem.model}
                    </p>
                    <p className="text-xs text-duo-gray-dark">
                      SN: {equipmentItem.serialNumber}
                    </p>
                  </div>

                  {equipmentItem.status === "in-use" &&
                  equipmentItem.currentUser ? (
                    <DuoCard.Root
                      variant="blue"
                      size="sm"
                      className="mb-4 border-duo-blue bg-duo-blue/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-duo-gray-dark">
                            Usuário Atual
                          </p>
                          <p className="font-bold text-duo-text">
                            {equipmentItem.currentUser.studentName}
                          </p>
                        </div>
                        <div className="text-right">
                          <Clock className="mb-1 inline h-4 w-4 text-duo-blue" />
                          <p className="text-xs font-bold text-duo-blue">
                            {(() => {
                              const startTimeMs = getTimeMs(
                                equipmentItem.currentUser?.startTime,
                              );
                              if (!startTimeMs) return "--";
                              return `${Math.floor((Date.now() - startTimeMs) / 60000)} min`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </DuoCard.Root>
                  ) : null}

                  <div className="space-y-3">
                    <DuoCard.Root variant="default" size="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-duo-purple" />
                          <span className="font-bold text-duo-text">
                            Total de Usos
                          </span>
                        </div>
                        <span className="text-xl font-bold text-duo-purple">
                          {equipmentItem.usageStats.totalUses}
                        </span>
                      </div>
                    </DuoCard.Root>

                    <DuoCard.Root variant="default" size="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-duo-blue" />
                          <span className="font-bold text-duo-text">
                            Tempo Médio
                          </span>
                        </div>
                        <span className="text-xl font-bold text-duo-blue">
                          {equipmentItem.usageStats.avgUsageTime}min
                        </span>
                      </div>
                    </DuoCard.Root>
                  </div>

                  {equipmentItem.nextMaintenance ? (
                    <DuoCard.Root
                      variant="default"
                      size="sm"
                      className="mt-4 bg-gray-100 p-3"
                    >
                      <p className="text-xs font-bold text-duo-gray-dark">
                        Próxima Manutenção
                      </p>
                      <p className="font-bold text-duo-text">
                        {formatDatePtBr(equipmentItem.nextMaintenance) || "N/A"}
                      </p>
                    </DuoCard.Root>
                  ) : null}
                </DuoCard.Root>
              </div>
            ))}
          </div>
        </SlideIn>

        {equipment.length === 0 ? (
          <SlideIn delay={0.4}>
            <DuoCard.Root
              variant="default"
              size="default"
              className="p-12 text-center"
              data-testid={createTestSelector(
                gymEquipmentScreenContract.testId,
                "empty",
              )}
            >
              <p className="text-xl font-bold text-duo-gray-dark">
                Nenhum equipamento encontrado
              </p>
              <p className="text-duo-gray-dark">
                Tente ajustar os filtros de busca
              </p>
            </DuoCard.Root>
          </SlideIn>
        ) : null}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
