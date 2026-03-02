"use client";

import { DollarSign } from "lucide-react";
import {
  AcademiasLoading,
  CreateGymButton,
  CreateGymDialog,
  GymCard,
  useAcademiasPage,
} from "@/components/organisms/gym/academias";

export function AcademiasPageContent() {
  const {
    gyms,
    activeGymId,
    canCreateMultipleGyms,
    isLoading,
    handleSelectGym,
    showCreateDialog,
    setShowCreateDialog,
    openCreateDialog,
    isCreating,
    createError,
    formData,
    setFormData,
    handleCreateGym,
  } = useAcademiasPage();

  if (isLoading) {
    return <AcademiasLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Minhas Academias
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie todas as suas academias em um só lugar
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {gyms.length} {gyms.length === 1 ? "Academia" : "Academias"}
            </div>
          </div>

          {!canCreateMultipleGyms && gyms.length === 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">
                  Desbloqueie Múltiplas Academias
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Assine um plano pago para gerenciar múltiplas academias com
                  dados completamente separados.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Academias */}
        <div className="space-y-3">
          {gyms.map((gym) => (
            <GymCard
              key={gym.id}
              gym={gym}
              isActive={activeGymId === gym.id}
              onSelect={handleSelectGym}
            />
          ))}
        </div>

        {canCreateMultipleGyms && (
          <CreateGymButton onClick={openCreateDialog} />
        )}
      </div>

      <CreateGymDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleCreateGym}
        isCreating={isCreating}
        createError={createError}
      />
    </div>
  );
}
