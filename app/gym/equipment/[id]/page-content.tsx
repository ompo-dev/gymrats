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
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { RelativeTime } from "@/components/molecules/relative-time";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import {
	DuoStatCard,
	DuoStatsGrid,
} from "@/components/duo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EquipmentDetailPageProps {
	equipment: Equipment | null;
}

export default function EquipmentDetailPage({
	equipment,
}: EquipmentDetailPageProps) {
	if (!equipment) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<FadeIn>
					<DuoCard.Root variant="default" padding="md" className="text-center">
						<DuoCard.Header>
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
								<h2 className="font-bold text-[var(--duo-fg)]">Equipamento não encontrado</h2>
							</div>
						</DuoCard.Header>
						<p className="mb-4 text-xl font-bold text-duo-gray-dark">
							Equipamento não encontrado
						</p>
						<Link href="/gym/equipment">
							<DuoButton className="mt-4">Voltar para Equipamentos</DuoButton>
						</Link>
					</DuoCard.Root>
				</FadeIn>
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
				return "bg-duo-gray text-duo-gray-dark";
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
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<FadeIn>
				<Link href="/gym/equipment">
					<DuoButton variant="ghost" className="mb-4 gap-2 font-bold">
						<ArrowLeft className="h-4 w-4" />
						<span className="hidden sm:inline">Voltar para Equipamentos</span>
						<span className="sm:hidden">Voltar</span>
					</DuoButton>
				</Link>
			</FadeIn>

			<SlideIn delay={0.1}>
				<DuoCard.Root variant="highlighted" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">{equipment.name}</h2>
						</div>
					</DuoCard.Header>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
						<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-duo-green sm:h-32 sm:w-32">
							<Dumbbell className="h-12 w-12 text-white sm:h-16 sm:w-16" />
						</div>
						<div className="min-w-0 flex-1">
							<div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
								<span
									className={cn(
										"flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 sm:text-base",
										getStatusColor(equipment.status),
									)}
								>
									{getStatusIcon(equipment.status)}
									{getStatusText(equipment.status)}
								</span>
							</div>
							<div className="mb-4 space-y-1 text-duo-gray-dark">
								<p className="text-sm sm:text-base lg:text-lg">
									<span className="font-bold">Marca:</span> {equipment.brand}
								</p>
								<p className="text-sm sm:text-base lg:text-lg">
									<span className="font-bold">Modelo:</span> {equipment.model}
								</p>
								<p className="text-sm">
									<span className="font-bold">Número de Série:</span>{" "}
									{equipment.serialNumber}
								</p>
								<p className="text-sm">
									<span className="font-bold">Tipo:</span>{" "}
									<span className="capitalize">{equipment.type}</span>
								</p>
							</div>
							<div className="flex flex-col gap-2 sm:flex-row">
								<DuoButton className="w-full gap-2 sm:w-auto">
									<Edit className="h-4 w-4" />
									<span className="hidden sm:inline">Editar Equipamento</span>
									<span className="sm:hidden">Editar</span>
								</DuoButton>
								<DuoButton variant="outline" className="w-full gap-2 sm:w-auto">
									<Wrench className="h-4 w-4" />
									<span className="hidden sm:inline">Agendar Manutenção</span>
									<span className="sm:hidden">Manutenção</span>
								</DuoButton>
								<DuoButton variant="outline" className="w-full gap-2 sm:w-auto">
									<QrCode className="h-4 w-4" />
									<span className="hidden sm:inline">Gerar QR Code</span>
									<span className="sm:hidden">QR Code</span>
								</DuoButton>
							</div>
						</div>
					</div>
				</DuoCard.Root>
			</SlideIn>

			{equipment.status === "in-use" && equipment.currentUser && (
				<SlideIn delay={0.15}>
					<DuoCard.Root variant="blue" size="default">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="min-w-0 flex-1">
								<p className="text-xs font-bold text-duo-gray-dark sm:text-sm">
									Equipamento em uso por:
								</p>
								<p className="text-xl font-bold text-duo-blue sm:text-2xl">
									{equipment.currentUser.studentName}
								</p>
							</div>
							<div className="text-left sm:text-right">
								<p className="text-xs font-bold text-duo-gray-dark sm:text-sm">
									Tempo de Uso
								</p>
								<p className="text-2xl font-bold text-duo-blue sm:text-3xl">
									<RelativeTime timestamp={equipment.currentUser.startTime} />
								</p>
							</div>
						</div>
					</DuoCard.Root>
				</SlideIn>
			)}

			<SlideIn delay={0.2}>
				<DuoStatsGrid.Root columns={4}>
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
							equipment.lastMaintenance?.toLocaleDateString("pt-BR") || "N/A"
						}
						label="Última Manutenção"
						iconColor="var(--duo-primary)"
					/>
					<DuoStatCard.Simple
						icon={Calendar}
						value={
							equipment.nextMaintenance?.toLocaleDateString("pt-BR") || "N/A"
						}
						label="Próxima Manutenção"
						iconColor="var(--duo-accent)"
					/>
				</DuoStatsGrid.Root>
			</SlideIn>

			<SlideIn delay={0.3}>
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
							<DuoCard.Root variant="highlighted" padding="md">
								<DuoCard.Header>
									<div className="flex items-center gap-2">
										<Clock className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
										<h2 className="font-bold text-[var(--duo-fg)]">Horários Mais Populares</h2>
									</div>
								</DuoCard.Header>
								<div className="space-y-3">
									{equipment.usageStats.popularTimes.map((time) => (
										<DuoCard.Root key={time} variant="highlighted" size="sm">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Clock className="h-5 w-5 text-duo-green" />
													<span className="font-bold text-duo-text">{time}</span>
												</div>
												<span className="text-sm font-bold text-duo-gray-dark">
													Alta demanda
												</span>
											</div>
										</DuoCard.Root>
									))}
								</div>
							</DuoCard.Root>

							<DuoCard.Root variant="blue" padding="md">
								<DuoCard.Header>
									<div className="flex items-center gap-2">
										<BarChart3 className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
										<h2 className="font-bold text-[var(--duo-fg)]">Métricas de Performance</h2>
									</div>
								</DuoCard.Header>
								<div className="space-y-4">
									<DuoCard.Root variant="default" size="default">
										<p className="text-sm font-bold text-duo-gray-dark">
											Taxa de Utilização
										</p>
										<p className="text-3xl font-bold text-duo-purple">
											{Math.round((equipment.usageStats.totalUses / 2000) * 100)}%
										</p>
										<div className="mt-2 h-2 overflow-hidden rounded-full bg-duo-gray">
											<div
												className="h-full bg-duo-purple transition-all"
												style={{
													width: `${
														(equipment.usageStats.totalUses / 2000) * 100
													}%`,
												}}
											/>
										</div>
									</DuoCard.Root>
									<DuoCard.Root variant="blue" size="default">
										<p className="text-sm font-bold text-duo-gray-dark">
											Eficiência de Uso
										</p>
										<p className="text-3xl font-bold text-duo-blue">92%</p>
										<p className="text-xs text-duo-gray-dark">
											Baseado em tempo médio vs recomendado
										</p>
									</DuoCard.Root>
								</div>
							</DuoCard.Root>
						</div>
					</TabsContent>

					<TabsContent value="maintenance">
						<DuoCard.Root variant="orange" padding="md">
							<DuoCard.Header>
								<div className="flex items-center gap-2">
									<Wrench className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
									<h2 className="font-bold text-[var(--duo-fg)]">Histórico de Manutenção</h2>
								</div>
							</DuoCard.Header>
							{equipment.maintenanceHistory.length > 0 ? (
								<div className="space-y-3">
									{equipment.maintenanceHistory.map((record) => (
										<DuoCard.Root key={record.id} variant="default" size="default">
											<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
												<div className="min-w-0 flex-1">
													<p className="text-sm font-bold capitalize text-duo-text sm:text-base">
														{record.type}
													</p>
													<p className="text-xs text-duo-gray-dark sm:text-sm">
														{record.description}
													</p>
													<p className="text-xs text-duo-gray-dark">
														Por: {record.performedBy}
													</p>
												</div>
												<div className="text-left sm:text-right">
													<p className="text-xs font-bold text-duo-gray-dark sm:text-sm">
														{record.date.toLocaleDateString("pt-BR")}
													</p>
													{record.cost && (
														<p className="text-base font-bold text-duo-orange sm:text-lg">
															R$ {record.cost.toFixed(2)}
														</p>
													)}
												</div>
											</div>
										</DuoCard.Root>
									))}
								</div>
							) : (
								<DuoCard.Root variant="default" size="default">
									<div className="py-8 text-center">
										<Wrench className="mx-auto mb-3 h-12 w-12 text-duo-gray-dark" />
										<p className="font-bold text-duo-gray-dark">
											Nenhum registro de manutenção
										</p>
										<p className="text-sm text-duo-gray-dark">
											Esse equipamento ainda não teve manutenções registradas
										</p>
										<DuoButton className="mt-4">Registrar Manutenção</DuoButton>
									</div>
								</DuoCard.Root>
							)}
						</DuoCard.Root>
					</TabsContent>

					<TabsContent value="info">
						<DuoCard.Root variant="default" padding="md">
							<DuoCard.Header>
								<div className="flex items-center gap-2">
									<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
									<h2 className="font-bold text-[var(--duo-fg)]">Informações do Equipamento</h2>
								</div>
							</DuoCard.Header>
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
									{
										label: "Número de Série",
										value: equipment.serialNumber,
									},
									{
										label: "Tipo",
										value: equipment.type,
										capitalize: true,
									},
								].map((item) => (
									<DuoCard.Root key={item.label} variant="default" size="sm">
										<div className="flex flex-col justify-between gap-2 sm:flex-row">
											<span className="text-sm font-bold text-duo-gray-dark sm:text-base">
												{item.label}
											</span>
											<span
												className={cn(
													"text-sm text-duo-text sm:text-base",
													item.capitalize && "capitalize",
												)}
											>
												{item.value}
											</span>
										</div>
									</DuoCard.Root>
								))}
							</div>
						</DuoCard.Root>
					</TabsContent>
				</Tabs>
			</SlideIn>
		</div>
	);
}
