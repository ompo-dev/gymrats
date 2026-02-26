"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Copy, QrCode, Play } from "lucide-react";
import { ModalContainer } from "@/components/organisms/modals/modal-container";
import { ModalHeader } from "@/components/organisms/modals/modal-header";
import { DuoButton } from "@/components/duo";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";

interface PixPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	pixId: string;
	brCode: string;
	brCodeBase64: string;
	amount: number; // centavos
	onPaymentConfirmed?: () => void;
	refetchSubscription: () => Promise<unknown>;
	subscriptionStatus?: string;
	/** Status ao abrir - só fecha quando pending -> active (evita fechar com assinatura já ativa) */
	initialStatus?: string;
}

export function PixPaymentModal({
	isOpen,
	onClose,
	pixId,
	brCode,
	brCodeBase64,
	amount,
	onPaymentConfirmed,
	refetchSubscription,
	subscriptionStatus,
	initialStatus = "pending",
}: PixPaymentModalProps) {
	const { toast } = useToast();
	const [isSimulating, setIsSimulating] = useState(false);
	const hasClosedRef = useRef(false);

	const copyCode = useCallback(() => {
		navigator.clipboard.writeText(brCode);
		toast({
			title: "Código copiado!",
			description: "Cole no app do seu banco para pagar via PIX.",
		});
	}, [brCode, toast]);

	const simulatePayment = useCallback(async () => {
		setIsSimulating(true);
		try {
			await apiClient.post(
				`/api/gym-subscriptions/simulate-pix?pixId=${encodeURIComponent(pixId)}`,
				{},
			);
			toast({
				title: "Pagamento simulado!",
				description: "Aguardando confirmação...",
			});
			await refetchSubscription();
		} catch (err: unknown) {
			const msg = err && typeof err === "object" && "response" in err
				? (err as { response?: { data?: { error?: string } } }).response?.data?.error
				: err instanceof Error ? err.message : "Erro ao simular";
			toast({
				variant: "destructive",
				title: "Erro ao simular",
				description: String(msg),
			});
		} finally {
			setIsSimulating(false);
		}
	}, [pixId, refetchSubscription, toast]);

	// Poll para detectar pagamento confirmado (só quando aba visível, evita requisições em background)
	useEffect(() => {
		if (!isOpen || subscriptionStatus === "active") return;

		const poll = () => {
			refetchSubscription().catch(() => {});
		};

		// Refetch imediato ao voltar para a aba
		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") poll();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);

		const interval = setInterval(() => {
			if (document.visibilityState === "visible") poll();
		}, 8000);

		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, [isOpen, refetchSubscription, subscriptionStatus]);

	// Só fecha quando pending -> active (evita fechar se já tinha assinatura ativa)
	useEffect(() => {
		if (
			hasClosedRef.current ||
			!isOpen ||
			subscriptionStatus !== "active" ||
			initialStatus !== "pending"
		) {
			return;
		}
		hasClosedRef.current = true;
		onPaymentConfirmed?.();
		onClose();
		toast({
			title: "Pagamento confirmado!",
			description: "Sua assinatura está ativa.",
		});
	}, [isOpen, subscriptionStatus, initialStatus, onClose, onPaymentConfirmed, toast]);

	const valueReais = (amount / 100).toFixed(2);

	return (
		<ModalContainer isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
			<ModalHeader
				title="Pagamento PIX"
				onClose={onClose}
			/>
			<div className="p-6 space-y-6">
				<p className="text-sm text-duo-gray-dark">
					Escaneie o QR Code ou copie o código PIX para pagar no app do seu banco.
				</p>

				<div className="flex flex-col items-center gap-4">
					<div className="bg-duo-bg-card p-4 rounded-xl border-2 border-duo-border">
						{brCodeBase64 ? (
							<img
								src={brCodeBase64.startsWith("data:") ? brCodeBase64 : `data:image/png;base64,${brCodeBase64}`}
								alt="QR Code PIX"
								className="w-48 h-48 object-contain"
							/>
						) : (
							<div className="w-48 h-48 flex items-center justify-center bg-duo-bg-elevated rounded">
								<QrCode className="w-24 h-24 text-duo-fg-muted" />
							</div>
						)}
					</div>

					<div className="text-center">
						<p className="text-xs text-duo-gray-dark">Valor a pagar</p>
						<p className="text-2xl font-bold text-duo-green">
							R$ {valueReais}
						</p>
					</div>

					<DuoButton
						onClick={copyCode}
						variant="outline"
						className="w-full"
						size="sm"
					>
						<Copy className="w-4 h-4 mr-2" />
						Copiar código PIX
					</DuoButton>

					<DuoButton
						onClick={simulatePayment}
						disabled={isSimulating}
						variant="outline"
						className="w-full border-dashed"
						size="sm"
					>
						<Play className="w-4 h-4 mr-2" />
						{isSimulating ? "Simulando..." : "Simular pagamento"}
					</DuoButton>
				</div>

				<p className="text-xs text-duo-gray-dark text-center">
					O pagamento é confirmado automaticamente. Você pode fechar e ir ao app do banco — ao voltar aqui, o PIX estará disponível novamente.
				</p>
			</div>
		</ModalContainer>
	);
}
