"use client";

import { motion } from "motion/react";
import { DuoCard, DuoInput } from "@/components/duo";
import type { StepProps } from "./types";

export function Step1({ formData, setFormData }: StepProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 50, scale: 0.95 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: -50, scale: 0.95 }}
			transition={{ type: "spring", stiffness: 100, damping: 15 }}
		>
			<DuoCard.Root
				variant="outlined"
				padding="lg"
				className="border-2 border-duo-border bg-duo-bg-card shadow-2xl backdrop-blur-md"
			>
				<div className="mb-6 text-center">
					<h2 className="mb-2 text-2xl font-bold text-duo-fg">
						Informações da Academia
					</h2>
					<p className="text-sm text-duo-fg-muted">
						Vamos começar com os dados básicos
					</p>
				</div>
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
			</DuoCard.Root>
		</motion.div>
	);
}
