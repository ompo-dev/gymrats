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
	QrCode,
	Wrench,
} from "lucide-react";
import Link from "next/link";
import { RelativeTime } from "@/components/molecules/relative-time";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Equipment } from "@/lib/types";

interface EquipmentDetailPageProps {
	equipment: Equipment | null;
}

export default function EquipmentDetailPage({
	equipment,
}: EquipmentDetailPageProps) {
	if (!equipment) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<Card className="border-2 p-12 text-center">
					<p className="text-xl font-bold text-gray-500">
						Equipamento não encontrado
					</p>
					<Link href="/gym/equipment">
						<Button className="mt-4">Voltar para Equipamentos</Button>
					</Link>
				</Card>
			</div>
		);
	}

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

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<Link href="/gym/equipment">
				<Button variant="ghost" className="mb-4 gap-2 font-bold">
					<ArrowLeft className="h-4 w-4" />
					<span className="hidden sm:inline">Voltar para Equipamentos</span>
					<span className="sm:hidden">Voltar</span>
				</Button>
			</Link>

			<Card className="mb-6 border-2 p-4 sm:p-6 lg:p-8">
				<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
					<div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-2xl bg-linear-to-br from-[#58CC02] to-[#47A302] shrink-0">
						<Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
					</div>
					<div className="flex-1 w-full min-w-0">
						<div className="mb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 wrap-break-words">
								{equipment.name}
							</h1>
							<span
								className={`flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-bold shrink-0 ${getStatusColor(
									equipment.status,
								)}`}
							>
								{getStatusIcon(equipment.status)}
								{getStatusText(equipment.status)}
							</span>
						</div>
						<div className="mb-4 space-y-1 text-gray-600">
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
							<Button className="gap-2 bg-[#58CC02] hover:bg-[#47A302] w-full sm:w-auto">
								<Edit className="h-4 w-4" />
								<span className="hidden sm:inline">Editar Equipamento</span>
								<span className="sm:hidden">Editar</span>
							</Button>
							<Button
								variant="outline"
								className="gap-2 bg-transparent w-full sm:w-auto"
							>
								<Wrench className="h-4 w-4" />
								<span className="hidden sm:inline">Agendar Manutenção</span>
								<span className="sm:hidden">Manutenção</span>
							</Button>
							<Button
								variant="outline"
								className="gap-2 bg-transparent w-full sm:w-auto"
							>
								<QrCode className="h-4 w-4" />
								<span className="hidden sm:inline">Gerar QR Code</span>
								<span className="sm:hidden">QR Code</span>
							</Button>
						</div>
					</div>
				</div>
			</Card>

			{equipment.status === "in-use" && equipment.currentUser && (
				<Card className="mb-6 border-2 border-[#1CB0F6] bg-linear-to-r from-[#1CB0F6]/10 to-white p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div className="flex-1 min-w-0">
							<p className="text-xs sm:text-sm font-bold text-gray-600">
								Equipamento em uso por:
							</p>
							<p className="text-xl sm:text-2xl font-black text-[#1CB0F6] wrap-break-words">
								{equipment.currentUser.studentName}
							</p>
						</div>
						<div className="text-left sm:text-right">
							<p className="text-xs sm:text-sm font-bold text-gray-600">
								Tempo de Uso
							</p>
							<p className="text-2xl sm:text-3xl font-black text-[#1CB0F6]">
								{equipment.currentUser && (
									<RelativeTime timestamp={equipment.currentUser.startTime} />
								)}
							</p>
						</div>
					</div>
				</Card>
			)}

			<div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<Card className="border-2 border-[#CE82FF] bg-linear-to-br from-[#CE82FF]/10 to-white p-4 sm:p-6">
					<div className="flex items-center gap-2 sm:gap-3">
						<BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-[#CE82FF] shrink-0" />
						<div className="min-w-0">
							<p className="text-xs sm:text-sm font-bold text-gray-600">
								Total de Usos
							</p>
							<p className="text-2xl sm:text-3xl font-black text-[#CE82FF]">
								{equipment.usageStats.totalUses}
							</p>
						</div>
					</div>
				</Card>

				<Card className="border-2 border-[#1CB0F6] bg-linear-to-br from-[#1CB0F6]/10 to-white p-4 sm:p-6">
					<div className="flex items-center gap-2 sm:gap-3">
						<Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[#1CB0F6] shrink-0" />
						<div className="min-w-0">
							<p className="text-xs sm:text-sm font-bold text-gray-600">
								Tempo Médio
							</p>
							<p className="text-2xl sm:text-3xl font-black text-[#1CB0F6]">
								{equipment.usageStats.avgUsageTime}min
							</p>
						</div>
					</div>
				</Card>

				<Card className="border-2 border-[#58CC02] bg-linear-to-br from-[#58CC02]/10 to-white p-4 sm:p-6">
					<div className="flex items-center gap-2 sm:gap-3">
						<Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-[#58CC02] shrink-0" />
						<div className="min-w-0">
							<p className="text-xs sm:text-sm font-bold text-gray-600">
								Última Manutenção
							</p>
							<p className="text-base sm:text-lg font-black text-[#58CC02]">
								{equipment.lastMaintenance?.toLocaleDateString("pt-BR") ||
									"N/A"}
							</p>
						</div>
					</div>
				</Card>

				<Card className="border-2 border-[#FF9600] bg-linear-to-br from-[#FF9600]/10 to-white p-4 sm:p-6">
					<div className="flex items-center gap-2 sm:gap-3">
						<Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-[#FF9600] shrink-0" />
						<div className="min-w-0">
							<p className="text-xs sm:text-sm font-bold text-gray-600">
								Próxima Manutenção
							</p>
							<p className="text-base sm:text-lg font-black text-[#FF9600]">
								{equipment.nextMaintenance?.toLocaleDateString("pt-BR") ||
									"N/A"}
							</p>
						</div>
					</div>
				</Card>
			</div>

			<Tabs defaultValue="usage" className="space-y-4 sm:space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="usage" className="text-xs sm:text-sm">
						<span className="hidden sm:inline">Estatísticas de Uso</span>
						<span className="sm:hidden">Uso</span>
					</TabsTrigger>
					<TabsTrigger value="maintenance" className="text-xs sm:text-sm">
						Manutenção
					</TabsTrigger>
					<TabsTrigger value="info" className="text-xs sm:text-sm">
						Informações
					</TabsTrigger>
				</TabsList>

				<TabsContent value="usage">
					<div className="grid gap-6 lg:grid-cols-2">
						<Card className="border-2 p-6">
							<h2 className="mb-4 text-xl font-bold">
								Horários Mais Populares
							</h2>
							<div className="space-y-3">
								{equipment.usageStats.popularTimes.map((time) => (
									<div
										key={time}
										className="rounded-xl border-2 border-[#58CC02] bg-[#58CC02]/10 p-4"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Clock className="h-5 w-5 text-[#58CC02]" />
												<span className="font-bold text-gray-900">{time}</span>
											</div>
											<span className="text-sm font-bold text-gray-600">
												Alta demanda
											</span>
										</div>
									</div>
								))}
							</div>
						</Card>

						<Card className="border-2 p-6">
							<h2 className="mb-4 text-xl font-bold">
								Métricas de Performance
							</h2>
							<div className="space-y-4">
								<div className="rounded-xl bg-linear-to-r from-[#CE82FF]/10 to-white p-4">
									<p className="text-sm font-bold text-gray-600">
										Taxa de Utilização
									</p>
									<p className="text-3xl font-black text-[#CE82FF]">
										{Math.round((equipment.usageStats.totalUses / 2000) * 100)}%
									</p>
									<div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
										<div
											className="h-full bg-[#CE82FF]"
											style={{
												width: `${
													(equipment.usageStats.totalUses / 2000) * 100
												}%`,
											}}
										/>
									</div>
								</div>

								<div className="rounded-xl bg-linear-to-r from-[#1CB0F6]/10 to-white p-4">
									<p className="text-sm font-bold text-gray-600">
										Eficiência de Uso
									</p>
									<p className="text-3xl font-black text-[#1CB0F6]">92%</p>
									<p className="text-xs text-gray-600">
										Baseado em tempo médio vs recomendado
									</p>
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
									<div
										key={record.id}
										className="rounded-xl border-2 p-3 sm:p-4"
									>
										<div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
											<div className="flex-1 min-w-0">
												<p className="font-bold text-gray-900 capitalize text-sm sm:text-base wrap-break-words">
													{record.type}
												</p>
												<p className="text-xs sm:text-sm text-gray-600 wrap-break-words">
													{record.description}
												</p>
												<p className="text-xs text-gray-500">
													Por: {record.performedBy}
												</p>
											</div>
											<div className="text-left sm:text-right">
												<p className="text-xs sm:text-sm font-bold text-gray-600">
													{record.date.toLocaleDateString("pt-BR")}
												</p>
												{record.cost && (
													<p className="text-base sm:text-lg font-black text-[#FF9600]">
														R$ {record.cost.toFixed(2)}
													</p>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="rounded-xl bg-gray-50 p-8 text-center">
								<Wrench className="mx-auto mb-3 h-12 w-12 text-gray-400" />
								<p className="font-bold text-gray-500">
									Nenhum registro de manutenção
								</p>
								<p className="text-sm text-gray-400">
									Esse equipamento ainda não teve manutenções registradas
								</p>
								<Button className="mt-4">Registrar Manutenção</Button>
							</div>
						)}
					</Card>
				</TabsContent>

				<TabsContent value="info">
					<Card className="border-2 p-6">
						<h2 className="mb-4 text-xl font-bold">
							Informações do Equipamento
						</h2>
						<div className="space-y-3">
							<div className="flex flex-col sm:flex-row justify-between gap-2 rounded-xl border-2 p-3 sm:p-4">
								<span className="font-bold text-gray-600 text-sm sm:text-base">
									Data de Compra
								</span>
								<span className="text-gray-900 text-sm sm:text-base wrap-break-words">
									{equipment.purchaseDate?.toLocaleDateString("pt-BR") || "N/A"}
								</span>
							</div>
							<div className="flex flex-col sm:flex-row justify-between gap-2 rounded-xl border-2 p-3 sm:p-4">
								<span className="font-bold text-gray-600 text-sm sm:text-base">
									Marca
								</span>
								<span className="text-gray-900 text-sm sm:text-base wrap-break-words">
									{equipment.brand}
								</span>
							</div>
							<div className="flex flex-col sm:flex-row justify-between gap-2 rounded-xl border-2 p-3 sm:p-4">
								<span className="font-bold text-gray-600 text-sm sm:text-base">
									Modelo
								</span>
								<span className="text-gray-900 text-sm sm:text-base wrap-break-words">
									{equipment.model}
								</span>
							</div>
							<div className="flex flex-col sm:flex-row justify-between gap-2 rounded-xl border-2 p-3 sm:p-4">
								<span className="font-bold text-gray-600 text-sm sm:text-base">
									Número de Série
								</span>
								<span className="text-gray-900 text-sm sm:text-base wrap-break-words">
									{equipment.serialNumber}
								</span>
							</div>
							<div className="flex flex-col sm:flex-row justify-between gap-2 rounded-xl border-2 p-3 sm:p-4">
								<span className="font-bold text-gray-600 text-sm sm:text-base">
									Tipo
								</span>
								<span className="text-gray-900 text-sm sm:text-base capitalize wrap-break-words">
									{equipment.type}
								</span>
							</div>
						</div>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
