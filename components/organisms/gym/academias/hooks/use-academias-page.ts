"use client";

import { useState } from "react";
import { useGymsList } from "@/hooks/use-gyms-list";

export interface CreateGymFormData {
	name: string;
	address: string;
	phone: string;
	email: string;
	cnpj: string;
}

const INITIAL_FORM: CreateGymFormData = {
	name: "",
	address: "",
	phone: "",
	email: "",
	cnpj: "",
};

export function useAcademiasPage() {
	const {
		gyms,
		activeGymId,
		setActiveGymId,
		canCreateMultipleGyms,
		refreshGyms,
		isLoading,
	} = useGymsList();

	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [createError, setCreateError] = useState("");
	const [formData, setFormData] = useState<CreateGymFormData>(INITIAL_FORM);

	const handleSelectGym = async (gymId: string) => {
		await setActiveGymId(gymId);
	};

	const handleCreateGym = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsCreating(true);
		setCreateError("");

		try {
			const { apiClient } = await import("@/lib/api/client");
			const response = await apiClient.post<{ error?: string }>(
				"/api/gyms/create",
				formData,
			);

			if (response.data.error) {
				throw new Error(response.data.error || "Erro ao criar academia");
			}

			setFormData(INITIAL_FORM);
			await refreshGyms();
			setShowCreateDialog(false);
		} catch (error) {
			setCreateError(
				error instanceof Error ? error.message : "Erro ao criar academia",
			);
		} finally {
			setIsCreating(false);
		}
	};

	const openCreateDialog = () => setShowCreateDialog(true);
	const closeCreateDialog = () => setShowCreateDialog(false);

	return {
		gyms,
		activeGymId,
		canCreateMultipleGyms,
		isLoading,
		handleSelectGym,
		showCreateDialog,
		setShowCreateDialog,
		openCreateDialog,
		closeCreateDialog,
		isCreating,
		createError,
		formData,
		setFormData,
		handleCreateGym,
	};
}
