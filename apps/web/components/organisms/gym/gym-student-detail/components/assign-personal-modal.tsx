"use client";

import { Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { DuoButton, DuoInput, DuoModal } from "@/components/duo";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";

export interface AssignPersonalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (personalId: string) => Promise<void>;
  isAssigning: boolean;
}

export function AssignPersonalModal({
  isOpen,
  onClose,
  onAssign,
  isAssigning,
}: AssignPersonalModalProps) {
  const searchResults = useGymDirectoryStore(
    (state) => state.linkedPersonalSearchResults,
  );
  const searching = useGymDirectoryStore(
    (state) => state.isSearchingLinkedPersonals,
  );
  const searchLinkedTeamPersonals = useGymDirectoryStore(
    (state) => state.searchLinkedTeamPersonals,
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(
      () => {
        searchLinkedTeamPersonals(searchQuery).catch(() => undefined);
      },
      searchQuery.trim() ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, searchLinkedTeamPersonals]);

  useEffect(() => {
    if (isOpen && !searchQuery.trim()) {
      searchLinkedTeamPersonals("").catch(() => undefined);
    }
  }, [isOpen, searchQuery, searchLinkedTeamPersonals]);

  async function handleSelect(personalId: string) {
    await onAssign(personalId);
    setSearchQuery("");
    onClose();
  }

  return (
    <DuoModal.Simple
      isOpen={isOpen}
      onClose={onClose}
      title="Atribuir Personal"
    >
      <div className="space-y-4">
        <DuoInput.Simple
          label="Buscar personal da equipe"
          placeholder="Nome ou email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searching && (
          <p className="text-xs text-duo-fg-muted flex items-center gap-1">
            <Search className="h-3 w-3" />
            Buscando...
          </p>
        )}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-duo-border space-y-1 p-2">
          {searchResults.length === 0 && !searching && (
            <p className="text-sm text-duo-fg-muted py-4 text-center">
              Nenhum personal encontrado. Vincule personais na equipe em
              Configurações primeiro.
            </p>
          )}
          {searchResults.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded p-2 hover:bg-duo-bg/50"
            >
              <div>
                <p className="text-sm font-medium text-duo-fg">{p.name}</p>
                <p className="text-xs text-duo-fg-muted">{p.email}</p>
              </div>
              <DuoButton
                type="button"
                size="sm"
                disabled={isAssigning}
                onClick={() => handleSelect(p.id)}
              >
                {isAssigning ? (
                  "Atribuindo..."
                ) : (
                  <>
                    <UserPlus className="mr-1 h-3 w-3" />
                    Atribuir
                  </>
                )}
              </DuoButton>
            </div>
          ))}
        </div>
      </div>
    </DuoModal.Simple>
  );
}
