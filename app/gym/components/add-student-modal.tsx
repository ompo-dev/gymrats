"use client";

import { CheckCircle, Loader2, Search, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/ui/duo-card";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";
import type { MembershipPlan } from "@/lib/types";

interface StudentSearchResult {
	found: boolean;
	isAlreadyMember?: boolean;
	existingStatus?: string;
	student?: {
		id: string;
		name: string;
		email: string;
		avatar?: string | null;
		age?: number | null;
		gender?: string | null;
		fitnessLevel?: string | null;
		goals?: string[];
		currentLevel?: number;
		currentStreak?: number;
	};
}

interface AddStudentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	membershipPlans: MembershipPlan[];
}

export function AddStudentModal({
	isOpen,
	onClose,
	onSuccess,
	membershipPlans,
}: AddStudentModalProps) {
	const [email, setEmail] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchResult, setSearchResult] =
		useState<StudentSearchResult | null>(null);
	const [selectedPlanId, setSelectedPlanId] = useState("");
	const [customAmount, setCustomAmount] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSearch = async () => {
		if (!email || email.length < 3) return;
		setIsSearching(true);
		setSearchResult(null);
		setError("");
		try {
			const res = await fetch(
				`/api/gyms/students/search?email=${encodeURIComponent(email)}`,
			);
			const data = await res.json();
			setSearchResult(data);
		} catch {
			setError("Erro ao buscar aluno. Tente novamente.");
		} finally {
			setIsSearching(false);
		}
	};

	const handleEnroll = async () => {
		if (!searchResult?.student) return;

		const selectedPlan = membershipPlans.find((p) => p.id === selectedPlanId);
		const amount = customAmount
			? Number.parseFloat(customAmount)
			: (selectedPlan?.price ?? 0);

		if (amount <= 0) {
			setError("Defina um valor para a matrícula.");
			return;
		}

		setIsSubmitting(true);
		setError("");
		try {
			const res = await fetch("/api/gyms/members", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					studentId: searchResult.student.id,
					planId: selectedPlanId || null,
					amount,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error ?? "Erro ao matricular aluno.");
				return;
			}
			onSuccess();
			handleClose();
		} catch {
			setError("Erro ao matricular aluno. Tente novamente.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setEmail("");
		setSearchResult(null);
		setSelectedPlanId("");
		setCustomAmount("");
		setError("");
		onClose();
	};

	if (!isOpen) return null;

	const planOptions = membershipPlans.map((p) => ({
		value: p.id,
		label: `${p.name} — R$ ${p.price.toFixed(2).replace(".", ",")}`,
	}));

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
			onClick={(e) => e.target === e.currentTarget && handleClose()}
			onKeyDown={(e) => e.key === "Escape" && handleClose()}
		>
			<DuoCard
				variant="default"
				size="default"
				className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
			>
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-duo-blue/10">
							<UserPlus className="h-5 w-5 text-duo-blue" />
						</div>
						<h2 className="text-xl font-bold text-duo-text">
							Adicionar Aluno
						</h2>
					</div>
					<button
						onClick={handleClose}
						className="flex h-8 w-8 items-center justify-center rounded-full text-duo-gray-dark transition-colors hover:bg-duo-gray-lighter hover:text-duo-text"
						type="button"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Campo de busca */}
				<div className="mb-4">
					<p className="mb-2 text-sm font-semibold text-duo-text">
						Buscar por e-mail
					</p>
					<div className="flex gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-duo-gray-dark" />
							<Input
								placeholder="email@exemplo.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="pl-9"
							/>
						</div>
						<Button
							onClick={handleSearch}
							disabled={isSearching || email.length < 3}
							variant="default"
						>
							{isSearching ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Buscar"
							)}
						</Button>
					</div>
				</div>

				{/* Resultado da busca */}
				{searchResult && (
					<div className="space-y-4">
						{/* Não encontrado */}
						{!searchResult.found && (
							<DuoCard variant="orange" size="sm">
								<p className="text-sm text-duo-text">
									Nenhum aluno encontrado com este e-mail. Verifique se o
									usuário está cadastrado com a role <strong>STUDENT</strong>.
								</p>
							</DuoCard>
						)}

						{/* Já é membro */}
						{searchResult.found && searchResult.isAlreadyMember && (
							<DuoCard variant="orange" size="sm">
								<p className="text-sm text-duo-text">
									Este aluno já é membro desta academia.{" "}
									<span className="font-semibold">
										Status atual: {searchResult.existingStatus}
									</span>
								</p>
							</DuoCard>
						)}

						{/* Aluno encontrado e disponível para matrícula */}
						{searchResult.found &&
							!searchResult.isAlreadyMember &&
							searchResult.student && (
								<>
									{/* Card do aluno */}
									<DuoCard variant="highlighted" size="sm">
										<div className="flex items-center gap-3">
											{searchResult.student.avatar ? (
												<div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
													<Image
														src={searchResult.student.avatar}
														alt={searchResult.student.name}
														fill
														className="object-cover"
													/>
												</div>
											) : (
												<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-duo-blue/15 text-lg font-bold text-duo-blue">
													{searchResult.student.name.charAt(0).toUpperCase()}
												</div>
											)}
											<div className="min-w-0">
												<p className="truncate font-bold text-duo-text">
													{searchResult.student.name}
												</p>
												<p className="truncate text-sm text-duo-gray-dark">
													{searchResult.student.email}
												</p>
												<div className="mt-1 flex flex-wrap gap-2">
													<span className="rounded-full bg-duo-blue/10 px-2 py-0.5 text-xs font-medium text-duo-blue">
														Nível {searchResult.student.currentLevel ?? 1}
													</span>
													<span className="rounded-full bg-duo-orange/10 px-2 py-0.5 text-xs font-medium text-duo-orange">
														🔥 {searchResult.student.currentStreak ?? 0} dias
													</span>
												</div>
											</div>
											<CheckCircle className="ml-auto h-5 w-5 flex-shrink-0 text-duo-green" />
										</div>
									</DuoCard>

									{/* Seleção de plano */}
									{planOptions.length > 0 && (
										<div>
											<p className="mb-2 text-sm font-semibold text-duo-text">
												Plano de Matrícula
											</p>
											<OptionSelector
												options={[
													{ value: "", label: "Sem plano (valor manual)" },
													...planOptions,
												]}
												value={selectedPlanId}
												onChange={setSelectedPlanId}
												layout="list"
												size="sm"
											/>
										</div>
									)}

									{/* Valor */}
									<div>
										<p className="mb-1 text-sm font-semibold text-duo-text">
											{selectedPlanId
												? "Valor (deixe em branco para usar o valor do plano)"
												: "Valor da Matrícula (R$)"}
										</p>
										<Input
											type="number"
											min="0"
											step="0.01"
											placeholder={
												selectedPlanId
													? `Padrão: R$ ${membershipPlans.find((p) => p.id === selectedPlanId)?.price.toFixed(2).replace(".", ",") ?? "0,00"}`
													: "Ex: 120,00"
											}
											value={customAmount}
											onChange={(e) => setCustomAmount(e.target.value)}
										/>
									</div>

									{/* Erro */}
									{error && (
										<p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
											{error}
										</p>
									)}

									{/* Botão de confirmar */}
									<Button
										onClick={handleEnroll}
										disabled={isSubmitting}
										className="w-full"
									>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Matriculando...
											</>
										) : (
											<>
												<UserPlus className="mr-2 h-4 w-4" />
												Confirmar Matrícula
											</>
										)}
									</Button>
								</>
							)}
					</div>
				)}

				{/* Erro geral (quando não há resultado) */}
				{error && !searchResult && (
					<p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
						{error}
					</p>
				)}
			</DuoCard>
		</div>
	);
}
