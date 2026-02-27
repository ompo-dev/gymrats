"use client";

import { ArrowRightLeft, LogOut, Shield } from "lucide-react";
import { DuoCard } from "@/components/duo";

export interface AccountSectionProps {
	isAdmin: boolean;
	onSwitchToGym: () => void;
	onLogout: () => void;
}

export function AccountSection({
	isAdmin,
	onSwitchToGym,
	onLogout,
}: AccountSectionProps) {
	return (
		<DuoCard.Root variant="blue" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Shield
						className="h-5 w-5 shrink-0"
						style={{ color: "var(--duo-secondary)" }}
						aria-hidden
					/>
					<h2 className="font-bold text-[var(--duo-fg)]">Conta</h2>
				</div>
			</DuoCard.Header>
			<div className="space-y-3">
				{isAdmin && (
					<DuoCard.Root
						variant="default"
						size="default"
						className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
						onClick={onSwitchToGym}
					>
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-duo-blue/10 p-3">
								<ArrowRightLeft className="h-5 w-5 text-duo-blue" />
							</div>
							<div className="flex-1 text-left">
								<div className="text-sm font-bold text-duo-text">
									Trocar para Perfil de Academia
								</div>
								<div className="text-xs text-duo-gray-dark">
									Acessar como academia
								</div>
							</div>
						</div>
					</DuoCard.Root>
				)}
				<DuoCard.Root
					variant="default"
					size="default"
					className="cursor-pointer transition-all hover:border-red-300 active:scale-[0.98]"
					onClick={onLogout}
				>
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-red-50 p-3">
							<LogOut className="h-5 w-5 text-red-600" />
						</div>
						<div className="flex-1 text-left">
							<div className="text-sm font-bold text-duo-text">Sair</div>
							<div className="text-xs text-duo-gray-dark">
								Fazer logout da conta
							</div>
						</div>
					</div>
				</DuoCard.Root>
			</div>
		</DuoCard.Root>
	);
}
