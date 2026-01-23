"use client";

import type { Equipment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import Link from "next/link";
import { useState } from "react";
import { RelativeTime } from "@/components/molecules/relative-time";

interface GymEquipmentPageProps {
  equipment: Equipment[];
}

export default function GymEquipmentPage({ equipment }: GymEquipmentPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "in-use" | "maintenance" | "broken"
  >("all");

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
        return "bg-[#58CC02] text-white";
      case "in-use":
        return "bg-[#1CB0F6] text-white";
      case "maintenance":
        return "bg-[#FF9600] text-white";
      case "broken":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-300 text-gray-700";
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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 md:text-4xl">
            Gestão de Equipamentos
          </h1>
          <p className="text-sm text-gray-600 md:text-lg">
            {filteredEquipment.length} equipamento
            {filteredEquipment.length !== 1 ? "s" : ""} encontrado
            {filteredEquipment.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="h-12 gap-2 bg-[#58CC02] px-6 text-base font-bold hover:bg-[#47A302]">
          <Plus className="h-5 w-5" />
          Novo Equipamento
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-gray-300 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-6 w-6 text-gray-600 md:h-8 md:w-8" />
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Total
              </p>
              <p className="text-2xl font-black text-gray-900 md:text-3xl">
                {statsOverview.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-[#58CC02] bg-linear-to-br from-[#58CC02]/10 to-white p-4 md:p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[#58CC02] md:h-8 md:w-8" />
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Disponíveis
              </p>
              <p className="text-2xl font-black text-[#58CC02] md:text-3xl">
                {statsOverview.available}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-[#1CB0F6] bg-linear-to-br from-[#1CB0F6]/10 to-white p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-[#1CB0F6] md:h-8 md:w-8" />
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Em Uso
              </p>
              <p className="text-2xl font-black text-[#1CB0F6] md:text-3xl">
                {statsOverview.inUse}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-[#FF9600] bg-linear-to-br from-[#FF9600]/10 to-white p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-[#FF9600] md:h-8 md:w-8" />
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Manutenção
              </p>
              <p className="text-2xl font-black text-[#FF9600] md:text-3xl">
                {statsOverview.maintenance}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6 border-2 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="h-12 flex-1 font-bold md:flex-initial"
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "available" ? "default" : "outline"}
              onClick={() => setStatusFilter("available")}
              className="h-12 flex-1 font-bold md:flex-initial"
              size="sm"
            >
              Disponíveis
            </Button>
            <Button
              variant={statusFilter === "in-use" ? "default" : "outline"}
              onClick={() => setStatusFilter("in-use")}
              className="h-12 flex-1 font-bold md:flex-initial"
              size="sm"
            >
              Em Uso
            </Button>
            <Button
              variant={statusFilter === "maintenance" ? "default" : "outline"}
              onClick={() => setStatusFilter("maintenance")}
              className="h-12 flex-1 font-bold md:flex-initial"
              size="sm"
            >
              Manutenção
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipment.map((equipment) => (
          <Link key={equipment.id} href={`/gym/equipment/${equipment.id}`}>
            <Card className="group cursor-pointer border-2 p-6 transition-all hover:border-[#58CC02] hover:shadow-lg">
              <div className="mb-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="flex-1 text-xl font-bold text-gray-900 group-hover:text-[#58CC02]">
                    {equipment.name}
                  </h3>
                  <span
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(
                      equipment.status
                    )}`}
                  >
                    {getStatusIcon(equipment.status)}
                    {getStatusText(equipment.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {equipment.brand} - {equipment.model}
                </p>
                <p className="text-xs text-gray-500">
                  SN: {equipment.serialNumber}
                </p>
              </div>

              {equipment.status === "in-use" && equipment.currentUser && (
                <div className="mb-4 rounded-xl border-2 border-[#1CB0F6] bg-[#1CB0F6]/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-600">
                        Usuário Atual
                      </p>
                      <p className="font-bold text-gray-900">
                        {equipment.currentUser.studentName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Clock className="mb-1 inline h-4 w-4 text-[#1CB0F6]" />
                      <p className="text-xs font-bold text-[#1CB0F6]">
                        {equipment.currentUser && (
                          <RelativeTime
                            timestamp={equipment.currentUser.startTime}
                          />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border-2 p-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#CE82FF]" />
                    <span className="font-bold text-gray-700">
                      Total de Usos
                    </span>
                  </div>
                  <span className="text-xl font-black text-[#CE82FF]">
                    {equipment.usageStats.totalUses}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border-2 p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#1CB0F6]" />
                    <span className="font-bold text-gray-700">Tempo Médio</span>
                  </div>
                  <span className="text-xl font-black text-[#1CB0F6]">
                    {equipment.usageStats.avgUsageTime}min
                  </span>
                </div>
              </div>

              {equipment.nextMaintenance && (
                <div className="mt-4 rounded-xl bg-gray-100 p-3">
                  <p className="text-xs font-bold text-gray-600">
                    Próxima Manutenção
                  </p>
                  <p className="font-bold text-gray-900">
                    {equipment.nextMaintenance.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card className="border-2 p-12 text-center">
          <p className="text-xl font-bold text-gray-500">
            Nenhum equipamento encontrado
          </p>
          <p className="text-gray-400">Tente ajustar os filtros de busca</p>
        </Card>
      )}
    </div>
  );
}
