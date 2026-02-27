"use client";

import { DuoInput } from "@/components/duo";
import { StepCard } from "@/components/molecules/cards/step-card";
import type { StepProps } from "./types";

export function Step1({ formData, setFormData }: StepProps) {
	return (
		<StepCard.Simple
			title="Informações da Academia"
			description="Vamos começar com os dados básicos"
		>
			<div className="space-y-5">
				<DuoInput.Simple
					label="Nome da Academia *"
					type="text"
					placeholder="Ex: Academia Fitness Center"
					value={formData.name}
					onChange={(e) =>
						setFormData({ ...formData, name: e.target.value })
					}
					required
				/>
				<DuoInput.Simple
					label="Telefone *"
					type="tel"
					placeholder="(11) 99999-9999"
					value={formData.phone}
					onChange={(e) =>
						setFormData({ ...formData, phone: e.target.value })
					}
					required
				/>
				<DuoInput.Simple
					label="E-mail *"
					type="email"
					placeholder="contato@academia.com"
					value={formData.email}
					onChange={(e) =>
						setFormData({ ...formData, email: e.target.value })
					}
					required
				/>
			</div>
		</StepCard.Simple>
	);
}
