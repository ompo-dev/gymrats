"use client";

import { Copy, Play, QrCode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DuoButton } from "@/components/duo";
import { Modal } from "@/components/organisms/modals/modal";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";

/** Config para detecção via check assíncrono (payment, boost) */
export interface PixQrModalPollCheckConfig {
  type: "check";
  /** Retorna true quando pagamento confirmado */
  check: () => Promise<boolean>;
  intervalMs?: number;
  maxDurationMs?: number;
}

/** Config para detecção via status de assinatura (parent refetch + status) */
export interface PixQrModalPollSubscriptionConfig {
  type: "subscription";
  refetch: () => Promise<unknown>;
  currentStatus?: string;
  initialStatus?: string;
  targetStatus?: string;
  intervalMs?: number;
}

export type PixQrModalPollConfig =
  | PixQrModalPollCheckConfig
  | PixQrModalPollSubscriptionConfig;

export interface PixQrModalValueSlot {
  label?: string;
  strikethrough?: number; // centavos (preço original)
  badge?: { code: string; discountString: string };
}

/** Bloco de conteúdo QR (para composition em outros modais) */
export interface PixQrBlockProps {
  brCode: string;
  brCodeBase64: string;
  amount: number;
  valueSlot?: PixQrModalValueSlot;
  simulatePixUrl?: string;
  onSimulateSuccess?: () => Promise<void>;
  onCopy?: () => void;
  /** ISO date-time. Se informado, exibe countdown; ao expirar mostra "PIX expirado". */
  expiresAt?: string;
}

export interface PixQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Dados PIX (obrigatório - gerar antes de abrir o modal). */
  brCode: string;
  brCodeBase64: string;
  amount: number; // centavos
  /** Slot customizado para exibição do valor */
  valueSlot?: PixQrModalValueSlot;
  /** URL para simular pagamento. Se não informado, botão de simular não aparece */
  simulatePixUrl?: string;
  /** Callback após simular (ex: refetch) */
  onSimulateSuccess?: () => Promise<void>;
  /** Config de polling para detectar pagamento confirmado */
  pollConfig?: PixQrModalPollConfig;
  onPaymentConfirmed?: () => void;
  paymentConfirmedToast?: { title: string; description: string };
  /** Classes extras no container */
  className?: string;
  /** ISO date-time. Se informado, exibe countdown; ao expirar mostra "PIX expirado". */
  expiresAt?: string;
}

/** Retorna segundos restantes e se está expirado */
function usePixCountdown(expiresAt?: string | null) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(null);
      return;
    }
    const update = () => {
      const now = Date.now();
      const end = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setSecondsRemaining(diff);
      return diff;
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isExpired = secondsRemaining !== null && secondsRemaining <= 0;
  return { secondsRemaining, isExpired };
}

