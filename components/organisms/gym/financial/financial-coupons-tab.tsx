"use client";

import { Gift, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGymCoupon } from "@/app/gym/actions";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { useToast } from "@/hooks/use-toast";
import type { Coupon } from "@/lib/types";
import { toValidDate } from "@/lib/utils/date-safe";

interface FinancialCouponsTabProps {
	coupons: Coupon[];
}

export function FinancialCouponsTab({ coupons }: FinancialCouponsTabProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [modalOpen, setModalOpen] = useState(false);
	const [code, setCode] = useState("");
	const [notes, setNotes] = useState("");
	const [discountKind, setDiscountKind] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
	const [discount, setDiscount] = useState("");
	const [maxRedeems, setMaxRedeems] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleCreate = async () => {
		const codeTrim = code.trim().toUpperCase();
		if (!codeTrim) {
			toast({ variant: "destructive", title: "Informe o código do cupom" });
			return;
		}
		const discountNum = Number.parseFloat(discount.replace(",", "."));
		if (Number.isNaN(discountNum) || discountNum <= 0) {
			toast({ variant: "destructive", title: "Informe o valor do desconto" });
			return;
		}
		if (discountKind === "PERCENTAGE" && discountNum > 100) {
			toast({ variant: "destructive", title: "Porcentagem deve ser até 100" });
			return;
		}
		setIsSubmitting(true);
		try {
			const result = await createGymCoupon({
				code: codeTrim,
				notes: notes.trim() || codeTrim,
				discountKind,
				discount: discountNum,
				maxRedeems: maxRedeems.trim() ? Math.max(-1, Math.floor(Number(maxRedeems))) : undefined,
			});
			if (result.success) {
				toast({ title: "Cupom criado", description: `${codeTrim} disponível para uso.` });
				setModalOpen(false);
				setCode("");
				setNotes("");
				setDiscount("");
				setMaxRedeems("");
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
	const usagePercent = (c: Coupon) =>
		c.maxUses >= 999999 ? 0 : Math.min(100, (c.currentUses / c.maxUses) * 100);

	return (
		<>
			<DuoCard.Root variant="default" padding="md">
				<DuoCard.Header>
					<div className="flex items-center gap-2">
						<Gift className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
						<h2 className="font-bold text-[var(--duo-fg)]">Cupons</h2>
					</div>
					<DuoButton size="sm" onClick={() => setModalOpen(true)}>
						<Plus className="h-4 w-4" />
						Novo cupom
					</DuoButton>
				</DuoCard.Header>
				<div className="space-y-3">
					{coupons.length === 0 && (
						<p className="py-8 text-center text-sm text-duo-gray-dark">
							Nenhum cupom cadastrado. Crie um para oferecer descontos.
						</p>
					)}
					{coupons.map((coupon) => (
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
								{coupon.isActive && (
									<div className="rounded-lg bg-duo-green/20 px-2 py-1 text-xs font-bold text-duo-green">
										Ativo
									</div>
								)}
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
									<div className="text-xs text-duo-gray-dark">Atualizado</div>
									<div className="text-sm font-bold text-duo-text">
										{toValidDate(coupon.expiryDate)?.toLocaleDateString("pt-BR", {
											day: "2-digit",
											month: "short",
										}) || "—"}
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
							<div>
								<label className="mb-1 block text-sm font-medium text-duo-text">Tipo de desconto</label>
								<select
									value={discountKind}
									onChange={(e) => setDiscountKind(e.target.value as "PERCENTAGE" | "FIXED")}
									className="w-full rounded-lg border border-duo-border px-3 py-2 text-duo-text"
								>
									<option value="PERCENTAGE">Porcentagem (%)</option>
									<option value="FIXED">Valor fixo (R$)</option>
								</select>
							</div>
							<DuoInput.Simple
								label={discountKind === "PERCENTAGE" ? "Desconto (%)" : "Desconto (R$)"}
								type="text"
								inputMode="decimal"
								placeholder={discountKind === "PERCENTAGE" ? "20" : "10,00"}
								value={discount}
								onChange={(e) => setDiscount(e.target.value)}
							/>
							<DuoInput.Simple
								label="Máximo de usos (vazio = ilimitado)"
								type="text"
								inputMode="numeric"
								placeholder="Ilimitado"
								value={maxRedeems}
								onChange={(e) => setMaxRedeems(e.target.value)}
							/>
							<div className="flex gap-2">
								<DuoButton variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
									Cancelar
								</DuoButton>
								<DuoButton className="flex-1" onClick={handleCreate} disabled={isSubmitting}>
									{isSubmitting ? "Criando..." : "Criar"}
								</DuoButton>
							</div>
						</div>
					</DuoCard.Root>
				</div>
			)}
		</>
	);
}
