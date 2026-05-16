"use client";

import { UsersIcon } from "lucide-react";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
import type { Referral } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FinancialReferralsTabProps {
	referrals: Referral[];
}

export function FinancialReferralsTab({
	referrals,
}: FinancialReferralsTabProps) {
	return (
		<SectionCard title="Programa de Indicações" icon={UsersIcon}>
			<div className="space-y-3">
				{referrals.map((referral) => (
					<DuoCard
						key={referral.id}
						variant="default"
						size="default"
						className="border-duo-purple bg-duo-purple/10"
					>
						<div className="mb-3 flex items-center gap-3">
							<div className="rounded-full bg-duo-purple/20 p-2">
								<UsersIcon className="h-5 w-5 text-duo-purple" />
							</div>
							<div className="flex-1">
								<div className="text-sm font-bold text-duo-text">
									{referral.referrerName}
								</div>
								<div className="text-xs text-duo-gray-dark">
									indicou {referral.referredName}
								</div>
							</div>
							<div
								className={cn(
									"rounded-lg px-3 py-1 text-xs font-bold",
									referral.status === "completed"
										? "bg-duo-green/20 text-duo-green"
										: "bg-duo-yellow/20 text-duo-yellow",
								)}
							>
								{referral.status === "completed" ? "Completo" : "Pendente"}
							</div>
						</div>

						<DuoCard variant="default" size="sm" className="bg-white">
							<div className="flex items-center justify-between">
								<div className="text-xs text-duo-gray-dark">Recompensa</div>
								<div className="text-lg font-bold text-duo-purple">
									R$ {referral.reward}
								</div>
							</div>
						</DuoCard>
					</DuoCard>
				))}
			</div>
		</SectionCard>
	);
}