/** Formata segundos como MM:SS */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Bloco reutilizável: QR + valor + copiar + simular (sem modal) */
export function PixQrBlock({
  brCode,
  brCodeBase64,
  amount,
  valueSlot,
  simulatePixUrl,
  onSimulateSuccess,
  onCopy,
  expiresAt,
}: PixQrBlockProps) {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const { secondsRemaining, isExpired } = usePixCountdown(expiresAt);
  const valueReais = (amount / 100).toFixed(2);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(brCode);
    toast({
      title: "Código copiado!",
      description: "Cole no app do seu banco para pagar via PIX.",
    });
    onCopy?.();
  }, [brCode, toast, onCopy]);

  const simulatePayment = useCallback(async () => {
    if (!simulatePixUrl) return;
    setIsSimulating(true);
    try {
      await apiClient.post(simulatePixUrl, {});
      toast({
        title: "Pagamento simulado!",
        description: "Aguardando confirmação...",
      });
      await onSimulateSuccess?.();
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
  }, [simulatePixUrl, onSimulateSuccess, toast]);

  return (
    <>
      {/* Cronômetro acima do texto */}
      {!isExpired && secondsRemaining !== null && (
        <p className="text-center text-sm font-medium text-duo-fg">
          Expira em{" "}
          <span className="font-mono text-base font-bold text-duo-accent">
            {formatCountdown(secondsRemaining)}
          </span>
        </p>
      )}
      {isExpired ? (
        <p className="text-sm font-medium text-duo-accent">
          PIX expirado. Gere um novo para pagar.
        </p>
      ) : (
        <p className="text-sm text-duo-fg-muted">
          Escaneie o QR Code ou copie o código PIX para pagar no app do seu
          banco.
        </p>
      )}
      <div className="flex flex-col items-center gap-4">
        <div className="bg-duo-bg-elevated p-4 rounded-xl border-2 border-duo-border">
          {brCodeBase64 ? (
            <img
              src={
                brCodeBase64.startsWith("data:")
                  ? brCodeBase64
                  : `data:image/png;base64,${brCodeBase64}`
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
        <div className="w-full text-center space-y-1">
          {valueSlot?.label ? (
            <p className="text-sm font-bold text-duo-fg">{valueSlot.label}</p>
          ) : (
            <p className="text-xs text-duo-fg-muted">Valor a pagar</p>
          )}
          {valueSlot?.strikethrough != null && valueSlot.strikethrough > amount && (
            <p className="text-xs text-duo-gray-dark font-semibold line-through">
              De R$ {(valueSlot.strikethrough / 100).toFixed(2)}
            </p>
          )}
          <p className="text-2xl font-bold text-duo-green">R$ {valueReais}</p>
          {valueSlot?.badge && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-duo-green bg-duo-green/10 px-2.5 py-1 text-xs font-bold text-duo-green">
                <span>Cupom: {valueSlot.badge.code}</span>
                <span className="opacity-60">•</span>
                <span>-{valueSlot.badge.discountString}</span>
            </div>
          )}
        </div>
        <DuoButton
          onClick={copyCode}
          variant="outline"
          className="w-full"
          size="sm"
          disabled={isExpired}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar código PIX
        </DuoButton>
        {simulatePixUrl && (
          <DuoButton
            onClick={simulatePayment}
            disabled={isSimulating || isExpired}
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
        O pagamento é confirmado automaticamente. Você pode fechar e ir ao app
        do banco — ao voltar aqui, o PIX estará disponível novamente.
      </p>
    </>
  );
}

/**
 * Modal de QR Code PIX. Sempre exibe o QR — o PIX deve ser gerado antes de abrir.
 */
export function PixQrModal({
  isOpen,
  onClose,
  title = "Pagamento PIX",
  brCode,
  brCodeBase64,
  amount,
  valueSlot,
  simulatePixUrl,
  onSimulateSuccess,
  pollConfig,
  onPaymentConfirmed,
  paymentConfirmedToast = {
    title: "Pagamento confirmado!",
    description: "Seu pagamento foi processado.",
  },
  className,
  expiresAt,
}: PixQrModalProps) {
  const { toast } = useToast();
  const hasClosedRef = useRef(false);

  // Poll tipo "check" (payment, boost)
  useEffect(() => {
    if (
      !isOpen ||
      !pollConfig ||
      pollConfig.type !== "check" ||
      !onPaymentConfirmed
    )
      return;

    const { check, intervalMs = 8000, maxDurationMs = 20 * 60 * 1000 } =
      pollConfig;
    const startedAt = Date.now();

    const checkAndClose = async () => {
      if (Date.now() - startedAt > maxDurationMs || hasClosedRef.current)
        return;
      try {
        const confirmed = await check();
        if (confirmed && !hasClosedRef.current) {
          hasClosedRef.current = true;
          onPaymentConfirmed();
          onClose();
          toast({
            title: paymentConfirmedToast.title,
            description: paymentConfirmedToast.description,
          });
        }
      } catch {
        // Silencioso
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") checkAndClose();
    }, intervalMs);

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
    pollConfig,
    onPaymentConfirmed,
    onClose,
    toast,
    paymentConfirmedToast,
  ]);

  // Poll tipo "subscription" (refetch + currentStatus)
  useEffect(() => {
    if (
      !isOpen ||
      !pollConfig ||
      pollConfig.type !== "subscription" ||
      !onPaymentConfirmed
    )
      return;

    const {
      refetch,
      currentStatus,
      initialStatus = "pending",
      targetStatus = "active",
      intervalMs = 8000,
    } = pollConfig;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isOpen, pollConfig]);

  // Fechar quando subscription ficar active
  useEffect(() => {
    if (
      !pollConfig ||
      pollConfig.type !== "subscription" ||
      hasClosedRef.current ||
      !isOpen ||
      !onPaymentConfirmed
    )
      return;

    const { currentStatus, initialStatus = "pending", targetStatus = "active" } =
      pollConfig;
    if (
      currentStatus === targetStatus &&
      initialStatus !== targetStatus
    ) {
      hasClosedRef.current = true;
      onPaymentConfirmed();
      onClose();
      toast({
        title: paymentConfirmedToast.title,
        description: paymentConfirmedToast.description,
      });
    }
  }, [
    isOpen,
    pollConfig,
    onPaymentConfirmed,
    onClose,
    toast,
    paymentConfirmedToast,
  ]);

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <Modal.Header title={title} onClose={onClose} />
      <div className={`space-y-6 p-6 bg-duo-bg-card ${className ?? ""}`}>
        <PixQrBlock
          brCode={brCode}
          brCodeBase64={brCodeBase64}
          amount={amount}
          expiresAt={expiresAt}
          valueSlot={valueSlot}
          simulatePixUrl={simulatePixUrl}
          onSimulateSuccess={onSimulateSuccess}
        />
      </div>
    </Modal.Root>
  );
}
