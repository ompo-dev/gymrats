"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Play, QrCode } from "lucide-react";
import { ModalContainer } from "@/components/organisms/modals/modal-container";
import { ModalHeader } from "@/components/organisms/modals/modal-header";
import { Button } from "@/components/atoms/buttons/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";

interface StudentMembershipPixModalProps {
	isOpen: boolean;
	onClose: () => void;
	paymentId: string;
	brCode: string;
	brCodeBase64: string;
	amount: number; // centavos
	onPaymentConfirmed?: () => void;
}

export function StudentMembershipPixModal({
	isOpen,
	onClose,
	paymentId,
	brCode,
	brCodeBase64,
	amount,
	onPaymentConfirmed,
}: StudentMembershipPixModalProps) {
	const { toast } = useToast();
	const [isSimulating, setIsSimulating] = useState(false);
	const hasClosedRef = useRef(false);

	const pollPaymentStatus = useCallback(async (): Promise<"paid" | "pending" | "other"> => {
		try {
			const res = await apiClient.get<{ status: string }>(
				`/api/payments/${paymentId}`,
			);
			return res.data.status === "paid" ? "paid" : "pending";
		} catch {
			return "other";
		}
	}, [paymentId]);

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
				`/api/students/payments/${paymentId}/simulate-pix`,
				{},
			);
			toast({
				title: "Pagamento simulado!",
				description: "Aguardando confirmação...",
			});
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: { error?: string } } }).response
							?.data?.error
					: err instanceof Error
						? err.message
						: "Erro ao simular";
			toast({
				variant: "destructive",
				title: "Erro ao simular",
				description: String(msg),
			});
		} finally {
			setIsSimulating(false);
		}
	}, [paymentId, toast]);

	// Poll para detectar pagamento confirmado
	useEffect(() => {
		if (!isOpen) return;

		const checkAndClose = async () => {
			const status = await pollPaymentStatus();
			if (status === "paid" && !hasClosedRef.current) {
				hasClosedRef.current = true;
				onPaymentConfirmed?.();
				onClose();
				toast({
					title: "Pagamento confirmado!",
					description: "Sua matrícula está ativa.",
				});
			}
		};

		const interval = setInterval(() => {
			if (document.visibilityState === "visible") {
				checkAndClose();
			}
		}, 5000);

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") checkAndClose();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, [
		isOpen,
		pollPaymentStatus,
		onClose,
		onPaymentConfirmed,
		toast,
	]);

	const valueReais = (amount / 100).toFixed(2);

	return (
		<ModalContainer isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
			<ModalHeader title="Pagamento PIX" onClose={onClose} />
			<div className="space-y-6 p-6">
				<p className="text-sm text-duo-gray-dark">
					Escaneie o QR Code ou copie o código PIX para pagar no app do seu
					banco.
				</p>

				<div className="flex flex-col items-center gap-4">
					<div className="rounded-xl border-2 border-duo-border bg-white p-4">
						{brCodeBase64 ? (
							<img
								src={
									brCodeBase64.startsWith("data:")
										? brCodeBase64
										: `data:image/png;base64,${brCodeBase64}`
								}
								alt="QR Code PIX"
								className="h-48 w-48 object-contain"
							/>
						) : (
							<div className="flex h-48 w-48 items-center justify-center rounded bg-gray-100">
								<QrCode className="h-24 w-24 text-gray-400" />
							</div>
						)}
					</div>

					<div className="text-center">
						<p className="text-xs text-duo-gray-dark">Valor a pagar</p>
						<p className="text-2xl font-bold text-duo-green">R$ {valueReais}</p>
					</div>

					<Button
						onClick={copyCode}
						variant="outline"
						className="w-full"
						size="sm"
					>
						<Copy className="mr-2 h-4 w-4" />
						Copiar código PIX
					</Button>

					<Button
						onClick={simulatePayment}
						disabled={isSimulating}
						variant="outline"
						className="w-full border-dashed"
						size="sm"
					>
						<Play className="mr-2 h-4 w-4" />
						{isSimulating ? "Simulando..." : "Simular pagamento"}
					</Button>
				</div>

				<p className="text-center text-xs text-duo-gray-dark">
					O pagamento é confirmado automaticamente. Você pode fechar e ir ao app
					do banco — ao voltar aqui, o PIX estará disponível novamente.
				</p>
			</div>
		</ModalContainer>
	);
}
