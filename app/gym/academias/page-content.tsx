"use client";

import {
	Building2,
	Check,
	DollarSign,
	MapPin,
	Plus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGymsList } from "@/hooks/use-gyms-list";

export function AcademiasPageContent() {
	const {
		gyms,
		activeGym: _activeGym,
		activeGymId,
		setActiveGymId,
		canCreateMultipleGyms,
		refreshGyms,
		isLoading,
	} = useGymsList();

	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [createError, setCreateError] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		address: "",
		phone: "",
		email: "",
		cnpj: "",
	});

	const handleSelectGym = async (gymId: string) => {
		await setActiveGymId(gymId);
	};

	const handleCreateGym = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsCreating(true);
		setCreateError("");

		try {
			// Usar axios client (API → Component)
			const { apiClient } = await import("@/lib/api/client");
			const response = await apiClient.post<{ error?: string }>(
				"/api/gyms/create",
				formData,
			);

			if (response.data.error) {
				throw new Error(response.data.error || "Erro ao criar academia");
			}

			// Limpar formulário
			setFormData({
				name: "",
				address: "",
				phone: "",
				email: "",
				cnpj: "",
			});

			// Recarregar lista de academias
			await refreshGyms();
			setShowCreateDialog(false);
		} catch (error: unknown) {
			setCreateError(
				error instanceof Error ? error.message : "Erro ao criar academia",
			);
		} finally {
			setIsCreating(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
					<p className="text-gray-600">Carregando academias...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 pb-24">
			<div className="max-w-4xl mx-auto p-4 space-y-6">
				{/* Header */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Minhas Academias
							</h1>
							<p className="text-gray-600 mt-1">
								Gerencie todas as suas academias em um só lugar
							</p>
						</div>
						<div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
							{gyms.length} {gyms.length === 1 ? "Academia" : "Academias"}
						</div>
					</div>

					{!canCreateMultipleGyms && gyms.length === 1 && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
							<DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
							<div className="flex-1">
								<h3 className="font-medium text-blue-900">
									Desbloqueie Múltiplas Academias
								</h3>
								<p className="text-sm text-blue-700 mt-1">
									Assine um plano pago para gerenciar múltiplas academias com
									dados completamente separados.
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Lista de Academias */}
				<div className="space-y-3">
					{gyms.map((gym) => (
						<div
							key={gym.id}
							className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
								activeGymId === gym.id
									? "border-green-500 shadow-md"
									: "border-gray-200 hover:border-gray-300"
							}`}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-3">
										<div
											className={`p-2 rounded-lg ${
												activeGymId === gym.id ? "bg-green-100" : "bg-gray-100"
											}`}
										>
											<Building2
												className={`w-5 h-5 ${
													activeGymId === gym.id
														? "text-green-600"
														: "text-gray-600"
												}`}
											/>
										</div>
										<div className="flex-1">
											<h3 className="font-semibold text-lg text-gray-900">
												{gym.name}
											</h3>
											<div className="flex items-center gap-2 mt-1">
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium ${
														gym.plan === "basic"
															? "bg-gray-100 text-gray-700"
															: gym.plan === "premium"
																? "bg-purple-100 text-purple-700"
																: "bg-yellow-100 text-yellow-700"
													}`}
												>
													{gym.plan === "basic"
														? "Básico"
														: gym.plan === "premium"
															? "Premium"
															: "Empresarial"}
												</span>
												{!gym.hasActiveSubscription && (
													<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
														Trial
													</span>
												)}
												{activeGymId === gym.id && (
													<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
														<Check className="w-3 h-3" />
														Ativa
													</span>
												)}
											</div>
										</div>
									</div>

									<div className="space-y-2 text-sm text-gray-600">
										<div className="flex items-center gap-2">
											<MapPin className="w-4 h-4" />
											<span>{gym.address}</span>
										</div>
										<div className="flex items-center gap-2">
											<Users className="w-4 h-4" />
											<span>Alunos cadastrados na academia</span>
										</div>
									</div>
								</div>

								<div>
									{activeGymId !== gym.id ? (
										<Button
											onClick={() => handleSelectGym(gym.id)}
											variant="outline"
											size="sm"
											className="border-green-500 text-green-600 hover:bg-green-50"
										>
											Selecionar
										</Button>
									) : (
										<div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
											<Check className="w-5 h-5 text-green-600" />
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Botão para criar nova academia */}
				{canCreateMultipleGyms && (
					<button
						type="button"
						onClick={() => setShowCreateDialog(true)}
						className="w-full bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-8 hover:border-green-500 hover:bg-green-50 transition-all group"
					>
						<div className="flex flex-col items-center gap-3">
							<div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
								<Plus className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
									Criar Nova Academia
								</h3>
								<p className="text-sm text-gray-600 mt-1">
									Adicione mais uma unidade à sua rede
								</p>
							</div>
						</div>
					</button>
				)}
			</div>

			{/* Dialog para criar nova academia */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle>Criar Nova Academia</DialogTitle>
						<DialogDescription>
							Adicione uma nova academia à sua conta. Todos os dados serão
							separados entre suas academias.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleCreateGym} className="space-y-4">
						<div>
							<Label htmlFor="name">Nome da Academia *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
								placeholder="Ex: Minha Academia Centro"
							/>
						</div>

						<div>
							<Label htmlFor="address">Endereço *</Label>
							<Input
								id="address"
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								required
								placeholder="Rua, número, bairro"
							/>
						</div>

						<div>
							<Label htmlFor="phone">Telefone *</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								required
								placeholder="(00) 00000-0000"
							/>
						</div>

						<div>
							<Label htmlFor="email">Email *</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								required
								placeholder="contato@minhaacademia.com"
							/>
						</div>

						<div>
							<Label htmlFor="cnpj">CNPJ (opcional)</Label>
							<Input
								id="cnpj"
								value={formData.cnpj}
								onChange={(e) =>
									setFormData({ ...formData, cnpj: e.target.value })
								}
								placeholder="00.000.000/0000-00"
							/>
						</div>

						{createError && (
							<div className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">
								{createError}
							</div>
						)}

						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowCreateDialog(false)}
								disabled={isCreating}
								className="flex-1"
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								disabled={isCreating}
								className="flex-1 bg-green-600 hover:bg-green-700"
							>
								{isCreating ? "Criando..." : "Criar Academia"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
