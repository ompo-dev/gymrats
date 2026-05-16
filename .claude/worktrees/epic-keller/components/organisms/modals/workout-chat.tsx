"use client";

import {
	Check,
	Loader2,
	MessageSquare,
	RotateCcw,
	Send,
	Sparkles,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/buttons/button";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import { WORKOUT_INITIAL_MESSAGE } from "@/lib/ai/prompts/workout";
import { apiClient } from "@/lib/api/client";
import type { Unit, WorkoutExercise, WorkoutSession } from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { WorkoutPreviewCard } from "./workout-preview-card";

interface WorkoutChatProps {
	onClose: () => void;
	unitId: string;
	workouts?: WorkoutSession[];
}

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	workoutPreview?: ParsedWorkoutPlan["workouts"][0]; // Para workouts exibidos como componentes
	workoutPreviewIndex?: number;
	reference?: {
		type: "workout" | "exercise";
		workoutTitle: string;
		workoutIndex: number;
		workoutId?: string;
		exerciseName?: string;
		exerciseIndex?: number;
	}; // Para referências visuais
}

interface PreviewWorkout {
	title: string;
	description?: string;
	type: "strength" | "cardio" | "flexibility";
	muscleGroup: string;
	difficulty: "iniciante" | "intermediario" | "avancado";
	exercises: Array<{
		name: string;
		sets: number;
		reps: string;
		rest: number;
		notes?: string;
		alternatives?: string[];
	}>;
}

interface ParsedWorkoutPlan {
	intent: "create" | "edit" | "delete";
	action: string;
	workouts: Array<{
		title: string;
		description?: string;
		type: "strength" | "cardio" | "flexibility";
		muscleGroup: string;
		difficulty: "iniciante" | "intermediario" | "avancado";
		exercises: Array<{
			name: string;
			sets: number;
			reps: string;
			rest: number;
			notes?: string;
			focus?: "quadriceps" | "posterior" | null;
		}>;
	}>;
	targetWorkoutId?: string;
	exerciseToRemove?: string;
	exerciseToReplace?: { old: string; new: string };
	message: string;
}

type ParsedWorkoutPlanWithMeta = ParsedWorkoutPlan & {
	remainingMessages?: number;
};

