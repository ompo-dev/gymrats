"use client";

import { Copy, Play, QrCode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DuoButton, DuoInput } from "@/components/duo";
import { Modal } from "@/components/organisms/modals/modal";
import { useToast } from "@/hooks/use-toast";
import { usePaymentsStore } from "@/stores/payments-store";

/** Config para detecção via check assíncrono (payment, boost) */
export interface PixQrModalPollCheckConfig {
  type: "check";
  /** Retorna true quando pagamento confirmado */
  check: () => Promise<boolean>;
  intervalMs?: number;
  backoffMs?: number[];
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
  /** Chamado ao fechar pelo usuário (X ou clique fora). Use para cancelar cobrança PIX. Não é chamado em F5/navegação nem ao fechar após pagamento confirmado. */
  onCancelPayment?: () => void | Promise<void>;
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
  /** Slot para aplicar indicação (gym): @ + Aplicar, gera novo PIX com 5% desconto */
  referralSlot?: {
    onApplyReferral: (referralCode: string) => Promise<
      | {
          pixId: string;
          brCode: string;
          brCodeBase64: string;
          amount: number;
          expiresAt?: string;
        }
      | { error: string; referralCodeInvalid?: boolean }
    >;
  };
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
  const simulatePix = usePaymentsStore((state) => state.simulatePix);
  const isSimulating = usePaymentsStore((state) =>
    simulatePixUrl ? !!state.simulatingByUrl[simulatePixUrl] : false,
  );
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
    try {
      await simulatePix(simulatePixUrl);
      toast({
        title: "Pagamento simulado!",
        description: "Aguardando confirmação...",
      });
      await onSimulateSuccess?.();
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
    }
  }, [onSimulateSuccess, simulatePix, simulatePixUrl, toast]);

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
          {valueSlot?.strikethrough != null &&
            valueSlot.strikethrough > amount && (
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
  onCancelPayment,
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
  referralSlot,
}: PixQrModalProps) {
  const { toast } = useToast();
  const hasClosedRef = useRef(false);
  const [referralCode, setReferralCode] = useState("");
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const checkPollConfig = pollConfig?.type === "check" ? pollConfig : null;
  const subscriptionPollConfig =
    pollConfig?.type === "subscription" ? pollConfig : null;
  const checkPoll = checkPollConfig?.check;
  const checkPollIntervalMs = checkPollConfig?.intervalMs;
  const checkPollBackoffSignature = checkPollConfig?.backoffMs?.join(",") ?? "";
  const checkPollMaxDurationMs = checkPollConfig?.maxDurationMs;
  const paymentConfirmedTitle = paymentConfirmedToast.title;
  const paymentConfirmedDescription = paymentConfirmedToast.description;

  useEffect(() => {
    if (!isOpen) {
      hasClosedRef.current = false;
    }
  }, [isOpen]);

  /** Fechamento pelo usuário (X ou clique fora): cancela cobrança e depois fecha. Não usado ao fechar após pagamento confirmado. */
  const handleUserClose = useCallback(async () => {
    try {
      await onCancelPayment?.();
    } finally {
      onClose();
    }
  }, [onCancelPayment, onClose]);

  // Poll tipo "check" (payment, boost)
  useEffect(() => {
    if (!isOpen || !checkPoll || !onPaymentConfirmed) return;

    const check = checkPoll;
    const intervalMs = checkPollIntervalMs ?? 8000;
    const backoffMs =
      checkPollBackoffSignature.length > 0
        ? checkPollBackoffSignature
            .split(",")
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value))
        : [2000, 5000, 10000];
    const maxDurationMs = checkPollMaxDurationMs ?? 20 * 60 * 1000;
    const startedAt = Date.now();
    let timeoutId: number | null = null;
    let attempt = 0;
    let cancelled = false;

    const checkAndClose = async () => {
      if (Date.now() - startedAt > maxDurationMs || hasClosedRef.current)
        return true;
      try {
        const confirmed = await check();
        if (confirmed && !hasClosedRef.current) {
          hasClosedRef.current = true;
          onPaymentConfirmed();
          onClose();
          toast({
            title: paymentConfirmedTitle,
            description: paymentConfirmedDescription,
          });
          return true;
        }
      } catch {
        // Silencioso
      }
      return false;
    };

    const scheduleNextPoll = () => {
      if (cancelled || hasClosedRef.current) {
        return;
      }

      const nextDelay =
        backoffMs[Math.min(attempt, backoffMs.length - 1)] ?? intervalMs;
      timeoutId = window.setTimeout(async () => {
        if (document.visibilityState !== "visible") {
          scheduleNextPoll();
          return;
        }

        const confirmed = await checkAndClose();
        if (!confirmed) {
          attempt += 1;
          scheduleNextPoll();
        }
      }, nextDelay);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        attempt = 0;
        void checkAndClose().then((confirmed) => {
          if (!confirmed) {
            if (timeoutId != null) {
              window.clearTimeout(timeoutId);
            }
            scheduleNextPoll();
          }
        });
      }
    };

    scheduleNextPoll();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    isOpen,
    checkPoll,
    checkPollIntervalMs,
    checkPollBackoffSignature,
    checkPollMaxDurationMs,
    onPaymentConfirmed,
    onClose,
    toast,
    paymentConfirmedTitle,
    paymentConfirmedDescription,
  ]);

  // Poll tipo "subscription" (refetch + currentStatus)
  useEffect(() => {
    if (!isOpen || !subscriptionPollConfig || !onPaymentConfirmed) return;

    const refetch = subscriptionPollConfig.refetch;
    const intervalMs = subscriptionPollConfig.intervalMs ?? 8000;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    isOpen,
    onPaymentConfirmed,
    subscriptionPollConfig?.refetch,
    subscriptionPollConfig?.intervalMs,
  ]);

  // Fechar quando subscription ficar active
  useEffect(() => {
    if (
      !subscriptionPollConfig ||
      hasClosedRef.current ||
      !isOpen ||
      !onPaymentConfirmed
    )
      return;

    const currentStatus = subscriptionPollConfig.currentStatus;
    const initialStatus = subscriptionPollConfig.initialStatus ?? "pending";
    const targetStatus = subscriptionPollConfig.targetStatus ?? "active";

    if (currentStatus === targetStatus && initialStatus !== targetStatus) {
      hasClosedRef.current = true;
      onPaymentConfirmed();
      onClose();
      toast({
        title: paymentConfirmedTitle,
        description: paymentConfirmedDescription,
      });
    }
  }, [
    isOpen,
    subscriptionPollConfig?.currentStatus,
    subscriptionPollConfig?.initialStatus,
    subscriptionPollConfig?.targetStatus,
    onPaymentConfirmed,
    onClose,
    toast,
    paymentConfirmedTitle,
    paymentConfirmedDescription,
  ]);

  const handleApplyReferral = useCallback(async () => {
    if (!referralSlot?.onApplyReferral || !referralCode.trim()) return;
    setIsApplyingReferral(true);
    try {
      const result = await referralSlot.onApplyReferral(referralCode.trim());
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: result.referralCodeInvalid
            ? "Código inválido"
            : "Erro ao aplicar",
          description: result.error,
        });
      } else {
        toast({
          title: "Desconto aplicado!",
          description: "5% de desconto. O valor foi atualizado.",
        });
        setReferralCode("");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aplicar a indicação.",
      });
    } finally {
      setIsApplyingReferral(false);
    }
  }, [referralSlot, referralCode, toast]);

  return (
    <Modal.Root isOpen={isOpen} onClose={handleUserClose} maxWidth="max-w-sm">
      <Modal.Header title={title} onClose={handleUserClose} />
      <div className={`space-y-6 p-6 bg-duo-bg-card ${className ?? ""}`}>
        {referralSlot && (
          <div className="space-y-2 rounded-xl border border-duo-border bg-duo-bg p-3">
            <p className="text-sm font-medium text-duo-fg">
              Foi indicado por um aluno? Ganhe 5% de desconto
            </p>
            <div className="flex gap-2">
              <DuoInput.Simple
                placeholder="@usuario"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="flex-1"
              />
              <DuoButton
                onClick={handleApplyReferral}
                disabled={isApplyingReferral || !referralCode.trim()}
                size="sm"
              >
                {isApplyingReferral ? "Aplicando..." : "Aplicar"}
              </DuoButton>
            </div>
          </div>
        )}
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
