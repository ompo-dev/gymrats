"use client";

import { CheckCircle, Loader2, LogIn, Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { useGym } from "@/hooks/use-gym";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckInModal({
  isOpen,
  onClose,
  onSuccess,
}: CheckInModalProps) {
  const actions = useGym("actions");
  const members = useGymDirectoryStore((state) => state.activeMembers);
  const isLoading = useGymDirectoryStore(
    (state) => state.isSearchingActiveMembers,
  );
  const searchActiveMembers = useGymDirectoryStore(
    (state) => state.searchActiveMembers,
  );
  const clearActiveMembers = useGymDirectoryStore(
    (state) => state.clearActiveMembers,
  );
  const [search, setSearch] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: buscar membros ativos pelo nome
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (search.length < 2) {
      clearActiveMembers();
      return;
    }
    timerRef.current = setTimeout(async () => {
      await searchActiveMembers(search);
    }, 400);
  }, [search, searchActiveMembers, clearActiveMembers]);

  // Focar no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleCheckIn = async (studentId: string, studentName: string) => {
    setChecking(studentId);
    setError("");
    try {
      await actions.checkInStudent(studentId);
      setSuccess(studentName);
      setTimeout(() => {
        setSuccess(null);
        onSuccess();
      }, 1800);
    } finally {
      setChecking(null);
    }
  };

  const handleClose = () => {
    setSearch("");
    clearActiveMembers();
    setSuccess(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Fechar modal de check-in"
        onClick={handleClose}
      />
      <DuoCard.Root
        variant="default"
        size="default"
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-duo-green/10">
              <LogIn className="h-5 w-5 text-duo-green" />
            </div>
            <h2 className="text-xl font-bold text-duo-text">
              Registrar Check-in
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-duo-gray-dark transition-colors hover:bg-duo-gray-lighter hover:text-duo-text"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback de sucesso */}
        {success && (
          <DuoCard.Root variant="highlighted" size="sm" className="mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0 text-duo-green" />
              <p className="font-bold text-duo-green">
                Check-in registrado para {success}!
              </p>
            </div>
          </DuoCard.Root>
        )}

        {/* Feedback de erro */}
        {error && (
          <DuoCard.Root variant="orange" size="sm" className="mb-4">
            <p className="text-sm text-duo-text">{error}</p>
          </DuoCard.Root>
        )}

        {/* Campo de busca */}
        <DuoInput.Simple
          ref={inputRef}
          placeholder="Buscar aluno pelo nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="mb-4"
        />

        {/* Lista de membros */}
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-duo-gray-dark">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}
          {!isLoading && search.length >= 2 && members.length === 0 && (
            <p className="py-4 text-center text-sm text-duo-gray-dark">
              Nenhum aluno ativo encontrado
            </p>
          )}
          {!isLoading && search.length < 2 && (
            <p className="py-3 text-center text-sm text-duo-gray-dark">
              Digite pelo menos 2 caracteres para buscar
            </p>
          )}
          {members.map((member) => (
            <DuoCard.Root key={member.id} variant="default" size="sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {member.avatar ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-duo-green/15 text-sm font-bold text-duo-green">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="truncate font-bold text-sm text-duo-text">
                    {member.name}
                  </p>
                </div>
                <DuoButton
                  size="sm"
                  onClick={() => handleCheckIn(member.id, member.name)}
                  disabled={checking === member.id || !!success}
                  className="shrink-0"
                >
                  {checking === member.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="mr-1 h-3 w-3" />
                      Check-in
                    </>
                  )}
                </DuoButton>
              </div>
            </DuoCard.Root>
          ))}
        </div>
      </DuoCard.Root>
    </div>
  );
}
