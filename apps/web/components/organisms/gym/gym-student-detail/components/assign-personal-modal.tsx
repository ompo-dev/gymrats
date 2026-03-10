"use client";

import { Search, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DuoButton, DuoInput, DuoModal } from "@/components/duo";
import { apiClient } from "@/lib/api/client";

type SearchResult = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  alreadyLinked: boolean;
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      params.set("linkedOnly", "true");
      params.set("limit", "12");
      if (q.trim()) params.set("q", q.trim());
      const res = await apiClient.get<{ personals: SearchResult[] }>(
        `/api/gym/personals/search?${params.toString()}`,
      );
      setSearchResults(res.data.personals || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      doSearch(searchQuery);
    }, searchQuery.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, doSearch]);

  useEffect(() => {
    if (isOpen && !searchQuery.trim()) {
      doSearch("");
    }
  }, [isOpen, searchQuery, doSearch]);

  async function handleSelect(personalId: string) {
    await onAssign(personalId);
    setSearchQuery("");
    setSearchResults([]);
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
