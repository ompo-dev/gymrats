"use client";

import { Calendar, Gift, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { createGymCoupon, deleteGymCoupon } from "@/app/gym/actions";
import {
  createPersonalCoupon,
  deletePersonalCoupon,
} from "@/app/personal/actions";
import { DeleteConfirmationModal } from "@/components/organisms/modals/delete-confirmation-modal";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { useToast } from "@/hooks/use-toast";
import type { Coupon } from "@/lib/types";
import { formatCurrencyInput, parseCurrencyBR } from "@/lib/utils/currency";
import { toValidDate } from "@/lib/utils/date-safe";

interface FinancialCouponsTabProps {
  coupons?: Coupon[];
  variant?: "gym" | "personal";
}

export function FinancialCouponsTab({
  coupons = [],
  variant = "gym",
}: FinancialCouponsTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [discountKind, setDiscountKind] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE",
  );
  const [discount, setDiscount] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const handleDiscountChange = useCallback(
    (value: string) => {
      if (discountKind === "FIXED") {
        setDiscount(formatCurrencyInput(value));
      } else {
        const num = Number.parseFloat(value.replace(",", "."));
        if (value === "" || (!Number.isNaN(num) && num >= 0 && num <= 100)) {
          setDiscount(value);
        }
      }
    },
    [discountKind],
  );
  const [maxRedeems, setMaxRedeems] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [confirmDeleteCouponId, setConfirmDeleteCouponId] = useState<
    string | null
  >(null);

  const discountNum =
    discountKind === "FIXED"
      ? parseCurrencyBR(discount)
      : Number.parseFloat(discount.replace(",", "."));

  const handleCreate = async () => {
    const codeTrim = code.trim().toUpperCase();
    if (!codeTrim) {
      toast({ variant: "destructive", title: "Informe o código do cupom" });
      return;
    }
    if (Number.isNaN(discountNum) || discountNum <= 0) {
      toast({ variant: "destructive", title: "Informe o valor do desconto" });
      return;
    }
    if (discountKind === "PERCENTAGE" && discountNum > 100) {
      toast({ variant: "destructive", title: "Porcentagem deve ser até 100%" });
      return;
    }
    let parsedExpiresAt: Date | undefined;
    if (expiryDate) {
      const parsed = new Date(`${expiryDate}T23:59:59.999`);
      if (Number.isNaN(parsed.getTime())) {
        toast({
          variant: "destructive",
          title: "Data de validade inv\u00e1lida",
        });
        return;
      }
      parsedExpiresAt = parsed;
    }

    setIsSubmitting(true);
    try {
      const createFn =
        variant === "personal" ? createPersonalCoupon : createGymCoupon;
      const result = await createFn({
        code: codeTrim,
        notes: notes.trim() || codeTrim,
        discountKind,
        discount:
          discountKind === "FIXED" ? parseCurrencyBR(discount) : discountNum,
        maxRedeems: maxRedeems.trim()
          ? Math.max(-1, Math.floor(Number(maxRedeems)))
          : undefined,
        expiresAt: parsedExpiresAt ?? null,
      });
      if (result.success) {
        toast({
          title: "Cupom criado",
          description: `${codeTrim} disponível para uso.`,
        });
        setModalOpen(false);
        setCode("");
        setNotes("");
        setDiscount("");
        setMaxRedeems("");
        setExpiryDate("");
        router.refresh();
      } else {
        toast({ variant: "destructive", title: result.error });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxUsesDisplay = (c: Coupon) =>
    c.maxUses >= 999999 ? "Ilimitado" : c.maxUses;

  const handleConfirmDeleteCoupon = async () => {
    if (!confirmDeleteCouponId) return;

    const couponId = confirmDeleteCouponId;
    setDeletingCouponId(couponId);
    setConfirmDeleteCouponId(null);
    try {
      const deleteFn =
        variant === "personal" ? deletePersonalCoupon : deleteGymCoupon;
      const result = await deleteFn(couponId);
      if (result.success) {
        toast({ title: "Cupom exclu\u00eddo" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: result.error });
      }
    } finally {
      setDeletingCouponId(null);
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    setConfirmDeleteCouponId(couponId);
  };

  const usagePercent = (c: Coupon) =>
    c.maxUses >= 999999 ? 0 : Math.min(100, (c.currentUses / c.maxUses) * 100);

  return (
    <>
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Gift
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-duo-fg">Cupons</h2>
          </div>
          <DuoButton size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo cupom
          </DuoButton>
        </DuoCard.Header>
        <div className="space-y-3">
          {(coupons ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-duo-gray-dark">
              Nenhum cupom cadastrado. Crie um para oferecer descontos.
            </p>
          )}
          {(coupons ?? []).map((coupon) => (
            <DuoCard.Root
              key={coupon.id}
              variant="yellow"
              size="default"
              className="border-duo-yellow bg-duo-yellow/10"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-duo-yellow" />
                  <div className="rounded-lg bg-duo-yellow/20 px-3 py-1 font-mono text-sm font-bold text-duo-yellow">
                    {coupon.code}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {coupon.isActive ? (
                    <div className="rounded-lg bg-duo-green/20 px-2 py-1 text-xs font-bold text-duo-green">
                      Ativo
                    </div>
                  ) : (
                    <div className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-bold text-red-400">
                      Inativo
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    disabled={
                      deletingCouponId === coupon.id ||
                      confirmDeleteCouponId === coupon.id
                    }
                    className="rounded-lg p-1 text-duo-gray-dark transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    title="Excluir cupom"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-duo-gray-dark">Desconto</div>
                  <div className="text-lg font-bold text-duo-yellow">
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : `R$ ${Number(coupon.value).toFixed(2)}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-duo-gray-dark">Usos</div>
                  <div className="text-sm font-bold text-duo-text">
                    {coupon.currentUses}/{maxUsesDisplay(coupon)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-duo-gray-dark">Validade</div>
                  <div className="text-sm font-bold text-duo-text">
                    {toValidDate(coupon.expiryDate)?.toLocaleDateString(
                      "pt-BR",
                      {
                        day: "2-digit",
                        month: "short",
                      },
                    ) || "—"}
                  </div>
                </div>
              </div>

              {coupon.maxUses < 999999 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-duo-yellow"
                    style={{ width: `${usagePercent(coupon)}%` }}
                  />
                </div>
              )}
            </DuoCard.Root>
          ))}
        </div>
      </DuoCard.Root>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <DuoCard.Root className="w-full max-w-sm">
            <DuoCard.Header>
              <h3 className="font-bold">Novo cupom</h3>
            </DuoCard.Header>
            <div className="space-y-3">
              <DuoInput.Simple
                label="Código"
                placeholder="EX: PROMO20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <DuoInput.Simple
                label="Descrição (opcional)"
                placeholder="Ex: Desconto para campanha"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <DuoSelect.Simple
                label="Tipo de desconto"
                options={[
                  { value: "PERCENTAGE", label: "Porcentagem (%)" },
                  { value: "FIXED", label: "Valor fixo (R$)" },
                ]}
                value={discountKind}
                onChange={(v) => {
                  setDiscountKind(v as "PERCENTAGE" | "FIXED");
                  setDiscount("");
                }}
              />
              <DuoInput.Simple
                label={
                  discountKind === "PERCENTAGE"
                    ? "Desconto (%) - máx. 100"
                    : "Desconto (R$)"
                }
                type={discountKind === "PERCENTAGE" ? "number" : "text"}
                inputMode={discountKind === "FIXED" ? "decimal" : "numeric"}
                placeholder={discountKind === "PERCENTAGE" ? "20" : "R$ 0,00"}
                value={discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                {...(discountKind === "PERCENTAGE" &&
                  ({
                    min: 0,
                    max: 100,
                    step: 0.01,
                  } as React.InputHTMLAttributes<HTMLInputElement>))}
              />
              <DuoInput.Simple
                label="Máximo de usos (vazio = ilimitado)"
                type="text"
                inputMode="numeric"
                placeholder="Ilimitado"
                value={maxRedeems}
                onChange={(e) => setMaxRedeems(e.target.value)}
              />
              <DuoInput.Simple
                label="Data limite de uso (opcional)"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
              <div className="flex gap-2">
                <DuoButton
                  variant="secondary"
                  fullWidth
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </DuoButton>
                <DuoButton
                  variant="primary"
                  fullWidth
                  onClick={handleCreate}
                  isLoading={isSubmitting}
                >
                  Criar
                </DuoButton>
              </div>
            </div>
          </DuoCard.Root>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={confirmDeleteCouponId !== null}
        onConfirm={handleConfirmDeleteCoupon}
        onCancel={() => setConfirmDeleteCouponId(null)}
        title="Excluir cupom?"
        message="Deseja excluir este cupom? Esta ação não pode ser desfeita."
      />
    </>
  );
}
