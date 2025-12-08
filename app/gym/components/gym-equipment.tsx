"use client";

import type { Equipment } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  Dumbbell,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  BarChart3,
} from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";
import { cn } from "@/lib/utils";
import { GymEquipmentDetail } from "./gym-equipment-detail";

interface GymEquipmentPageProps {
  equipment: Equipment[];
}

export function GymEquipmentPage({ equipment }: GymEquipmentPageProps) {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("all")
  );
  const [equipmentId, setEquipmentId] = useQueryState("equipmentId");

  const filteredEquipment = equipment.filter((equipment) => {
    const matchesSearch =
      equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || equipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const statsOverview = {
    total: equipment.length,
    available: equipment.filter((e) => e.status === "available").length,
    inUse: equipment.filter((e) => e.status === "in-use").length,
    maintenance: equipment.filter((e) => e.status === "maintenance").length,
  };

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "available", label: "Disponíveis" },
    { value: "in-use", label: "Em Uso" },
    { value: "maintenance", label: "Manutenção" },
  ];

  if (equipmentId) {
    const equipmentItem = equipment.find((e) => e.id === equipmentId);
    return (
      <GymEquipmentDetail
        equipment={equipmentItem || null}
        onBack={() => setEquipmentId(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-duo-text">
              Gestão de Equipamentos
            </h1>
            <p className="text-sm text-duo-gray-dark">
              {filteredEquipment.length} equipamento
              {filteredEquipment.length !== 1 ? "s" : ""} encontrado
              {filteredEquipment.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button>
            <Plus className="h-5 w-5" />
            Novo Equipamento
          </Button>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCardLarge
            icon={Dumbbell}
            value={String(statsOverview.total)}
            label="Total"
            iconColor="duo-blue"
          />
          <StatCardLarge
            icon={CheckCircle2}
            value={String(statsOverview.available)}
            label="Disponíveis"
            iconColor="duo-green"
          />
          <StatCardLarge
            icon={Activity}
            value={String(statsOverview.inUse)}
            label="Em Uso"
            iconColor="duo-blue"
          />
          <StatCardLarge
            icon={Wrench}
            value={String(statsOverview.maintenance)}
            label="Manutenção"
            iconColor="duo-orange"
          />
        </div>
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard title="Buscar e Filtrar" icon={Search}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-duo-gray-dark" />
              <Input
                placeholder="Buscar por nome ou tipo..."
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10"
              />
            </div>
            <OptionSelector
              options={statusOptions}
              value={statusFilter || "all"}
              onChange={(value) =>
                setStatusFilter(
                  value as
                    | "all"
                    | "available"
                    | "in-use"
                    | "maintenance"
                    | "broken"
                )
              }
              layout="grid"
              columns={2}
              size="md"
              textAlign="center"
              animate={true}
            />
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipment.map((equipment, index) => (
            <motion.div
              key={equipment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <DuoCard
                variant="default"
                size="default"
                onClick={() => setEquipmentId(equipment.id)}
                className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
              >
                <div className="mb-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="flex-1 text-xl font-bold text-duo-text">
                      {equipment.name}
                    </h3>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                        getStatusColor(equipment.status)
                      )}
                    >
                      {getStatusIcon(equipment.status)}
                      {getStatusText(equipment.status)}
                    </span>
                  </div>
                  <p className="text-sm text-duo-gray-dark">
                    {equipment.brand} - {equipment.model}
                  </p>
                  <p className="text-xs text-duo-gray-dark">
                    SN: {equipment.serialNumber}
                  </p>
                </div>

                {equipment.status === "in-use" && equipment.currentUser && (
                  <DuoCard
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
                          {equipment.currentUser.studentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Clock className="mb-1 inline h-4 w-4 text-duo-blue" />
                        <p className="text-xs font-bold text-duo-blue">
                          {Math.floor(
                            (Date.now() -
                              equipment.currentUser.startTime.getTime()) /
                              60000
                          )}{" "}
                          min
                        </p>
                      </div>
                    </div>
                  </DuoCard>
                )}

                <div className="space-y-3">
                  <DuoCard variant="default" size="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-duo-purple" />
                        <span className="font-bold text-duo-text">
                          Total de Usos
                        </span>
                      </div>
                      <span className="text-xl font-bold text-duo-purple">
                        {equipment.usageStats.totalUses}
                      </span>
                    </div>
                  </DuoCard>

                  <DuoCard variant="default" size="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-duo-blue" />
                        <span className="font-bold text-duo-text">
                          Tempo Médio
                        </span>
                      </div>
                      <span className="text-xl font-bold text-duo-blue">
                        {equipment.usageStats.avgUsageTime}min
                      </span>
                    </div>
                  </DuoCard>
                </div>

                {equipment.nextMaintenance && (
                  <DuoCard
                    variant="default"
                    size="sm"
                    className="mt-4 bg-gray-100 p-3"
                  >
                    <p className="text-xs font-bold text-duo-gray-dark">
                      Próxima Manutenção
                    </p>
                    <p className="font-bold text-duo-text">
                      {equipment.nextMaintenance.toLocaleDateString("pt-BR")}
                    </p>
                  </DuoCard>
                )}
              </DuoCard>
            </motion.div>
          ))}
        </div>
      </SlideIn>

      {filteredEquipment.length === 0 && (
        <SlideIn delay={0.4}>
          <DuoCard
            variant="default"
            size="default"
            className="p-12 text-center"
          >
            <p className="text-xl font-bold text-duo-gray-dark">
              Nenhum equipamento encontrado
            </p>
            <p className="text-duo-gray-dark">
              Tente ajustar os filtros de busca
            </p>
          </DuoCard>
        </SlideIn>
      )}
    </div>
  );
}
