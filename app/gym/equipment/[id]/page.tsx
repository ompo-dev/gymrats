"use client"

import { mockEquipment } from "@/lib/gym-mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const equipment = mockEquipment.find((e) => e.id === id)

  if (!equipment) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
          <Card className="border-2 p-12 text-center">
            <p className="text-xl font-bold text-gray-500">Equipamento não encontrado</p>
            <Link href="/gym/equipment">
              <Button className="mt-4">Voltar para Equipamentos</Button>
            </Link>
          </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-[#58CC02] text-white"
      case "in-use":
        return "bg-[#1CB0F6] text-white"
      case "maintenance":
        return "bg-[#FF9600] text-white"
      case "broken":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-300 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-6 w-6" />
      case "in-use":
        return <Activity className="h-6 w-6" />
      case "maintenance":
        return <Wrench className="h-6 w-6" />
      case "broken":
        return <AlertTriangle className="h-6 w-6" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível"
      case "in-use":
        return "Em Uso"
      case "maintenance":
        return "Manutenção"
      case "broken":
        return "Quebrado"
      default:
        return status
    }
  }

  return (
    <div className="p-8">
        {/* Back Button */}
        <Link href="/gym/equipment">
          <Button variant="ghost" className="mb-4 gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Equipamentos
          </Button>
        </Link>

        {/* Equipment Header */}
        <Card className="mb-6 border-2 p-8">
          <div className="flex items-start gap-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-[#58CC02] to-[#47A302]">
              <Dumbbell className="h-16 w-16 text-white" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-4xl font-black text-gray-900">{equipment.name}</h1>
                <span
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold ${getStatusColor(equipment.status)}`}
                >
                  {getStatusIcon(equipment.status)}
                  {getStatusText(equipment.status)}
                </span>
              </div>
              <div className="mb-4 space-y-1 text-gray-600">
                <p className="text-lg">
                  <span className="font-bold">Marca:</span> {equipment.brand}
                </p>
                <p className="text-lg">
                  <span className="font-bold">Modelo:</span> {equipment.model}
                </p>
                <p>
                  <span className="font-bold">Número de Série:</span> {equipment.serialNumber}
                </p>
                <p>
                  <span className="font-bold">Tipo:</span> <span className="capitalize">{equipment.type}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="gap-2 bg-[#58CC02] hover:bg-[#47A302]">
                  <Edit className="h-4 w-4" />
                  Editar Equipamento
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Wrench className="h-4 w-4" />
                  Agendar Manutenção
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <QrCode className="h-4 w-4" />
                  Gerar QR Code
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Current User Alert (if in use) */}
        {equipment.status === "in-use" && equipment.currentUser && (
          <Card className="mb-6 border-2 border-[#1CB0F6] bg-gradient-to-r from-[#1CB0F6]/10 to-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600">Equipamento em uso por:</p>
                <p className="text-2xl font-black text-[#1CB0F6]">{equipment.currentUser.studentName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-600">Tempo de Uso</p>
                <p className="text-3xl font-black text-[#1CB0F6]">
                  {Math.floor((Date.now() - equipment.currentUser.startTime.getTime()) / 60000)} min
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-2 border-[#CE82FF] bg-gradient-to-br from-[#CE82FF]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-[#CE82FF]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Total de Usos</p>
                <p className="text-3xl font-black text-[#CE82FF]">{equipment.usageStats.totalUses}</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#1CB0F6] bg-gradient-to-br from-[#1CB0F6]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-[#1CB0F6]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Tempo Médio</p>
                <p className="text-3xl font-black text-[#1CB0F6]">{equipment.usageStats.avgUsageTime}min</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#58CC02] bg-gradient-to-br from-[#58CC02]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-[#58CC02]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Última Manutenção</p>
                <p className="text-lg font-black text-[#58CC02]">
                  {equipment.lastMaintenance?.toLocaleDateString("pt-BR") || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#FF9600] bg-gradient-to-br from-[#FF9600]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-[#FF9600]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Próxima Manutenção</p>
                <p className="text-lg font-black text-[#FF9600]">
                  {equipment.nextMaintenance?.toLocaleDateString("pt-BR") || "N/A"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="usage">Estatísticas de Uso</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-2 p-6">
                <h2 className="mb-4 text-xl font-bold">Horários Mais Populares</h2>
                <div className="space-y-3">
                  {equipment.usageStats.popularTimes.map((time, index) => (
                    <div key={index} className="rounded-xl border-2 border-[#58CC02] bg-[#58CC02]/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-[#58CC02]" />
                          <span className="font-bold text-gray-900">{time}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-600">Alta demanda</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-2 p-6">
                <h2 className="mb-4 text-xl font-bold">Métricas de Performance</h2>
                <div className="space-y-4">
                  <div className="rounded-xl bg-gradient-to-r from-[#CE82FF]/10 to-white p-4">
                    <p className="text-sm font-bold text-gray-600">Taxa de Utilização</p>
                    <p className="text-3xl font-black text-[#CE82FF]">
                      {Math.round((equipment.usageStats.totalUses / 2000) * 100)}%
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-[#CE82FF]"
                        style={{ width: `${(equipment.usageStats.totalUses / 2000) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-[#1CB0F6]/10 to-white p-4">
                    <p className="text-sm font-bold text-gray-600">Eficiência de Uso</p>
                    <p className="text-3xl font-black text-[#1CB0F6]">92%</p>
                    <p className="text-xs text-gray-600">Baseado em tempo médio vs recomendado</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card className="border-2 p-6">
              <h2 className="mb-4 text-xl font-bold">Histórico de Manutenção</h2>
              {equipment.maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {equipment.maintenanceHistory.map((record) => (
                    <div key={record.id} className="rounded-xl border-2 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900 capitalize">{record.type}</p>
                          <p className="text-sm text-gray-600">{record.description}</p>
                          <p className="text-xs text-gray-500">Por: {record.performedBy}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-600">{record.date.toLocaleDateString("pt-BR")}</p>
                          {record.cost && (
                            <p className="text-lg font-black text-[#FF9600]">R$ {record.cost.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-8 text-center">
                  <Wrench className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="font-bold text-gray-500">Nenhum registro de manutenção</p>
                  <p className="text-sm text-gray-400">Esse equipamento ainda não teve manutenções registradas</p>
                  <Button className="mt-4">Registrar Manutenção</Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card className="border-2 p-6">
              <h2 className="mb-4 text-xl font-bold">Informações do Equipamento</h2>
              <div className="space-y-3">
                <div className="flex justify-between rounded-xl border-2 p-4">
                  <span className="font-bold text-gray-600">Data de Compra</span>
                  <span className="text-gray-900">{equipment.purchaseDate?.toLocaleDateString("pt-BR") || "N/A"}</span>
                </div>
                <div className="flex justify-between rounded-xl border-2 p-4">
                  <span className="font-bold text-gray-600">Marca</span>
                  <span className="text-gray-900">{equipment.brand}</span>
                </div>
                <div className="flex justify-between rounded-xl border-2 p-4">
                  <span className="font-bold text-gray-600">Modelo</span>
                  <span className="text-gray-900">{equipment.model}</span>
                </div>
                <div className="flex justify-between rounded-xl border-2 p-4">
                  <span className="font-bold text-gray-600">Número de Série</span>
                  <span className="text-gray-900">{equipment.serialNumber}</span>
                </div>
                <div className="flex justify-between rounded-xl border-2 p-4">
                  <span className="font-bold text-gray-600">Tipo</span>
                  <span className="text-gray-900 capitalize">{equipment.type}</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
