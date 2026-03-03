"use client";

import { Copy, Play, QrCode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DuoButton } from "@/components/duo";
import { Modal } from "@/components/organisms/modals/modal";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";

interface BoostCampaignPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number; // centavos
  onPaymentConfirmed?: () => void;
}

export function BoostCampaignPixModal({
  isOpen,
  onClose,
  campaignId,
  brCode,
  brCodeBase64,
  amount,
  onPaymentConfirmed,
}: BoostCampaignPixModalProps) {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const hasClosedRef = useRef(false);

  const pollStatus = useCallback(async (): Promise<"active" | "pending" | "other"> => {
    try {
      const res = await apiClient.get<{ status: string }>(
        `/api/gym/boost-campaigns/${campaignId}`,
      );
      return res.data.status === "active" ? "active" : "pending";
    } catch {
      return "other";
    }
  }, [campaignId]);

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
        `/api/gym/boost-campaigns/${campaignId}/simulate-pix`,
        {},
      );
      const status = await pollStatus();
      if (status === "active" && !hasClosedRef.current) {
        hasClosedRef.current = true;
        onPaymentConfirmed?.();
        onClose();
        toast({
          title: "Pagamento confirmado!",
          description: "Sua campanha está ativa.",
        });
      } else {
        toast({
          title: "Pagamento simulado!",
          description: "Aguardando confirmação...",
        });
      }
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
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
  }, [campaignId, pollStatus, onPaymentConfirmed, onClose, toast]);

  // Poll a cada 8s enquanto modal estiver aberto
  const MAX_POLL_MS = 20 * 60 * 1000;
  useEffect(() => {
    if (!isOpen) return;
    const startedAt = Date.now();

    const checkAndClose = async () => {
      if (Date.now() - startedAt > MAX_POLL_MS || hasClosedRef.current) return;
      const status = await pollStatus();
      if (status === "active" && !hasClosedRef.current) {
        hasClosedRef.current = true;
        onPaymentConfirmed?.();
        onClose();
        toast({ title: "Campanha ativada!", description: "Pagamento confirmado." });
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") checkAndClose();
    }, 8000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkAndClose();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isOpen, pollStatus, onClose, onPaymentConfirmed, toast]);

  const valueReais = (amount / 100).toFixed(2);

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <Modal.Header title="Pagar Anúncio" onClose={onClose} />
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

          <DuoButton onClick={copyCode} variant="outline" className="w-full" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Copiar código PIX
          </DuoButton>

          <DuoButton
            onClick={simulatePayment}
            disabled={isSimulating}
            variant="outline"
            className="w-full border-dashed"
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            {isSimulating ? "Simulando..." : "Simular pagamento"}
          </DuoButton>
        </div>

        <p className="text-center text-xs text-duo-gray-dark">
          O pagamento é confirmado automaticamente. Você pode fechar e ir ao app
          do banco — ao voltar aqui, o PIX estará disponível novamente.
        </p>
      </div>
    </Modal.Root>
  );
}
