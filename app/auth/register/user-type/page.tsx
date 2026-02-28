"use client";

import { ArrowLeft, Building2, Check, Dumbbell, Users } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { DuoCard } from "@/components/duo";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores";

/**
 * Página de seleção de tipo de usuário após primeiro login com Google.
 * Usuários com role PENDING são redirecionados aqui para escolher: Aluno ou Academia.
 */
export default function UserTypePage() {
	const router = useRouter();
	const { setUserRole } = useAuthStore();
	const [selectedType, setSelectedType] = useState<"student" | "gym" | null>(
		null,
	);
	const [isChecking, setIsChecking] = useState(true);

	// Se já tem role definido (STUDENT/GYM), redirecionar para área correspondente
	useEffect(() => {
		const checkAndRedirect = async () => {
			try {
				const { apiClient } = await import("@/lib/api/client");
				const sessionResponse = await apiClient.get<{
					user: { role: string } | null;
				}>("/api/auth/session");

				const role = sessionResponse.data.user?.role;

				// Sem sessão: ir para welcome
				if (!sessionResponse.data.user) {
					router.replace("/welcome");
					return;
				}

				// Já escolheu: redirecionar
				if (role === "STUDENT" || role === "ADMIN") {
					setUserRole("STUDENT");
					router.replace("/student");
					return;
				}
				if (role === "GYM") {
					setUserRole("GYM");
					router.replace("/gym");
					return;
				}

				// PENDING: permanecer na página para escolher
			} catch (error) {
				console.error("Erro ao verificar sessão:", error);
				router.replace("/welcome");
			} finally {
				setIsChecking(false);
			}
		};

		checkAndRedirect();
	}, [router, setUserRole]);

	const handleSelectType = (type: "student" | "gym") => {
		setSelectedType(type);
		// Armazena intenção localmente - cadastro só ocorre ao concluir onboarding
		if (typeof window !== "undefined") {
			sessionStorage.setItem("gymrats:onboarding-intent", type);
		}
		// Navega para onboarding sem cadastrar no banco
		router.push(type === "student" ? "/student/onboarding" : "/gym/onboarding");
	};

	if (isChecking) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-duo-bg">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-duo-green border-t-transparent" />
					<p className="text-duo-fg-muted">Carregando...</p>
				</div>
			</div>
		);
	}

	const studentFeatures = [
		"Sistema de gamificação",
		"Treinos personalizados",
		"Análise de postura com IA",
		"Competição com amigos",
	];

	const gymFeatures = [
		"Gestão completa de alunos",
		"Controle de equipamentos",
		"Gestão financeira",
		"Gamificação para academias",
	];

	return (
		<div className="flex min-h-screen flex-col bg-duo-bg">
			<div className="absolute top-4 left-4 z-10">
				<Link
					href="/welcome"
					className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-duo-fg-muted transition-colors hover:bg-duo-bg-elevated hover:text-duo-fg"
				>
					<ArrowLeft className="h-4 w-4" />
					Voltar
				</Link>
			</div>
			<div className="flex flex-1 items-center justify-center px-4 py-12">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="w-full max-w-4xl"
				>
					{/* Header */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="mb-12 text-center"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{
								delay: 0.2,
								duration: 0.5,
								type: "spring",
							}}
							className="mb-4 flex justify-center"
						>
							<div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-duo-primary shadow-lg">
								<Dumbbell className="h-10 w-10 text-white" />
							</div>
						</motion.div>
						<h1 className="mb-3 text-3xl font-bold text-duo-fg md:text-4xl">
							Como você vai usar o GymRats?
						</h1>
						<p className="text-lg text-duo-fg-muted">
							Escolha a opção que melhor descreve você
						</p>
					</motion.div>

					{/* Cards */}
					<div className="grid gap-6 md:grid-cols-2">
						{/* Aluno */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.3, duration: 0.5 }}
						>
							<DuoCard.Root
								variant="outlined"
								padding="lg"
								onClick={() => handleSelectType("student")}
								className={`cursor-pointer border-2 transition-all ${
									selectedType === "student"
										? "border-duo-green bg-duo-green/10 shadow-xl"
										: "border-duo-border bg-duo-bg-card hover:border-duo-green/50 hover:shadow-lg"
								}`}
							>
								<div className="w-full p-2">
										<div className="mb-6 text-center">
											<motion.div
												className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ${
													selectedType === "student"
														? "bg-duo-green"
														: "bg-duo-bg-elevated"
												}`}
												whileHover={{ scale: 1.05 }}
												transition={{ type: "spring", stiffness: 400 }}
											>
												<Users
													className={`h-12 w-12 ${
														selectedType === "student"
															? "text-white"
															: "text-duo-fg-muted"
													}`}
												/>
											</motion.div>
											<h2 className="mb-2 text-2xl font-bold text-duo-fg">
												Sou Aluno
											</h2>
											<p className="text-sm text-duo-fg-muted">
												Acompanhe treinos, dieta e progresso
											</p>
										</div>

										<div className="mb-6 space-y-2">
											{studentFeatures.map((feature, index) => (
												<motion.div
													key={feature}
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{
														delay: 0.4 + index * 0.1,
													}}
													className="flex items-center gap-2 text-sm text-duo-fg-muted"
												>
													<div
														className={`h-2 w-2 rounded-full ${
															selectedType === "student"
																? "bg-duo-green"
																: "bg-duo-border"
														}`}
													/>
													<span>{feature}</span>
												</motion.div>
											))}
										</div>

										<AnimatePresence>
											{selectedType === "student" && (
												<motion.div
													initial={{ opacity: 0, scale: 0.8 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.8 }}
													className="flex items-center justify-center gap-2 font-bold text-duo-green"
												>
													<Check className="h-5 w-5" />
													<span>Selecionado</span>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
							</DuoCard.Root>
						</motion.div>

						{/* Academia */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.4, duration: 0.5 }}
						>
							<DuoCard.Root
								variant="outlined"
								padding="lg"
								onClick={() => handleSelectType("gym")}
								className={`cursor-pointer border-2 transition-all ${
									selectedType === "gym"
										? "border-duo-orange bg-duo-orange/10 shadow-xl"
										: "border-duo-border bg-duo-bg-card hover:border-duo-orange/50 hover:shadow-lg"
								}`}
							>
								<div className="w-full p-2">
										<div className="mb-6 text-center">
											<motion.div
												className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ${
													selectedType === "gym"
														? "bg-duo-orange"
														: "bg-duo-bg-elevated"
												}`}
												whileHover={{ scale: 1.05 }}
												transition={{ type: "spring", stiffness: 400 }}
											>
												<Building2
													className={`h-12 w-12 ${
														selectedType === "gym"
															? "text-white"
															: "text-duo-fg-muted"
													}`}
												/>
											</motion.div>
											<h2 className="mb-2 text-2xl font-bold text-duo-fg">
												Sou Academia
											</h2>
											<p className="text-sm text-duo-fg-muted">
												Gerencie alunos, equipamentos e financeiro
											</p>
										</div>

										<div className="mb-6 space-y-2">
											{gymFeatures.map((feature, index) => (
												<motion.div
													key={feature}
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{
														delay: 0.5 + index * 0.1,
													}}
													className="flex items-center gap-2 text-sm text-duo-fg-muted"
												>
													<div
														className={`h-2 w-2 rounded-full ${
															selectedType === "gym"
																? "bg-duo-orange"
																: "bg-duo-border"
														}`}
													/>
													<span>{feature}</span>
												</motion.div>
											))}
										</div>

										<AnimatePresence>
											{selectedType === "gym" && (
												<motion.div
													initial={{ opacity: 0, scale: 0.8 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.8 }}
													className="flex items-center justify-center gap-2 font-bold text-duo-orange"
												>
													<Check className="h-5 w-5" />
													<span>Selecionado</span>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
							</DuoCard.Root>
						</motion.div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
