"use client";

import { Copy, Play, QrCode } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DuoButton } from "@/components/duo";
import { Modal } from "@/components/organisms/modals/modal";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";

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
  const [isSimulating, setIsSimulating] = useState(false);
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

  const copyCode = useCallback(() => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.brCode);
    toast({
      title: "Código copiado!",
      description: "Cole no app do seu banco para pagar via PIX.",
    });
  }, [pixData?.brCode, toast]);

  const simulatePayment = useCallback(async () => {
    if (!pixData || !resolvedSimulateUrl || !refetchSubscription) return;
    setIsSimulating(true);
    try {
      await apiClient.post(resolvedSimulateUrl, {});
      toast({
        title: "Pagamento simulado!",
        description: "Aguardando confirmação...",
      });
      await refetchSubscription();
    } catch (err) {
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
  }, [pixData, resolvedSimulateUrl, refetchSubscription, toast]);

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

        {/* QR Code ou botão Gerar PIX */}
        {pixData ? (
          <>
            <p className="text-sm text-duo-fg-muted">
              Escaneie o QR Code ou copie o código PIX para pagar no app do seu
              banco.
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-duo-bg-elevated p-4 rounded-xl border-2 border-duo-border">
                {pixData.brCodeBase64 ? (
                  <img
                    src={
                      pixData.brCodeBase64.startsWith("data:")
                        ? pixData.brCodeBase64
                        : `data:image/png;base64,${pixData.brCodeBase64}`
                    }
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-duo-bg-elevated rounded">
                    <QrCode className="w-24 h-24 text-duo-fg-muted" />
                  </div>
                )}
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
              {resolvedSimulateUrl && (
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
              )}
            </div>
            <p className="text-xs text-duo-fg-muted text-center">
              O pagamento é confirmado automaticamente. Você pode fechar e ir ao
              app do banco — ao voltar aqui, o PIX estará disponível novamente.
            </p>
          </>
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
