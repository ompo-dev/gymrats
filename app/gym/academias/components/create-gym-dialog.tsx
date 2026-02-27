"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DuoButton, DuoInput } from "@/components/duo";
import type { CreateGymFormData } from "../hooks/use-academias-page";

export interface CreateGymDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: CreateGymFormData;
	onFormChange: (data: CreateGymFormData) => void;
	onSubmit: (e: React.FormEvent) => void;
	isCreating: boolean;
	createError: string;
}

export function CreateGymDialog({
	open,
	onOpenChange,
	formData,
	onFormChange,
	onSubmit,
	isCreating,
	createError,
}: CreateGymDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-white">
				<DialogHeader>
					<DialogTitle>Criar Nova Academia</DialogTitle>
					<DialogDescription>
						Adicione uma nova academia à sua conta. Todos os dados serão
						separados entre suas academias.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} className="space-y-4">
					<DuoInput.Simple
						id="name"
						label="Nome da Academia *"
						value={formData.name}
						onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
						required
						placeholder="Ex: Minha Academia Centro"
					/>

					<DuoInput.Simple
						id="address"
						label="Endereço *"
						value={formData.address}
						onChange={(e) =>
							onFormChange({ ...formData, address: e.target.value })
						}
						required
						placeholder="Rua, número, bairro"
					/>

					<DuoInput.Simple
						id="phone"
						label="Telefone *"
						type="tel"
						value={formData.phone}
						onChange={(e) =>
							onFormChange({ ...formData, phone: e.target.value })
						}
						required
						placeholder="(00) 00000-0000"
					/>

					<DuoInput.Simple
						id="email"
						label="Email *"
						type="email"
						value={formData.email}
						onChange={(e) =>
							onFormChange({ ...formData, email: e.target.value })
						}
						required
						placeholder="contato@minhaacademia.com"
					/>

					<DuoInput.Simple
						id="cnpj"
						label="CNPJ (opcional)"
						value={formData.cnpj}
						onChange={(e) =>
							onFormChange({ ...formData, cnpj: e.target.value })
						}
						placeholder="00.000.000/0000-00"
					/>

					{createError && (
						<div className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">
							{createError}
						</div>
					)}

					<div className="flex gap-2">
						<DuoButton
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isCreating}
							className="flex-1"
						>
							Cancelar
						</DuoButton>
						<DuoButton
							type="submit"
							disabled={isCreating}
							className="flex-1 bg-green-600 hover:bg-green-700"
						>
							{isCreating ? "Criando..." : "Criar Academia"}
						</DuoButton>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
