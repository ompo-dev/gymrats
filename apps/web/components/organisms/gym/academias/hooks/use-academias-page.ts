"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { invalidateQueryDomains } from "@/hooks/use-bootstrap-refresh";
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
  const queryClient = useQueryClient();
  const {
    gyms,
    activeGymId,
    setActiveGymId,
    canCreateMultipleGyms,
    isLoading,
    isCreating,
    createError,
    createGym,
  } = useGymsList();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateGymFormData>(INITIAL_FORM);

  const handleSelectGym = async (gymId: string) => {
    await setActiveGymId(gymId);
    await invalidateQueryDomains(queryClient, ["gym", "payments"]);
  };

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGym(formData);
      setFormData(INITIAL_FORM);
      setShowCreateDialog(false);
    } catch {}
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
