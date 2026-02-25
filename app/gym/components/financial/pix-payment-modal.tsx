"use client";

import { useEffect, useCallback } from "react";
import { Copy, QrCode } from "lucide-react";
import { ModalContainer } from "@/components/organisms/modals/modal-container";
import { ModalHeader } from "@/components/organisms/modals/modal-header";
import { Button } from "@/components/atoms/buttons/button";
import { useToast } from "@/hooks/use-toast";

interface PixPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	brCode: string;
	brCodeBase64: string;
	amount: number; // centavos
	onPaymentConfirmed?: () => void;
	refetchSubscription: () => Promise<unknown>;
	subscriptionStatus?: string;
}

export function PixPaymentModal({
	isOpen,
	onClose,
	brCode,
	brCodeBase64,
	amount,
	onPaymentConfirmed,
	refetchSubscription,
	subscriptionStatus,
}: PixPaymentModalProps) {
	const { toast } = useToast();

	const copyCode = useCallback(() => {
		navigator.clipboard.writeText(brCode);
		toast({
			title: "Código copiado!",
			description: "Cole no app do seu banco para pagar via PIX.",
		});
	}, [brCode, toast]);

	// Poll para detectar pagamento confirmado
	useEffect(() => {
		if (!isOpen || subscriptionStatus === "active") return;

		const interval = setInterval(async () => {
			await refetchSubscription();
		}, 5000);

		return () => clearInterval(interval);
	}, [isOpen, refetchSubscription, subscriptionStatus]);

	// Quando status vira active, fechar e notificar
	useEffect(() => {
		if (isOpen && subscriptionStatus === "active") {
			onPaymentConfirmed?.();
			onClose();
			toast({
				title: "Pagamento confirmado!",
				description: "Sua assinatura está ativa.",
			});
		}
	}, [isOpen, subscriptionStatus, onClose, onPaymentConfirmed, toast]);

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
					<div className="bg-white p-4 rounded-xl border-2 border-duo-border">
						{brCodeBase64 ? (
							<img
								src={brCodeBase64.startsWith("data:") ? brCodeBase64 : `data:image/png;base64,${brCodeBase64}`}
								alt="QR Code PIX"
								className="w-48 h-48 object-contain"
							/>
						) : (
							<div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
								<QrCode className="w-24 h-24 text-gray-400" />
							</div>
						)}
					</div>

					<div className="text-center">
						<p className="text-xs text-duo-gray-dark">Valor a pagar</p>
						<p className="text-2xl font-bold text-duo-green">
							R$ {valueReais}
						</p>
					</div>

					<Button
						onClick={copyCode}
						variant="outline"
						className="w-full"
						size="sm"
					>
						<Copy className="w-4 h-4 mr-2" />
						Copiar código PIX
					</Button>
				</div>

				<p className="text-xs text-duo-gray-dark text-center">
					O pagamento é confirmado automaticamente. Esta janela pode ser fechada após pagar.
				</p>
			</div>
		</ModalContainer>
	);
}
