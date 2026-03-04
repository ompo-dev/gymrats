"use client";

import { useEffect, useState } from "react";
import { DuoButton } from "@/components/duo";
import { Modal } from "@/components/organisms/modals/modal";
import { PixQrBlock } from "@/components/organisms/modals/pix-qr-modal";
import { useToast } from "@/hooks/use-toast";

export interface ReferralPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amountReais: number;
  isFirstPayment: boolean;
  onGeneratePix: (referralCode: string | null) => Promise<{
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    referralCodeInvalid?: boolean;
  } | null>;
  isLoading?: boolean;
  /** Quando o PIX já foi gerado */
  pixData?: {
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    referralCodeInvalid?: boolean;
  } | null;
  refetchSubscription?: () => Promise<unknown>;
  subscriptionStatus?: string;
  onPaymentConfirmed?: () => void;
  simulatePixUrl?: string;
}

/** Modal unificado: campo @ e QR code PIX no mesmo modal. */
export function ReferralPixModal({
  isOpen,
  onClose,
  planName,
  amountReais,
  isFirstPayment,
  onGeneratePix,
  isLoading = false,
  pixData,
  refetchSubscription,
  subscriptionStatus,
  onPaymentConfirmed,
  simulatePixUrl,
}: ReferralPixModalProps) {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [referralCodeInvalid, setReferralCodeInvalid] = useState(false);

  const resolvedSimulateUrl =
    simulatePixUrl ??
    (pixData
      ? `/api/gym-subscriptions/simulate-pix?pixId=${encodeURIComponent(pixData.pixId)}`
      : "");

  // Ao receber pixData, atualizar flag de @ inválido
  useEffect(() => {
    if (pixData?.referralCodeInvalid) {
      setReferralCodeInvalid(true);
    } else if (pixData) {
      setReferralCodeInvalid(false);
    }
  }, [pixData?.referralCodeInvalid, pixData]);

  useEffect(() => {
    if (!isOpen) {
      setReferralCodeInvalid(false);
    }
  }, [isOpen]);

  // Poll para pagamento confirmado
  useEffect(() => {
    if (!pixData || !refetchSubscription || !isOpen || subscriptionStatus === "active")
      return;
    const interval = setInterval(refetchSubscription, 8000);
    return () => clearInterval(interval);
  }, [pixData, refetchSubscription, isOpen, subscriptionStatus]);

  useEffect(() => {
    if (
      isOpen &&
      pixData &&
      subscriptionStatus === "active" &&
      onPaymentConfirmed
    ) {
      onPaymentConfirmed();
      onClose();
    }
  }, [isOpen, pixData, subscriptionStatus, onPaymentConfirmed, onClose]);

  const handleGeneratePix = async () => {
    setIsGenerating(true);
    setReferralCodeInvalid(false);
    try {
      const code = referralCode.trim() ? referralCode.trim() : null;
      const result = await onGeneratePix(code);
      if (result) {
        if (result.referralCodeInvalid) {
          setReferralCodeInvalid(true);
        }
        toast({
          title: "PIX gerado!",
          description: "Escaneie o QR Code ou copie o código para pagar.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar PIX",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const valueReais = pixData ? (pixData.amount / 100).toFixed(2) : null;

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <Modal.Header title="Pagamento PIX" onClose={onClose} />
      <div className="space-y-6 p-6 bg-duo-bg-card">
        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-duo-fg">{planName}</p>
          <p className="text-2xl font-bold text-duo-green">
            R$ {pixData ? valueReais : amountReais.toFixed(2)}
          </p>
        </div>

        {/* Campo @ - sempre no modal quando primeira vez */}
        {isFirstPayment && (
          <div className="space-y-2 rounded-xl border border-duo-border bg-duo-bg p-4">
            <p className="text-sm font-medium text-duo-fg">
              Foi indicado? Ganhe 5% de desconto (opcional)
            </p>
            <p className="text-xs text-duo-gray-dark">
              Digite o @ do usuário que te indicou (ex: @fulano)
            </p>
            <input
              type="text"
              placeholder="@usuario"
              className="w-full rounded-xl border border-duo-border bg-duo-bg p-3 text-sm focus:border-duo-blue focus:outline-none focus:ring-1 focus:ring-duo-blue"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value);
                setReferralCodeInvalid(false);
              }}
            />
            {referralCodeInvalid && (
              <p className="text-xs text-duo-accent font-medium">
                Não encontramos o @ &quot;{referralCode.trim().startsWith("@") ? referralCode.trim() : `@${referralCode.trim()}`}&quot;. Confira novamente. O pagamento foi gerado sem desconto.
              </p>
            )}
          </div>
        )}

        {/* QR Code (PixQrBlock) ou botão Gerar PIX */}
        {pixData ? (
          <PixQrBlock
            brCode={pixData.brCode}
            brCodeBase64={pixData.brCodeBase64}
            amount={pixData.amount}
            simulatePixUrl={resolvedSimulateUrl || undefined}
            onSimulateSuccess={
              refetchSubscription
                ? () => refetchSubscription().then(() => undefined)
                : undefined
            }
          />
        ) : (
          <DuoButton
            onClick={handleGeneratePix}
            disabled={isGenerating || isLoading}
            className="w-full"
            size="lg"
          >
            {isGenerating || isLoading ? "Gerando PIX..." : "Gerar PIX"}
          </DuoButton>
        )}
      </div>
    </Modal.Root>
  );
}
