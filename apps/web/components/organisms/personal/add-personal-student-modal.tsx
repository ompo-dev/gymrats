"use client";

import { CheckCircle, Loader2, Search, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { usePersonal } from "@/hooks/use-personal";
import { browserApiFetch } from "@/lib/api/browser-fetch";
import { useToast } from "@/hooks/use-toast";

interface StudentSearchResult {
  found: boolean;
  assignedGymIds?: string[];
  student?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    currentLevel?: number;
    currentStreak?: number;
  };
}

interface PersonalAffiliationOption {
  id: string;
  gym: { id: string; name: string };
}

interface AddPersonalStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  affiliations: PersonalAffiliationOption[];
}

export function AddPersonalStudentModal({
  isOpen,
  onClose,
  onSuccess,
  affiliations,
}: AddPersonalStudentModalProps) {
  const { actions, loaders } = usePersonal("actions", "loaders");
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<StudentSearchResult | null>(
    null,
  );
  const [selectedGymId, setSelectedGymId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) return;
    const normalizedIdentifier = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    if (normalizedIdentifier.length < 3) return; // @ + pelo menos 2 caracteres
    setIsSearching(true);
    setSearchResult(null);
    setError("");
    try {
      const searchQuery = normalizedIdentifier.startsWith("@")
        ? normalizedIdentifier
        : `@${normalizedIdentifier}`;
      const res = await browserApiFetch(
        `/api/personals/students/search?email=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      setSearchResult(data);
    } catch {
      setError("Erro ao buscar aluno. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssign = async () => {
    if (!searchResult?.student) return;

    setIsSubmitting(true);
    setError("");
    try {
      await actions.assignStudent({
        studentId: searchResult.student.id,
        gymId: selectedGymId || undefined,
      });
      await loaders.loadSection("students");
      toast({
        title: "Aluno atribuído",
        description: "O aluno foi vinculado a você.",
      });
      onSuccess();
      handleClose();
    } catch {
      setError("Erro ao atribuir aluno. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIdentifier("");
    setSearchResult(null);
    setSelectedGymId("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const gymOptions = affiliations.map((a) => ({
    value: a.gym.id,
    label: a.gym.name,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
    >
      <DuoCard.Root
        variant="default"
        size="default"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-duo-blue/10">
              <UserPlus className="h-5 w-5 text-duo-blue" />
            </div>
            <h2 className="text-xl font-bold text-duo-text">
              Atribuir Aluno
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-duo-gray-dark transition-colors hover:bg-duo-gray-lighter hover:text-duo-text"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <DuoInput.Simple
              label="Buscar por @ do aluno"
              placeholder="@usuario"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <DuoButton
              onClick={handleSearch}
              disabled={
                isSearching ||
                (identifier.trim().startsWith("@")
                  ? identifier.trim().length < 3
                  : identifier.trim().length < 2)
              }
              variant="primary"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Buscar"
              )}
            </DuoButton>
          </div>
        </div>

        {searchResult && (
          <div className="space-y-4">
            {!searchResult.found && (
              <DuoCard.Root variant="orange" size="sm">
                <p className="text-sm text-duo-text">
                  Nenhum aluno encontrado com este @. Verifique se o usuário
                  está cadastrado com a role <strong>STUDENT</strong>.
                </p>
              </DuoCard.Root>
            )}

            {searchResult.found && searchResult.student && (
              (() => {
                const currentContext = selectedGymId || "independent";
                const isAlreadyAssignedInContext = searchResult.assignedGymIds?.includes(currentContext);

                if (isAlreadyAssignedInContext) {
                  return (
                    <DuoCard.Root variant="orange" size="sm">
                      <p className="text-sm text-duo-text">
                        Este aluno já está atribuído a você {selectedGymId ? "nesta academia" : "como atendimento independente"}.
                      </p>
                    </DuoCard.Root>
                  );
                }
                return null;
              })()
            )}

            {searchResult.found &&
              searchResult.student &&
              !searchResult.assignedGymIds?.includes(selectedGymId || "independent") && (
                <>
                  <DuoCard.Root variant="highlighted" size="sm">
                    <div className="flex items-center gap-3">
                      {searchResult.student.avatar ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={searchResult.student.avatar}
                            alt={searchResult.student.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-duo-blue/15 text-lg font-bold text-duo-blue">
                          {searchResult.student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold text-duo-text">
                          {searchResult.student.name}
                        </p>
                        <p className="truncate text-sm text-duo-gray-dark">
                          {searchResult.student.email}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="rounded-full bg-duo-blue/10 px-2 py-0.5 text-xs font-medium text-duo-blue">
                            Nível {searchResult.student.currentLevel ?? 1}
                          </span>
                          <span className="rounded-full bg-duo-orange/10 px-2 py-0.5 text-xs font-medium text-duo-orange">
                            🔥 {searchResult.student.currentStreak ?? 0} dias
                          </span>
                        </div>
                      </div>
                      <CheckCircle className="ml-auto h-5 w-5 shrink-0 text-duo-green" />
                    </div>
                  </DuoCard.Root>

                  {gymOptions.length > 0 && (
                    <DuoSelect.Simple
                      label="Via academia (opcional)"
                      options={[
                        { value: "", label: "Atendimento independente" },
                        ...gymOptions,
                      ]}
                      value={selectedGymId}
                      onChange={setSelectedGymId}
                      placeholder="Selecione a academia"
                    />
                  )}

                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {error}
                    </p>
                  )}

                  <DuoButton
                    onClick={handleAssign}
                    disabled={isSubmitting || searchResult.assignedGymIds?.includes(selectedGymId || "independent")}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atribuindo...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Confirmar Atribuição
                      </>
                    )}
                  </DuoButton>
                </>
              )}
          </div>
        )}

        {error && !searchResult && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
      </DuoCard.Root>
    </div>
  );
}
