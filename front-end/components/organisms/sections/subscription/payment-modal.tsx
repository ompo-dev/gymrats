"use client";

import { useState } from "react";
import { CreditCard, Wallet, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { Button } from "@/components/atoms/buttons/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/atoms/inputs/input";
import { Label } from "@/components/molecules/forms/label";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "../subscription-section";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: SubscriptionPlan | null;
  billingPeriod: "monthly" | "annual";
  displayPrice: number | undefined;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export function PaymentModal({
  open,
  onOpenChange,
  selectedPlan,
  billingPeriod,
  displayPrice,
  onConfirm,
  isProcessing,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<
    "pix" | "credit-card" | "debit-card"
  >("pix");
  const [couponCode, setCouponCode] = useState("");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(" ") : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleConfirm = async () => {
    // Validação para cartão
    if (
      (paymentMethod === "credit-card" || paymentMethod === "debit-card") &&
      (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv)
    ) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, preencha todos os dados do cartão",
      });
      return;
    }

    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-2 border-duo-border bg-white p-0">
        <DialogHeader className="p-6 pb-4 border-b-2 border-duo-border">
          <DialogTitle className="text-2xl font-bold text-duo-text">
            Finalizar Assinatura
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Resumo do Plano */}
          <DuoCard variant="highlighted" size="default">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-duo-gray-dark">Plano</span>
                <span className="font-bold text-duo-text capitalize">
                  {selectedPlan?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-duo-gray-dark">Período</span>
                <span className="font-bold text-duo-text">
                  {billingPeriod === "annual" ? "Anual" : "Mensal"}
                </span>
              </div>
              <div className="pt-2 border-t-2 border-duo-border flex items-center justify-between">
                <span className="text-base font-bold text-duo-text">Total</span>
                <span className="text-2xl font-bold text-duo-green">
                  R$ {Math.round(displayPrice || 0).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </DuoCard>

          {/* Método de Pagamento */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-duo-text">
              Método de Pagamento
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <DuoCard
                variant={paymentMethod === "pix" ? "highlighted" : "default"}
                size="md"
                className={cn(
                  "cursor-pointer transition-all text-center",
                  paymentMethod === "pix"
                    ? "border-duo-green bg-duo-green/10"
                    : "hover:border-duo-green/50"
                )}
                onClick={() => setPaymentMethod("pix")}
              >
                <QrCode className="mx-auto mb-2 h-8 w-8 text-duo-green" />
                <div className="text-xs font-bold text-duo-text">PIX</div>
              </DuoCard>

              <DuoCard
                variant={
                  paymentMethod === "credit-card" ? "highlighted" : "default"
                }
                size="md"
                className={cn(
                  "cursor-pointer transition-all text-center",
                  paymentMethod === "credit-card"
                    ? "border-duo-green bg-duo-green/10"
                    : "hover:border-duo-green/50"
                )}
                onClick={() => setPaymentMethod("credit-card")}
              >
                <CreditCard className="mx-auto mb-2 h-8 w-8 text-duo-blue" />
                <div className="text-xs font-bold text-duo-text">Crédito</div>
              </DuoCard>

              <DuoCard
                variant={
                  paymentMethod === "debit-card" ? "highlighted" : "default"
                }
                size="md"
                className={cn(
                  "cursor-pointer transition-all text-center",
                  paymentMethod === "debit-card"
                    ? "border-duo-green bg-duo-green/10"
                    : "hover:border-duo-green/50"
                )}
                onClick={() => setPaymentMethod("debit-card")}
              >
                <Wallet className="mx-auto mb-2 h-8 w-8 text-duo-purple" />
                <div className="text-xs font-bold text-duo-text">Débito</div>
              </DuoCard>
            </div>
          </div>

          {/* Dados do Cartão (se selecionado) */}
          {(paymentMethod === "credit-card" ||
            paymentMethod === "debit-card") && (
            <div className="space-y-4 pt-2 border-t-2 border-duo-border">
              <div className="space-y-2">
                <Label htmlFor="card-number" className="text-sm font-bold">
                  Número do Cartão
                </Label>
                <Input
                  id="card-number"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardData.number}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value);
                    setCardData({ ...cardData, number: formatted });
                  }}
                  className="h-12 border-2 border-duo-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-name" className="text-sm font-bold">
                  Nome no Cartão
                </Label>
                <Input
                  id="card-name"
                  type="text"
                  placeholder="Nome completo"
                  value={cardData.name}
                  onChange={(e) =>
                    setCardData({ ...cardData, name: e.target.value })
                  }
                  className="h-12 border-2 border-duo-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="card-expiry" className="text-sm font-bold">
                    Validade
                  </Label>
                  <Input
                    id="card-expiry"
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value);
                      setCardData({ ...cardData, expiry: formatted });
                    }}
                    className="h-12 border-2 border-duo-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-cvv" className="text-sm font-bold">
                    CVV
                  </Label>
                  <Input
                    id="card-cvv"
                    type="text"
                    placeholder="000"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        cvv: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="h-12 border-2 border-duo-border"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cupom de Desconto */}
          <div className="space-y-2 pt-2 border-t-2 border-duo-border">
            <Label htmlFor="coupon" className="text-sm font-bold">
              Cupom de Desconto (opcional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                type="text"
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="h-12 flex-1 border-2 border-duo-border"
              />
              <Button
                variant="outline"
                size="lg"
                disabled={!couponCode.trim()}
                onClick={() => {
                  // TODO: Validar cupom
                  toast({
                    title: "Cupom aplicado",
                    description: "Cupom aplicado com sucesso!",
                  });
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 border-t-2 border-duo-border gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1"
            size="lg"
          >
            {isProcessing
              ? "Processando..."
              : paymentMethod === "pix"
              ? "Gerar QR Code PIX"
              : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