export function WorkoutChat({
	onClose,
	unitId,
	workouts: initialWorkouts = [],
}: WorkoutChatProps) {
	// Buscar workouts atualizados do store para ter dados sempre atualizados
	const storeUnits = useStudent("units");
	const unit = storeUnits.find((u: Unit) => u.id === unitId);
	const storeWorkouts = unit?.workouts || [];
	const workouts = storeWorkouts.length > 0 ? storeWorkouts : initialWorkouts;

	// Actions e loaders do store
	const _actions = useStudent("actions");
	const loaders = useStudent("loaders");

	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			role: "assistant",
			content: WORKOUT_INITIAL_MESSAGE,
			timestamp: new Date(),
		},
	]);
	const [inputMessage, setInputMessage] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	// REMOVIDO: parsedPlan não é mais necessário - processamento é automático no servidor
	const [conversationHistory, setConversationHistory] = useState<
		Array<{
			role: "user" | "assistant";
			content: string;
		}>
	>([]);
	const [remainingMessages, setRemainingMessages] = useState<number | null>(
		null,
	);
	const [previewWorkouts, setPreviewWorkouts] = useState<PreviewWorkout[]>([]);
	const [allWorkoutsComplete, setAllWorkoutsComplete] = useState(false);
	const [isApproving, setIsApproving] = useState(false);
	const [reference, setReference] = useState<{
		type: "workout" | "exercise";
		workoutTitle: string;
		workoutIndex: number;
		workoutId?: string; // ID real do workout no banco
		exerciseName?: string;
		exerciseIndex?: number;
	} | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const { toast } = useToast();

	// Armazenar dados completos do último parse para processamento
	const [pendingWorkoutData, setPendingWorkoutData] =
		useState<ParsedWorkoutPlanWithMeta | null>(null);

	const handleApprove = async () => {
		if (!pendingWorkoutData || !unitId) {
			toast({
				title: "Erro",
				description: "Dados do treino não encontrados.",
				variant: "destructive",
			});
			return;
		}

		setIsApproving(true);
		try {
			// Se há referência e a ação é update_workout ou replace_exercise, garantir que o targetWorkoutId está correto
			let targetWorkoutId = pendingWorkoutData.targetWorkoutId;

			// Se targetWorkoutId é um título (não é um ID válido), buscar o workout correto
			if (
				targetWorkoutId &&
				!targetWorkoutId.startsWith("cl") &&
				!targetWorkoutId.startsWith("cm")
			) {
				// Provavelmente é um título, buscar nos previews ou no banco
				const workoutFromPreview = previewWorkouts.find(
					(w) => w.title === targetWorkoutId,
				);
				const workoutFromDb = workouts.find(
					(w: WorkoutSession) => w.title === targetWorkoutId,
				);

				// Se encontrou no preview mas não no banco, usar o título mesmo (será criado)
				// Se encontrou no banco, usar o ID
				if (workoutFromDb) {
					targetWorkoutId = workoutFromDb.id;
				} else if (workoutFromPreview) {
					// Manter o título para que o backend encontre pelo título
					targetWorkoutId = workoutFromPreview.title;
				}
			}

			// Se há referência e a ação é update_workout, a IA deve ter retornado TODOS os workouts atualizados
			let workoutsToProcess = pendingWorkoutData.workouts || [];

			if (reference && pendingWorkoutData.action === "update_workout") {
				// A IA deve retornar TODOS os workouts atualizados no previewWorkouts
				// Se a IA retornou todos corretamente, usar eles diretamente
				if (workoutsToProcess.length === previewWorkouts.length) {
					// A IA retornou todos os workouts corretamente, usar todos eles
					// (mantém workoutsToProcess como está)
				} else if (previewWorkouts.length > 0) {
					// Se a IA não retornou todos, usar os previews atualizados (que já contêm a modificação)
					workoutsToProcess = previewWorkouts;
				}

				// Buscar o título ORIGINAL do workout referenciado (antes da modificação) para usar como identificador
				const originalWorkoutTitle = reference.workoutTitle;

				// Recarregar workouts para buscar o ID correto
				await loaders.loadWorkouts(true);
				const currentUnits = useStudentUnifiedStore.getState().data.units ?? [];
				const currentUnit = currentUnits.find((u: Unit) => u.id === unitId);
				const currentWorkouts = currentUnit?.workouts || [];

				// Buscar pelo título ORIGINAL (antes da modificação) - isso é crítico!
				const workoutFromDb = currentWorkouts.find(
					(w: WorkoutSession) => w.title === originalWorkoutTitle,
				);

				if (workoutFromDb) {
					targetWorkoutId = workoutFromDb.id;
				} else {
					// Se não encontrou pelo título original, tentar pelo título modificado
					const modifiedWorkout = workoutsToProcess[reference.workoutIndex];
					if (modifiedWorkout) {
						const workoutByNewTitle = currentWorkouts.find(
							(w: WorkoutSession) => w.title === modifiedWorkout.title,
						);
						if (workoutByNewTitle) {
							targetWorkoutId = workoutByNewTitle.id;
						} else {
							// Se ainda não encontrou, usar o título original como identificador
							targetWorkoutId = originalWorkoutTitle;
						}
					} else {
						targetWorkoutId = originalWorkoutTitle;
					}
				}

				// Processar TODOS os workouts: criar os que não existem e atualizar o referenciado
				// Separar workouts para criar vs atualizar
				const workoutsToCreate: PreviewWorkout[] = [];
				const workoutToUpdate = workoutsToProcess[reference.workoutIndex];

				for (let i = 0; i < workoutsToProcess.length; i++) {
					if (i === reference.workoutIndex) {
						// Este é o workout referenciado, será atualizado
						continue;
					}

					const workout = workoutsToProcess[i];
					// Verificar se já existe no banco
					const existsInDb = currentWorkouts.some(
						(w: WorkoutSession) => w.title === workout.title,
					);
					if (!existsInDb) {
						workoutsToCreate.push(workout);
					}
				}

				// Criar todos os workouts que ainda não existem
				if (workoutsToCreate.length > 0) {
					console.log(
						`[handleApprove] Criando ${workoutsToCreate.length} workouts novos...`,
					);

					for (const preview of workoutsToCreate) {
						try {
							await apiClient.post(
								"/api/workouts/process",
								{
									parsedPlan: {
										intent: "create",
										action: "create_workouts",
										workouts: [preview],
										message: `Criando workout: ${preview.title}`,
									},
									unitId,
								},
								{
									timeout: 120000,
								},
							);
							console.log(
								`[handleApprove] ✅ Workout criado: ${preview.title}`,
							);
						} catch (error: unknown) {
							console.error(
								`[handleApprove] ❌ Erro ao criar workout ${preview.title}:`,
								error,
							);
							throw error;
						}
					}

					// Recarregar workouts após criar
					await loaders.loadWorkouts(true);
					const updatedUnits =
						useStudentUnifiedStore.getState().data.units ?? [];
					const updatedUnit = updatedUnits.find((u: Unit) => u.id === unitId);
					const updatedWorkouts = updatedUnit?.workouts || [];

					// Atualizar targetWorkoutId se necessário após criar os novos
					if (
						targetWorkoutId &&
						!targetWorkoutId.startsWith("cl") &&
						!targetWorkoutId.startsWith("cm")
					) {
						const workoutFromDbAfterCreate = updatedWorkouts.find(
							(w: WorkoutSession) => w.title === originalWorkoutTitle,
						);
						if (workoutFromDbAfterCreate) {
							targetWorkoutId = workoutFromDbAfterCreate.id;
						}
					}
				}

				// Agora atualizar apenas o workout referenciado
				if (workoutToUpdate) {
					workoutsToProcess = [workoutToUpdate];
				} else {
					// Fallback: usar o primeiro se não encontrou o referenciado
					workoutsToProcess =
						workoutsToProcess.length > 0 ? [workoutsToProcess[0]] : [];
				}
			} else if (
				reference &&
				(pendingWorkoutData.action === "replace_exercise" ||
					pendingWorkoutData.action === "remove_exercise")
			) {
				// Para replace/remove exercise, manter apenas o workout modificado
				workoutsToProcess =
					workoutsToProcess.length > 0 ? [workoutsToProcess[0]] : [];

				// Garantir que o targetWorkoutId está correto
				if (!targetWorkoutId || targetWorkoutId === "novo") {
					const workoutFromDb = workouts.find(
						(w: WorkoutSession) => w.title === reference.workoutTitle,
					);
					if (workoutFromDb) {
						targetWorkoutId = workoutFromDb.id;
					} else {
						targetWorkoutId = reference.workoutTitle;
					}
				}
			} else if (
				!reference &&
				previewWorkouts.length > 0 &&
				pendingWorkoutData.action === "create_workouts"
			) {
				// Se não há referência mas há previews, usar todos os previews
				workoutsToProcess = previewWorkouts;
			}

			const parsedPlan = {
				intent: pendingWorkoutData.intent,
				action: pendingWorkoutData.action,
				workouts: workoutsToProcess,
				targetWorkoutId: targetWorkoutId,
				exerciseToRemove: pendingWorkoutData.exerciseToRemove,
				exerciseToReplace: pendingWorkoutData.exerciseToReplace,
				message: pendingWorkoutData.message,
			};

			console.log(
				"[WorkoutChat] Aprovando e processando treino:",
				parsedPlan.action,
				"targetWorkoutId:",
				targetWorkoutId,
				"unitId:",
				unitId,
			);

			const processResponse = await apiClient.post(
				"/api/workouts/process",
				{
					parsedPlan,
					unitId,
				},
				{
					timeout: 120000,
				},
			);

			console.log(
				"[WorkoutChat] ✅ Treino processado com sucesso:",
				processResponse.data,
			);

			// Recarregar dados do store após processamento
			await loaders.loadWorkouts(true);

			toast({
				title: "Treino adicionado!",
				description: "Seu treino foi criado com sucesso.",
			});

			// Fechar chat após aprovação
			onClose();
		} catch (processError: unknown) {
			console.error("[WorkoutChat] ❌ Erro ao processar treino:", processError);
			const apiMessage = (
				processError as { response?: { data?: { message?: string } } }
			).response?.data?.message;
			const fallbackMessage =
				processError instanceof Error
					? processError.message
					: "Erro ao processar treino. Tente novamente.";
			toast({
				title: "Erro ao processar",
				description: apiMessage ?? fallbackMessage,
				variant: "destructive",
			});
		} finally {
			setIsApproving(false);
		}
	};

	const handleRefazer = () => {
		// Enviar mensagem para IA perguntando o que mudar
		const refazerMessage = "O que você não gostou? Quer que eu mude algo?";

		// Adicionar mensagem do assistente perguntando
		setMessages((prev) => [
			...prev,
			{
				role: "assistant",
				content: refazerMessage,
				timestamp: new Date(),
			},
		]);

		// Adicionar ao histórico de conversa
		setConversationHistory((prev) => [
			...prev,
			{ role: "assistant", content: refazerMessage },
		]);

		// Limpar workouts preview para começar novo ciclo
		setPreviewWorkouts([]);
		setAllWorkoutsComplete(false);
		setPendingWorkoutData(null);

		// Habilitar input para usuário responder
		setIsProcessing(false);

		// Focar no input
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	const handleExportWorkouts = async () => {
		const payload = {
			workouts: workouts.map((w: WorkoutSession) => ({
				title: w.title,
				description: w.description || "",
				type: w.type,
				muscleGroup: w.muscleGroup,
				difficulty:
					(w.difficulty as PreviewWorkout["difficulty"]) || "intermediario",
				exercises: w.exercises.map(
					(
						e: WorkoutExercise & {
							rest?: number;
							alternatives?: (string | { name?: string })[];
						},
					) => ({
						name: e.name,
						sets: e.sets,
						reps: e.reps,
						rest: e.rest ?? 60,
						notes: e.notes || undefined,
						alternatives:
							e.alternatives?.map((alt) =>
								typeof alt === "string" ? alt : (alt?.name ?? ""),
							) || [],
					}),
				),
			})),
		};

		const json = JSON.stringify(payload, null, 2);
		try {
			await navigator.clipboard.writeText(json);
			toast({
				title: "Treino exportado",
				description: "JSON copiado para a área de transferência.",
			});
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content:
						"Exportei seu treino em JSON e copiei para a área de transferência. Cole onde quiser ou edite e reenvie aqui para importar.",
					timestamp: new Date(),
				},
			]);
		} catch (error: unknown) {
			console.error("Erro ao copiar JSON:", error);
			toast({
				title: "Erro ao copiar",
				description: "Não foi possível copiar o JSON. Tente novamente.",
				variant: "destructive",
			});
		}
	};

	// Scroll para última mensagem
	// biome-ignore lint/correctness/useExhaustiveDependencies: precisamos reagir à mudança de mensagens
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Focus no input ao montar
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSendMessage = async () => {
		if (!inputMessage.trim() || isProcessing) return;

		const userMessage = inputMessage.trim();
		const currentReference = reference; // Guardar referência antes de limpar
		setInputMessage("");
		setReference(null); // Limpar referência após enviar

		// Adicionar mensagem do usuário (com referência visual se houver)
		const newUserMessage: ChatMessage = {
			role: "user",
			content: userMessage,
			timestamp: new Date(),
			reference: currentReference || undefined, // Incluir referência na mensagem
		};
		setMessages((prev) => [...prev, newUserMessage]);

		// Construir mensagem para a IA com referência se houver
		let messageForAI = userMessage;
		if (currentReference) {
			// Usar o título ORIGINAL (antes de qualquer modificação) como identificador
			const originalTitle = currentReference.workoutTitle;
			if (currentReference.type === "workout") {
				messageForAI = `[Referenciando treino: "${originalTitle}" (título original para identificar)] ${userMessage}`;
			} else if (
				currentReference.type === "exercise" &&
				currentReference.exerciseName
			) {
				messageForAI = `[Referenciando exercício: "${currentReference.exerciseName}" do treino "${originalTitle}" (título original para identificar)] ${userMessage}`;
			}
		}

		setConversationHistory((prev) => [
			...prev,
			{ role: "user", content: messageForAI },
		]);

		setIsProcessing(true);

		try {
			// Buscar perfil do student para contexto
			const profile = useStudentUnifiedStore.getState().data.profile;

			// Preparar informações sobre workouts existentes para a IA
			const existingWorkouts = workouts.map((w: WorkoutSession) => ({
				id: w.id,
				title: w.title,
				type: w.type,
				muscleGroup: w.muscleGroup,
				exercises: w.exercises.map((e: WorkoutExercise) => ({
					id: e.id,
					name: e.name,
					sets: e.sets,
					reps: e.reps,
				})),
			}));

			// Usar SSE (Server-Sent Events) para streaming da resposta
			// No browser, sempre usar mesma origem (URL relativa) para evitar drift de porta
			const API_BASE_URL =
				typeof window !== "undefined"
					? ""
					: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
			const token =
				typeof window !== "undefined"
					? localStorage.getItem("auth_token")
					: null;

			// Criar URL com parâmetros (SSE não suporta POST body, então usamos query params ou headers)
			const response = await fetch(`${API_BASE_URL}/api/workouts/chat-stream`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify({
					message: messageForAI, // Usar mensagem com referência para IA
					conversationHistory,
					unitId,
					existingWorkouts,
					profile,
					reference: currentReference || undefined, // Enviar referência separadamente
					previewWorkouts:
						previewWorkouts.length > 0 ? previewWorkouts : undefined, // Enviar previews quando houver referência
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Processar eventos SSE
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let parsedData: ParsedWorkoutPlanWithMeta | null = null;
			let statusMessageId: number | null = null;
			const receivedWorkouts: PreviewWorkout[] = [];

			if (!reader) {
				throw new Error("Stream não disponível");
			}

			// Função para atualizar ou criar mensagem de status
			const updateStatusMessage = (message: string) => {
				setMessages((prev) => {
					// Verificar se a mensagem de status ainda existe e não tem workoutPreview
					if (
						statusMessageId !== null &&
						prev[statusMessageId]?.role === "assistant" &&
						!prev[statusMessageId]?.workoutPreview
					) {
						// Atualizar mensagem existente apenas se não tiver workoutPreview
						const updated = [...prev];
						updated[statusMessageId] = {
							...updated[statusMessageId],
							content: message,
						};
						return updated;
					} else {
						// Criar nova mensagem de status
						const newMsg: ChatMessage = {
							role: "assistant",
							content: message,
							timestamp: new Date(),
						};
						const updated = [...prev, newMsg];
						statusMessageId = updated.length - 1;
						return updated;
					}
				});
			};

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const chunks = buffer.split("\n\n");
				buffer = chunks.pop() || "";

				for (const chunk of chunks) {
					if (!chunk.trim()) continue;

					const lines = chunk.split("\n");
					let eventType = "";
					let data = "";

					for (const line of lines) {
						if (line.startsWith("event: ")) {
							eventType = line.substring(7).trim();
						} else if (line.startsWith("data: ")) {
							data = line.substring(6).trim();
						}
					}

					if (eventType === "status" && data) {
						try {
							const statusData = JSON.parse(data);
							updateStatusMessage(statusData.message || "Processando...");
						} catch (_e) {
							// Ignorar erros de parse
						}
					} else if (eventType === "workout_progress" && data) {
						try {
							const workoutData = JSON.parse(data) as {
								workout: PreviewWorkout;
								index?: number;
							};
							const workout = workoutData.workout;
							const workoutIdx =
								typeof workoutData.index === "number"
									? workoutData.index
									: receivedWorkouts.length;
							receivedWorkouts.push(workout);

							// Atualizar estado progressivamente
							setPreviewWorkouts([...receivedWorkouts]);

							// Adicionar mensagem com componente de workout (sem filtrar workouts anteriores)
							setMessages((prev) => {
								return [
									...prev,
									{
										role: "assistant",
										content: "",
										timestamp: new Date(),
										workoutPreview: workout,
										workoutPreviewIndex: workoutIdx,
									},
								];
							});
						} catch (e) {
							console.error("Erro ao parsear workout progress:", e);
						}
					} else if (eventType === "complete" && data) {
						try {
							parsedData = JSON.parse(data) as ParsedWorkoutPlanWithMeta;
							setAllWorkoutsComplete(true);
						} catch (e) {
							console.error("Erro ao parsear dados completos:", e);
						}
					} else if (eventType === "error" && data) {
						try {
							const errorData = JSON.parse(data);
							throw new Error(
								errorData.error || errorData.message || "Erro desconhecido",
							);
						} catch (error) {
							if (
								error instanceof Error &&
								!error.message.includes("Erro desconhecido")
							) {
								throw error;
							}
						}
					}
				}
			}

			// Se recebeu dados completos, atualizar estado
			if (parsedData) {
				// Se há referência e a ação é update_workout ou replace_exercise
				if (
					reference &&
					(parsedData.action === "update_workout" ||
						parsedData.action === "replace_exercise")
				) {
					// A IA DEVE retornar TODOS os workouts atualizados
					if (parsedData.workouts.length === previewWorkouts.length) {
						// A IA retornou todos os workouts corretamente, substituir completamente os previews
						setPreviewWorkouts(parsedData.workouts);

						// Atualizar também nas mensagens correspondentes
						setMessages((prev) => {
							return prev.map((msg) => {
								if (
									msg.workoutPreview &&
									typeof msg.workoutPreviewIndex === "number"
								) {
									const idx = msg.workoutPreviewIndex;
									const updatedWorkout = parsedData.workouts[idx];
									if (updatedWorkout) {
										return { ...msg, workoutPreview: updatedWorkout };
									}
								}
								return msg;
							});
						});
					} else if (
						parsedData.workouts.length === 1 &&
						previewWorkouts.length > 0
					) {
						// A IA retornou apenas o workout modificado (comportamento incorreto, mas vamos corrigir)
						// Mesclar com previews existentes substituindo apenas o referenciado
						const workoutIndex = reference.workoutIndex;
						const currentPreviews = [...previewWorkouts];

						if (workoutIndex >= 0 && workoutIndex < currentPreviews.length) {
							// Substituir apenas o workout referenciado
							currentPreviews[workoutIndex] = parsedData.workouts[0];
							setPreviewWorkouts(currentPreviews);

							// Atualizar também na mensagem correspondente
							setMessages((prev) => {
								let workoutMsgIndex = 0;
								return prev.map((msg) => {
									if (msg.workoutPreview) {
										if (workoutMsgIndex === workoutIndex) {
											workoutMsgIndex++;
											return {
												...msg,
												workoutPreview: parsedData.workouts[0],
											};
										}
										workoutMsgIndex++;
									}
									return msg;
								});
							});

							// Atualizar parsedData para incluir todos os workouts preservados
							parsedData.workouts = currentPreviews;
						}
					} else {
						// Se a IA retornou número diferente, usar os workouts retornados diretamente
						console.warn(
							`[WorkoutChat] IA retornou ${parsedData.workouts.length} workouts, esperado ${previewWorkouts.length}. Usando os retornados.`,
						);
						setPreviewWorkouts(parsedData.workouts);
					}
				} else if (!reference && parsedData.workouts.length > 0) {
					// Sem referência, atualizar todos os previews normalmente
					setPreviewWorkouts(parsedData.workouts);
				}

				// Remover mensagem de status temporária se existir (apenas se não tiver workoutPreview)
				setMessages((prev) => {
					// Encontrar e remover apenas mensagens de status sem workoutPreview
					return prev.filter((msg, idx) => {
						// Manter todas as mensagens que têm workoutPreview
						if (msg.workoutPreview) return true;
						// Manter mensagens do usuário
						if (msg.role === "user") return true;
						// Remover apenas mensagens de status temporárias (sem workoutPreview)
						// Verificar se é a mensagem de status que queremos remover
						if (
							statusMessageId !== null &&
							idx === statusMessageId &&
							!msg.workoutPreview
						) {
							return false;
						}
						return true;
					});
				});

				setConversationHistory((prev) => [
					...prev,
					{
						role: "assistant",
						content: parsedData.message || "Treino gerado com sucesso!",
					},
				]);

				// Atualizar mensagens restantes
				if (parsedData.remainingMessages !== undefined) {
					setRemainingMessages(parsedData.remainingMessages);
				}

				// Armazenar dados completos para processamento posterior (quando aprovar)
				// parsedData.workouts já foi atualizado acima com todos os previews preservados
				setPendingWorkoutData(parsedData);
			}
		} catch (error: unknown) {
			console.error("[WorkoutChat] Erro:", error);

			// Tratar erros específicos
			if (
				error instanceof Error &&
				(error.message.includes("429") || error.message.includes("limite"))
			) {
				const errorMessage: ChatMessage = {
					role: "assistant",
					content:
						"Você atingiu o limite de 20 mensagens por dia. Tente novamente amanhã.",
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, errorMessage]);
			} else {
				const fallbackMessage =
					error instanceof Error
						? error.message
						: "Desculpe, ocorreu um erro. Tente novamente.";
				const errorMessage: ChatMessage = {
					role: "assistant",
					content: fallbackMessage,
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, errorMessage]);
			}
		} finally {
			setIsProcessing(false);
		}
	};

	// REMOVIDO: handleConfirmAction não é mais necessário
	// Todo processamento é feito automaticamente no servidor após a IA responder

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
				className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
				onClick={onClose}
			>
				<motion.div
					initial={{ y: "100%", opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: "100%", opacity: 0 }}
					transition={{
						type: "spring",
						damping: 25,
						stiffness: 300,
						duration: 0.3,
					}}
					className="w-full max-w-2xl rounded-t-3xl bg-white sm:rounded-3xl"
					onClick={(e) => e.stopPropagation()}
					style={{
						maxHeight: "90vh",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{/* Header */}
					<div className="border-b-2 border-gray-300 p-6">
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Sparkles className="h-5 w-5 text-duo-green" />
								<h2 className="text-2xl font-bold text-gray-900">
									Chat IA - Treinos
								</h2>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
							>
								✕
							</button>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								size="sm"
								variant="secondary"
								onClick={handleExportWorkouts}
							>
								Exportar treino
							</Button>
							<span className="text-xs text-gray-600">
								Cole o JSON aqui para importar; o chat aplica automaticamente.
							</span>
						</div>
						{remainingMessages !== null && remainingMessages >= 0 && (
							<div className="mt-2 text-xs">
								{remainingMessages > 0 ? (
									<span className="text-duo-green font-bold">
										{remainingMessages} mensagem
										{remainingMessages !== 1 ? "s" : ""} restante
										{remainingMessages !== 1 ? "s" : ""} hoje
									</span>
								) : (
									<span className="text-red-600 font-bold">
										Limite diário atingido. Tente novamente amanhã.
									</span>
								)}
							</div>
						)}
					</div>

					{/* Messages */}
					<div
						className="flex-1 overflow-y-auto p-6 space-y-4"
						style={{ maxHeight: "50vh" }}
					>
						{messages.map((msg, idx) => {
							// Se mensagem tem workoutPreview, renderizar componente
							if (msg.workoutPreview) {
								// Índice fixo salvo no evento SSE; fallback para contagem sequencial
								const workoutIndex =
									typeof msg.workoutPreviewIndex === "number"
										? msg.workoutPreviewIndex
										: messages.slice(0, idx).filter((m) => m.workoutPreview)
												.length;

								return (
									<div
										key={`workout-${idx}-${workoutIndex}-${msg.workoutPreview.title}`}
										className="flex justify-start"
									>
										<div className="w-full max-w-[90%]">
											<WorkoutPreviewCard
												workout={msg.workoutPreview}
												index={workoutIndex}
												onReference={(type, _workoutIdx, exerciseIdx) => {
													const workout = msg.workoutPreview;
													if (workout) {
														const realWorkout = workouts.find(
															(w: WorkoutSession) => w.title === workout.title,
														);
														const workoutIdentifier =
															realWorkout?.id || workout.title;
														const idxFixed = workoutIndex; // usar índice fixo do card

														if (type === "workout") {
															setReference({
																type: "workout",
																workoutTitle: workout.title,
																workoutIndex: idxFixed,
																workoutId: workoutIdentifier,
															});
														} else if (
															type === "exercise" &&
															exerciseIdx !== undefined
														) {
															const exercise = workout.exercises[exerciseIdx];
															if (exercise) {
																setReference({
																	type: "exercise",
																	workoutTitle: workout.title,
																	workoutIndex: idxFixed,
																	workoutId: workoutIdentifier,
																	exerciseName: exercise.name,
																	exerciseIndex: exerciseIdx,
																});
															}
														}
														setTimeout(() => {
															inputRef.current?.focus();
														}, 100);
													}
												}}
											/>
										</div>
									</div>
								);
							}

							// Mensagem de texto normal
							if (!msg.content.trim() && !msg.workoutPreview) {
								return null; // Ignorar mensagens vazias
							}

							return (
								<motion.div
									key={`${msg.role}-${msg.timestamp instanceof Date ? msg.timestamp.getTime() : idx}`}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className={`flex ${
										msg.role === "user" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`max-w-[80%] rounded-2xl px-4 py-3 ${
											msg.role === "user"
												? "bg-duo-green text-white"
												: "bg-gray-100 text-gray-900"
										}`}
									>
										{/* Mostrar referência visual se houver */}
										{msg.reference && (
											<div
												className={`mb-2 pb-2 border-b ${
													msg.role === "user"
														? "border-white/30"
														: "border-gray-300"
												}`}
											>
												<div
													className={`text-xs font-bold ${
														msg.role === "user"
															? "text-white/80"
															: "text-gray-500"
													} uppercase mb-1`}
												>
													{msg.reference.type === "workout"
														? "Referenciando treino"
														: "Referenciando exercício"}
												</div>
												<div
													className={`text-xs ${
														msg.role === "user"
															? "text-white/90"
															: "text-gray-700"
													}`}
												>
													{msg.reference.type === "workout"
														? msg.reference.workoutTitle
														: `${msg.reference.exerciseName} (${msg.reference.workoutTitle})`}
												</div>
											</div>
										)}
										<p className="text-sm">{msg.content}</p>
									</div>
								</motion.div>
							);
						})}

						{/* Botões Aprovar/Refazer quando todos workouts estiverem completos */}
						{allWorkoutsComplete && previewWorkouts.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex gap-3 justify-center mt-4"
							>
								<Button
									onClick={handleApprove}
									disabled={isApproving}
									className="flex items-center gap-2 bg-duo-green hover:bg-duo-green/90 text-white font-bold px-6 py-3 rounded-xl shadow-[0_4px_0_#58A700]"
								>
									{isApproving ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Processando...
										</>
									) : (
										<>
											<Check className="h-4 w-4" />
											Aprovar
										</>
									)}
								</Button>
								<Button
									onClick={handleRefazer}
									disabled={isApproving || isProcessing}
									variant="outline"
									className="flex items-center gap-2 border-2 border-gray-300 hover:bg-gray-50 font-bold px-6 py-3 rounded-xl"
								>
									<RotateCcw className="h-4 w-4" />
									Refazer
								</Button>
							</motion.div>
						)}

						{isProcessing && (
							<div className="flex justify-start">
								<div className="bg-gray-100 rounded-2xl px-4 py-3">
									<Loader2 className="h-4 w-4 animate-spin text-duo-green" />
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Input */}
					<div className="border-t-2 border-gray-300 p-4">
						{remainingMessages !== null && remainingMessages >= 0 && (
							<div className="mb-2 text-xs text-gray-600 text-center">
								{remainingMessages > 0 ? (
									<span className="text-duo-green font-bold">
										{remainingMessages} mensagem
										{remainingMessages !== 1 ? "s" : ""} restante
										{remainingMessages !== 1 ? "s" : ""} hoje
									</span>
								) : (
									<span className="text-red-600 font-bold">
										Limite diário atingido. Tente novamente amanhã.
									</span>
								)}
							</div>
						)}

						{/* Preview da referência (similar ao WhatsApp) */}
						{reference && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="mb-2 rounded-lg border-l-4 border-duo-green bg-duo-green/5 p-3"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-start gap-2 flex-1 min-w-0">
										<MessageSquare className="h-4 w-4 text-duo-green shrink-0 mt-0.5" />
										<div className="flex-1 min-w-0">
											<div className="text-xs font-bold text-duo-green uppercase mb-1">
												{reference.type === "workout"
													? "Referenciando treino"
													: "Referenciando exercício"}
											</div>
											<div className="text-sm font-bold text-gray-900 truncate">
												{reference.type === "workout"
													? reference.workoutTitle
													: `${reference.exerciseName} (${reference.workoutTitle})`}
											</div>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setReference(null)}
										className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
										title="Remover referência"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							</motion.div>
						)}

						<div className="flex gap-2">
							<input
								ref={inputRef}
								type="text"
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSendMessage();
									}
								}}
								placeholder="Descreva o que você quer fazer no treino..."
								className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:border-duo-green focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
								disabled={
									isProcessing ||
									(remainingMessages !== null && remainingMessages <= 0)
								}
							/>
							<button
								type="button"
								onClick={handleSendMessage}
								disabled={
									!inputMessage.trim() ||
									isProcessing ||
									(remainingMessages !== null && remainingMessages <= 0)
								}
								className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
							>
								{isProcessing ? (
									<Loader2 className="h-5 w-5 animate-spin" />
								) : (
									<Send className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>

					{/* REMOVIDO: Botão de confirmação não é mais necessário - processamento é automático */}
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
