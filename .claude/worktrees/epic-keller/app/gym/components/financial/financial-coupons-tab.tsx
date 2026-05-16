"use client";

import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
import type { Coupon } from "@/lib/types";

interface FinancialCouponsTabProps {
	coupons: Coupon[];
}

export function FinancialCouponsTab({ coupons }: FinancialCouponsTabProps) {
	return (
		<SectionCard
			title="Cupons Ativos"
			icon={Gift}
			headerAction={
				<Button size="sm">
					<Plus className="h-4 w-4" />
				</Button>
			}
		>
			<div className="space-y-3">
				{coupons.map((coupon) => (
					<DuoCard
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
										: `R$ ${coupon.value}`}
								</div>
							</div>
							<div>
								<div className="text-xs text-duo-gray-dark">Usos</div>
								<div className="text-sm font-bold text-duo-text">
									{coupon.currentUses}/{coupon.maxUses}
								</div>
							</div>
							<div>
								<div className="text-xs text-duo-gray-dark">Validade</div>
								<div className="text-sm font-bold text-duo-text">
									{coupon.expiryDate.toLocaleDateString("pt-BR", {
										day: "2-digit",
										month: "short",
									})}
								</div>
							</div>
						</div>

						<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								className="h-full rounded-full bg-duo-yellow"
								style={{
									width: `${(coupon.currentUses / coupon.maxUses) * 100}%`,
								}}
							/>
						</div>
					</DuoCard>
				))}
			</div>
		</SectionCard>
	);
}
