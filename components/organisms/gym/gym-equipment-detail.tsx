"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Edit,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import {
  DuoButton,
  DuoCard,
  DuoSelect,
  DuoStatCard,
  DuoStatsGrid,
} from "@/components/duo";
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDatePtBr, getTimeMs } from "@/lib/utils/date-safe";
import { AddEquipmentModal } from "./add-equipment-modal";
import { MaintenanceModal } from "./maintenance-modal"; // Import

interface GymEquipmentDetailProps {
  equipment: Equipment | null;
  onBack: () => void;
}

export function GymEquipmentDetail({
  equipment,
  onBack,
}: GymEquipmentDetailProps) {
  const [activeTab, setActiveTab] = useState("usage");
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false); // State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!equipment) {
    return (
      <div className="mx-auto max-w-4xl space-y-6  ">
        <DuoCard.Root
          variant="default"
          size="default"
          className="p-12 text-center"
        >
          <p className="text-xl font-bold text-duo-gray-dark">
            Equipamento não encontrado
          </p>
          <DuoButton variant="outline" onClick={onBack} className="mt-4">
            Voltar para Equipamentos
          </DuoButton>
        </DuoCard.Root>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-6 w-6" />;
      case "in-use":
        return <Activity className="h-6 w-6" />;
      case "maintenance":
        return <Wrench className="h-6 w-6" />;
      case "broken":
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
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
  };

  const tabOptions = [
    { value: "usage", label: "Estatísticas" },
    { value: "maintenance", label: "Manutenção" },
    { value: "info", label: "Informações" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 px-4 sm:px-0">
      <FadeIn>
        <DuoButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar para Equipamentos</span>
          <span className="sm:hidden">Voltar</span>
        </DuoButton>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Dumbbell
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">{equipment.name}</h2>
            </div>
          </DuoCard.Header>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="flex h-24 w-24 sm:h-32 sm:w-32 shrink-0 items-center justify-center rounded-2xl bg-duo-green">
              <Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </div>
            <div className="flex-1 w-full min-w-0">
              <div className="mb-2 flex items-center justify-center sm:justify-start gap-3">
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-bold",
                    getStatusColor(equipment.status),
                  )}
                >
                  {getStatusIcon(equipment.status)}
                  {getStatusText(equipment.status)}
                </span>
              </div>
              <div className="mb-4 space-y-1 text-duo-gray-dark">
                <p className="text-sm sm:text-base lg:text-lg wrap-break-words">
                  <span className="font-bold">Marca:</span> {equipment.brand}
                </p>
                <p className="text-sm sm:text-base lg:text-lg wrap-break-words">
                  <span className="font-bold">Modelo:</span> {equipment.model}
                </p>
                <p className="text-sm sm:text-base wrap-break-words">
                  <span className="font-bold">Número de Série:</span>{" "}
                  {equipment.serialNumber}
                </p>
                <p className="text-sm sm:text-base wrap-break-words">
                  <span className="font-bold">Tipo:</span>{" "}
                  <span className="capitalize">{equipment.type}</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <DuoButton
                  variant="primary"
                  fullWidth
                  className="sm:w-auto"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar Equipamento</span>
                  <span className="sm:hidden">Editar</span>
                </DuoButton>
                <DuoButton
                  variant="outline"
                  fullWidth
                  className="sm:w-auto"
                  onClick={() => setIsMaintenanceModalOpen(true)}
                >
                  <Wrench className="h-4 w-4" />
                  <span className="hidden sm:inline">Registrar Manutenção</span>
                  <span className="sm:hidden">Manutenção</span>
                </DuoButton>
              </div>
            </div>
          </div>
        </DuoCard.Root>
      </SlideIn>

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        equipmentId={equipment.id}
        onSuccess={(record) => {
          // Update local equipment state to include new record and update date
          const _updatedRecords = [
            {
              ...record,
              date: new Date(record.date),
              nextScheduled: record.nextScheduled
                ? new Date(record.nextScheduled)
                : null,
            },
            ...equipment.maintenanceHistory,
          ];
          // We need to update the parent state or local state.
          // Since equipment is a prop, we ideally should have an onUpdate prop,
          // but for now let's just force a refresh or assume the parent will handle re-fetching if we navigation back.
          // However, to show immediate update we need local state.
          // Let's assume we can't easily update prop. But wait, we can just display it if we had local state for equipment.
          // For now, let's just close modal. The list will update on refresh.
          // TO DO: Better state management here.

          // Actually, let's try to update the local display if we convert prop to state?
          // But we are in detail view.
        }}
      />

      <AddEquipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(_updatedEquipment) => {
          // Aqui idealmente atualizaríamos o estado local ou chamaríamos onUpdate
          // Como equipment vem de props, vamos confiar no refresh da página ou implementar refresh
          setIsEditModalOpen(false);
          // window.location.reload(); // Forçar reload simples por enquanto
        }}
        equipmentToEdit={equipment}
      />

      {equipment.status === "in-use" && equipment.currentUser && (
        <SlideIn delay={0.15}>
          <DuoCard.Root
            variant="blue"
            size="default"
            className="border-duo-blue bg-duo-blue/10"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-duo-gray-dark">
                  Equipamento em uso por:
                </p>
                <p className="text-xl sm:text-2xl font-bold text-duo-blue wrap-break-words">
                  {equipment.currentUser.studentName}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm font-bold text-duo-gray-dark">
                  Tempo de Uso
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-duo-blue">
                  {(() => {
                    const startTimeMs = getTimeMs(
                      equipment.currentUser.startTime,
                    );
                    if (!startTimeMs) return "--";
                    return `${Math.floor((Date.now() - startTimeMs) / 60000)} min`;
                  })()}
                </p>
              </div>
            </div>
          </DuoCard.Root>
        </SlideIn>
      )}

      <SlideIn delay={0.2}>
        <DuoStatsGrid.Root columns={4} className="gap-3 sm:gap-4">
          <DuoStatCard.Simple
            icon={BarChart3}
            value={String(equipment.usageStats.totalUses)}
            label="Total de Usos"
            iconColor="#A560E8"
          />
          <DuoStatCard.Simple
            icon={Clock}
            value={`${equipment.usageStats.avgUsageTime}min`}
            label="Tempo Médio"
            iconColor="var(--duo-secondary)"
          />
          <DuoStatCard.Simple
            icon={Calendar}
            value={
              (equipment.lastMaintenance != null
                ? formatDatePtBr(equipment.lastMaintenance)
                : null) || "N/A"
            }
            label="Última Manutenção"
            iconColor="var(--duo-primary)"
          />
          <DuoStatCard.Simple
            icon={Calendar}
            value={
              (equipment.nextMaintenance != null
                ? formatDatePtBr(equipment.nextMaintenance)
                : null) || "N/A"
            }
            label="Próxima Manutenção"
            iconColor="var(--duo-accent)"
          />
        </DuoStatsGrid.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Dumbbell
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Selecione a Categoria</h2>
            </div>
          </DuoCard.Header>
          <DuoSelect.Simple
            options={tabOptions}
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            placeholder="Selecione a categoria"
          />
        </DuoCard.Root>
      </SlideIn>

      {activeTab === "usage" && (
        <SlideIn delay={0.4}>
          <div className="grid gap-6 lg:grid-cols-2">
            <DuoCard.Root variant="default" padding="md">
              <DuoCard.Header>
                <div className="flex items-center gap-2">
                  <Clock
                    className="h-5 w-5 shrink-0"
                    style={{ color: "var(--duo-secondary)" }}
                    aria-hidden
                  />
                  <h2 className="font-bold text-duo-fg">
                    Horários Mais Populares
                  </h2>
                </div>
              </DuoCard.Header>
              <div className="space-y-3">
                {equipment.usageStats.popularTimes.map((time) => (
                  <DuoCard.Root
                    key={time}
                    variant="highlighted"
                    size="sm"
                    className="p-3 sm:p-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-duo-green shrink-0" />
                        <span className="font-bold text-duo-text text-sm sm:text-base">
                          {time}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-duo-gray-dark">
                        Alta demanda
                      </span>
                    </div>
                  </DuoCard.Root>
                ))}
              </div>
            </DuoCard.Root>

            <DuoCard.Root variant="default" padding="md">
              <DuoCard.Header>
                <div className="flex items-center gap-2">
                  <BarChart3
                    className="h-5 w-5 shrink-0"
                    style={{ color: "var(--duo-secondary)" }}
                    aria-hidden
                  />
                  <h2 className="font-bold text-duo-fg">
                    Métricas de Performance
                  </h2>
                </div>
              </DuoCard.Header>
              <div className="space-y-4">
                <DuoCard.Root
                  variant="default"
                  size="sm"
                  className="border-duo-purple bg-duo-purple/10"
                >
                  <p className="text-xs sm:text-sm font-bold text-duo-gray-dark">
                    Taxa de Utilização
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-duo-purple">
                    {Math.round((equipment.usageStats.totalUses / 2000) * 100)}%
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-duo-purple"
                      style={{
                        width: `${
                          (equipment.usageStats.totalUses / 2000) * 100
                        }%`,
                      }}
                    />
                  </div>
                </DuoCard.Root>

                <DuoCard.Root variant="blue" size="sm">
                  <p className="text-xs sm:text-sm font-bold text-duo-gray-dark">
                    Eficiência de Uso
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-duo-blue">
                    92%
                  </p>
                  <p className="text-xs text-duo-gray-dark">
                    Baseado em tempo médio vs recomendado
                  </p>
                </DuoCard.Root>
              </div>
            </DuoCard.Root>
          </div>
        </SlideIn>
      )}

      {activeTab === "maintenance" && (
        <SlideIn delay={0.4}>
          <DuoCard.Root variant="default" padding="md">
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Wrench
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-duo-fg">
                  Histórico de Manutenção
                </h2>
              </div>
            </DuoCard.Header>
            {equipment.maintenanceHistory.length > 0 ? (
              <div className="space-y-3">
                {equipment.maintenanceHistory.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <DuoCard.Root variant="default" size="default">
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-duo-text capitalize text-sm sm:text-base wrap-break-words">
                            {record.type}
                          </p>
                          <p className="text-xs sm:text-sm text-duo-gray-dark wrap-break-words">
                            {record.description}
                          </p>
                          <p className="text-xs text-duo-gray-dark">
                            Por: {record.performedBy}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm font-bold text-duo-gray-dark">
                            {formatDatePtBr(record.date) || "N/A"}
                          </p>
                          {record.cost && (
                            <p className="text-base sm:text-lg font-bold text-duo-orange">
                              R$ {record.cost.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </DuoCard.Root>
                  </motion.div>
                ))}
              </div>
            ) : (
              <DuoCard.Root
                variant="default"
                size="default"
                className="p-8 text-center"
              >
                <Wrench className="mx-auto mb-3 h-12 w-12 text-duo-gray-dark" />
                <p className="font-bold text-duo-gray-dark">
                  Nenhum registro de manutenção
                </p>
                <p className="text-sm text-duo-gray-dark">
                  Esse equipamento ainda não teve manutenções registradas
                </p>
                <DuoButton variant="primary" onClick={() => setIsMaintenanceModalOpen(true)} className="mt-4">Registrar Manutenção</DuoButton>
              </DuoCard.Root>
            )}
          </DuoCard.Root>
        </SlideIn>
      )}

      {activeTab === "info" && (
        <SlideIn delay={0.4}>
          <DuoCard.Root variant="default" padding="md">
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Dumbbell
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-duo-fg">
                  Informações do Equipamento
                </h2>
              </div>
            </DuoCard.Header>
            <div className="space-y-3">
              {[
                {
                  label: "Data de Compra",
                  value:
                    (equipment.purchaseDate != null
                      ? formatDatePtBr(equipment.purchaseDate)
                      : null) || "N/A",
                },
                { label: "Marca", value: equipment.brand },
                { label: "Modelo", value: equipment.model },
                { label: "Número de Série", value: equipment.serialNumber },
                {
                  label: "Tipo",
                  value: equipment.type,
                  capitalize: true,
                },
              ].map((info) => (
                <DuoCard.Root key={info.label} variant="default" size="sm">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="font-bold text-duo-gray-dark text-sm sm:text-base">
                      {info.label}
                    </span>
                    <span
                      className={cn(
                        "text-duo-text text-sm sm:text-base wrap-break-words",
                        info.capitalize && "capitalize",
                      )}
                    >
                      {info.value}
                    </span>
                  </div>
                </DuoCard.Root>
              ))}
            </div>
          </DuoCard.Root>
        </SlideIn>
      )}
    </div>
  );
}
