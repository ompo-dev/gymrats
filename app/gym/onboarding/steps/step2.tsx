"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { DuoCard, DuoInput } from "@/components/duo";
import type { StepProps } from "./types";

interface ViaCepResponse {
	cep: string;
	logradouro: string;
	complemento: string;
	bairro: string;
	localidade: string;
	uf: string;
	erro?: boolean;
}

export function Step2({ formData, setFormData }: StepProps) {
	const [isLoadingCep, setIsLoadingCep] = useState(false);
	const [cepError, setCepError] = useState<string | null>(null);

	const formatCep = (value: string) => {
		const numbers = value.replace(/\D/g, "");
		if (numbers.length <= 5) {
			return numbers;
		}
		return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
	};

	const fetchCepData = async (cep: string) => {
		const cleanCep = cep.replace(/\D/g, "");

		if (cleanCep.length !== 8) {
			return;
		}

		setIsLoadingCep(true);
		setCepError(null);

		try {
			const response = await axios.get<ViaCepResponse>(
				`https://viacep.com.br/ws/${cleanCep}/json/`,
			);

			if (response.data.erro) {
				setCepError("CEP não encontrado");
				setIsLoadingCep(false);
				return;
			}

			setFormData({
				...formData,
				address: response.data.logradouro || "",
				city: response.data.localidade || "",
				state: response.data.uf || "",
				zipCode: formatCep(cleanCep),
			});
		} catch (error) {
			console.error("Erro ao buscar CEP:", error);
			setCepError("Erro ao buscar CEP. Tente novamente.");
		} finally {
			setIsLoadingCep(false);
		}
	};

	const handleCepChange = (value: string) => {
		const stringValue = String(value);
		const formatted = formatCep(stringValue);
		setFormData({ ...formData, zipCode: formatted });
		setCepError(null);

		const cleanCep = formatted.replace(/\D/g, "");
		if (cleanCep.length === 8) {
			fetchCepData(cleanCep);
		}
	};

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
						Localização
					</h2>
					<p className="text-sm text-duo-fg-muted">
						Onde sua academia está localizada?
					</p>
				</div>
				<div className="space-y-5">
				<div className="relative">
					<DuoInput.Simple
						label="CEP *"
						type="text"
						placeholder="00000-000"
						value={formData.zipCode}
						onChange={(e) => handleCepChange(e.target.value)}
						required
						maxLength={9}
						error={cepError || undefined}
					/>
					{isLoadingCep && (
						<div className="absolute right-4 top-[42px]">
							<Loader2 className="h-5 w-5 animate-spin text-duo-orange" />
						</div>
					)}
					{cepError && (
						<motion.p
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="mt-1 text-sm text-duo-danger"
							role="alert"
						>
							{cepError}
						</motion.p>
					)}
				</div>

				<DuoInput.Simple
					label="Endereço *"
					type="text"
					placeholder="Rua, avenida, logradouro"
					value={formData.address}
					onChange={(e) =>
						setFormData({ ...formData, address: e.target.value })
					}
					required
				/>
				<DuoInput.Simple
					label="Número / Complemento"
					type="text"
					placeholder="Ex: 123, Sala 45, Bloco A"
					value={formData.addressNumber}
					onChange={(e) =>
						setFormData({ ...formData, addressNumber: e.target.value })
					}
				/>
				<div className="grid grid-cols-2 gap-4">
					<DuoInput.Simple
						label="Cidade *"
						type="text"
						placeholder="São Paulo"
						value={formData.city}
						onChange={(e) =>
							setFormData({ ...formData, city: e.target.value })
						}
						required
					/>
					<DuoInput.Simple
						label="Estado *"
						type="text"
						placeholder="SP"
						value={formData.state}
						onChange={(e) =>
							setFormData({ ...formData, state: e.target.value })
						}
						required
						maxLength={2}
					/>
				</div>
			</div>
			</DuoCard.Root>
		</motion.div>
	);
}
