"use client";

import { Search, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { apiClient } from "@/lib/api/client";

type TeamPersonal = {
  id: string;
  personal: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
};

type SearchResult = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  alreadyLinked: boolean;
};

export function GymSettingsTeamCard() {
  const [personals, setPersonals] = useState<TeamPersonal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ personals: TeamPersonal[] }>(
        "/api/gym/personals",
      );
      setPersonals(response.data.personals || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam().catch(() => undefined);
  }, [loadTeam]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get<{ personals: SearchResult[] }>(
          `/api/gym/personals/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`,
        );
        setSearchResults(res.data.personals || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleAddPersonal(personalId: string) {
    setError("");
    try {
      await apiClient.post("/api/gym/personals", { personalId });
      setSearchQuery("");
      setSearchResults([]);
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar personal");
    }
  }

  async function handleRemovePersonal(id: string) {
    setError("");
    try {
      await apiClient.delete("/api/gym/personals", {
        data: { personalId: id },
      });
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover personal");
    }
  }

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-duo-purple" />
          <h2 className="font-bold text-duo-fg">Gerenciar Equipe</h2>
        </div>
      </DuoCard.Header>

      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <DuoInput.Simple
            label="Buscar personal"
            placeholder="Nome ou email do personal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="rounded-lg border border-duo-border bg-duo-bg-card p-2 space-y-1 max-h-48 overflow-y-auto">
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
                    disabled={p.alreadyLinked}
                    onClick={() => handleAddPersonal(p.id)}
                  >
                    {p.alreadyLinked ? "Vinculado" : (
                      <>
                        <UserPlus className="mr-1 h-3 w-3" />
                        Vincular
                      </>
                    )}
                  </DuoButton>
                </div>
              ))}
            </div>
          )}
          {searching && (
            <p className="text-xs text-duo-fg-muted flex items-center gap-1">
              <Search className="h-3 w-3" />
              Buscando...
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-duo-danger/40 bg-duo-danger/10 px-3 py-2 text-sm text-duo-danger">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-duo-fg-muted">Carregando equipe...</p>
          ) : null}
          {!loading && personals.length === 0 ? (
            <p className="text-sm text-duo-fg-muted">Nenhum personal vinculado.</p>
          ) : null}
          {personals.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-duo-border p-3"
            >
              <div>
                <p className="text-sm font-semibold text-duo-fg">
                  {item.personal.name}
                </p>
                <p className="text-xs text-duo-fg-muted">{item.personal.email}</p>
              </div>
              <DuoButton
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemovePersonal(item.personal.id)}
              >
                Remover
              </DuoButton>
            </div>
          ))}
        </div>
      </div>
    </DuoCard.Root>
  );
}
