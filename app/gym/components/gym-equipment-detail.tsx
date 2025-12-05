"use client";

import { mockEquipment } from "@/lib/gym-mock-data";
import { Button } from "@/components/ui/button";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Dumbbell,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  BarChart3,
  Calendar,
  Edit,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface GymEquipmentDetailProps {
  equipmentId: string;
  onBack: () => void;
}

export function GymEquipmentDetail({
  equipmentId,
  onBack,
}: GymEquipmentDetailProps) {
  const equipment = mockEquipment.find((e) => e.id === equipmentId);
  const [activeTab, setActiveTab] = useState("usage");

  if (!equipment) {
    return (
      <div className="mx-auto max-w-4xl space-y-6  ">
        <DuoCard variant="default" size="default" className="p-12 text-center">
          <p className="text-xl font-bold text-duo-gray-dark">
            Equipamento não encontrado
          </p>
          <Button onClick={onBack} className="mt-4">
            Voltar para Equipamentos
          </Button>
        </DuoCard>
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
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <Button variant="ghost" onClick={onBack} className="gap-2 font-bold">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Equipamentos
        </Button>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title={equipment.name} icon={Dumbbell} variant="default">
          <div className="flex items-start gap-6">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-duo-green">
              <Dumbbell className="h-16 w-16 text-white" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold",
                    getStatusColor(equipment.status)
                  )}
                >
                  {getStatusIcon(equipment.status)}
                  {getStatusText(equipment.status)}
                </span>
              </div>
              <div className="mb-4 space-y-1 text-duo-gray-dark">
                <p className="text-lg">
                  <span className="font-bold">Marca:</span> {equipment.brand}
                </p>
                <p className="text-lg">
                  <span className="font-bold">Modelo:</span> {equipment.model}
                </p>
                <p>
                  <span className="font-bold">Número de Série:</span>{" "}
                  {equipment.serialNumber}
                </p>
                <p>
                  <span className="font-bold">Tipo:</span>{" "}
                  <span className="capitalize">{equipment.type}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button>
                  <Edit className="h-4 w-4" />
                  Editar Equipamento
                </Button>
                <Button variant="outline">
                  <Wrench className="h-4 w-4" />
                  Agendar Manutenção
                </Button>
                <Button variant="outline">
                  <QrCode className="h-4 w-4" />
                  Gerar QR Code
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      </SlideIn>

      {equipment.status === "in-use" && equipment.currentUser && (
        <SlideIn delay={0.15}>
          <DuoCard
            variant="blue"
            size="default"
            className="border-duo-blue bg-duo-blue/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-duo-gray-dark">
                  Equipamento em uso por:
                </p>
                <p className="text-2xl font-bold text-duo-blue">
                  {equipment.currentUser.studentName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-duo-gray-dark">
                  Tempo de Uso
                </p>
                <p className="text-3xl font-bold text-duo-blue">
                  {Math.floor(
                    (Date.now() - equipment.currentUser.startTime.getTime()) /
                      60000
                  )}{" "}
                  min
                </p>
              </div>
            </div>
          </DuoCard>
        </SlideIn>
      )}

      <SlideIn delay={0.2}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCardLarge
            icon={BarChart3}
            value={String(equipment.usageStats.totalUses)}
            label="Total de Usos"
            iconColor="duo-purple"
          />
          <StatCardLarge
            icon={Clock}
            value={`${equipment.usageStats.avgUsageTime}min`}
            label="Tempo Médio"
            iconColor="duo-blue"
          />
          <StatCardLarge
            icon={Calendar}
            value={
              equipment.lastMaintenance?.toLocaleDateString("pt-BR") || "N/A"
            }
            label="Última Manutenção"
            iconColor="duo-green"
          />
          <StatCardLarge
            icon={Calendar}
            value={
              equipment.nextMaintenance?.toLocaleDateString("pt-BR") || "N/A"
            }
            label="Próxima Manutenção"
            iconColor="duo-orange"
          />
        </div>
      </SlideIn>

      <SlideIn delay={0.3}>
        <SectionCard title="Selecione a Categoria" icon={Dumbbell}>
          <OptionSelector
            options={tabOptions}
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            layout="list"
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      {activeTab === "usage" && (
        <SlideIn delay={0.4}>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Horários Mais Populares" icon={Clock}>
              <div className="space-y-3">
                {equipment.usageStats.popularTimes.map((time, index) => (
                  <DuoCard
                    key={index}
                    variant="highlighted"
                    size="sm"
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-duo-green" />
                        <span className="font-bold text-duo-text">{time}</span>
                      </div>
                      <span className="text-sm font-bold text-duo-gray-dark">
                        Alta demanda
                      </span>
                    </div>
                  </DuoCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Métricas de Performance" icon={BarChart3}>
              <div className="space-y-4">
                <DuoCard
                  variant="default"
                  size="sm"
                  className="border-duo-purple bg-duo-purple/10"
                >
                  <p className="text-sm font-bold text-duo-gray-dark">
                    Taxa de Utilização
                  </p>
                  <p className="text-3xl font-bold text-duo-purple">
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
                </DuoCard>

                <DuoCard variant="blue" size="sm">
                  <p className="text-sm font-bold text-duo-gray-dark">
                    Eficiência de Uso
                  </p>
                  <p className="text-3xl font-bold text-duo-blue">92%</p>
                  <p className="text-xs text-duo-gray-dark">
                    Baseado em tempo médio vs recomendado
                  </p>
                </DuoCard>
              </div>
            </SectionCard>
          </div>
        </SlideIn>
      )}

      {activeTab === "maintenance" && (
        <SlideIn delay={0.4}>
          <SectionCard title="Histórico de Manutenção" icon={Wrench}>
            {equipment.maintenanceHistory.length > 0 ? (
              <div className="space-y-3">
                {equipment.maintenanceHistory.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <DuoCard variant="default" size="default">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-duo-text capitalize">
                            {record.type}
                          </p>
                          <p className="text-sm text-duo-gray-dark">
                            {record.description}
                          </p>
                          <p className="text-xs text-duo-gray-dark">
                            Por: {record.performedBy}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-duo-gray-dark">
                            {record.date.toLocaleDateString("pt-BR")}
                          </p>
                          {record.cost && (
                            <p className="text-lg font-bold text-duo-orange">
                              R$ {record.cost.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </DuoCard>
                  </motion.div>
                ))}
              </div>
            ) : (
              <DuoCard
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
                <Button className="mt-4">Registrar Manutenção</Button>
              </DuoCard>
            )}
          </SectionCard>
        </SlideIn>
      )}

      {activeTab === "info" && (
        <SlideIn delay={0.4}>
          <SectionCard title="Informações do Equipamento" icon={Dumbbell}>
            <div className="space-y-3">
              {[
                {
                  label: "Data de Compra",
                  value:
                    equipment.purchaseDate?.toLocaleDateString("pt-BR") ||
                    "N/A",
                },
                { label: "Marca", value: equipment.brand },
                { label: "Modelo", value: equipment.model },
                { label: "Número de Série", value: equipment.serialNumber },
                {
                  label: "Tipo",
                  value: equipment.type,
                  capitalize: true,
                },
              ].map((info, index) => (
                <DuoCard key={index} variant="default" size="sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-duo-gray-dark">
                      {info.label}
                    </span>
                    <span
                      className={cn(
                        "text-duo-text",
                        info.capitalize && "capitalize"
                      )}
                    >
                      {info.value}
                    </span>
                  </div>
                </DuoCard>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      )}
    </div>
  );
}
