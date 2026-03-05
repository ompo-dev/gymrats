"use client";

import {
  ChevronRight,
  CreditCard,
  MapPin,
  Monitor,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
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
  const [viewingPersonalId, setViewingPersonalId] = useState<string | null>(
    null,
  );
  const [profileData, setProfileData] = useState<{
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    atendimentoPresencial: boolean;
    atendimentoRemoto: boolean;
    gyms: { id: string; name: string; address?: string }[];
    plans: { id: string; name: string; type: string; price: number; duration: number }[];
  } | null>(null);

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
      if (viewingPersonalId === id) setViewingPersonalId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover personal");
    }
  }

  useEffect(() => {
    if (!viewingPersonalId) {
      setProfileData(null);
      return;
    }
    apiClient
      .get<typeof profileData>(`/api/gym/personals/${viewingPersonalId}/profile`)
      .then((res) => setProfileData(res.data))
      .catch(() => setProfileData(null));
  }, [viewingPersonalId]);

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
              <button
                type="button"
                onClick={() => setViewingPersonalId(item.personal.id)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-duo-border">
                  <Image
                    src={item.personal.avatar || "/placeholder.svg"}
                    alt={item.personal.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-duo-fg truncate">
                    {item.personal.name}
                  </p>
                  <p className="text-xs text-duo-fg-muted truncate">
                    {item.personal.email}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
              </button>
              <DuoButton
                type="button"
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePersonal(item.personal.id);
                }}
              >
                Remover
              </DuoButton>
            </div>
          ))}
        </div>
      </div>

      {viewingPersonalId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingPersonalId(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-duo-bg-card border-2 border-duo-border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {profileData ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-duo-fg">Perfil do Personal</h3>
                  <DuoButton
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewingPersonalId(null)}
                  >
                    ✕
                  </DuoButton>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-duo-border">
                    <Image
                      src={profileData.avatar || "/placeholder.svg"}
                      alt={profileData.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-duo-fg">{profileData.name}</p>
                    <div className="flex gap-2 mt-1">
                      {profileData.atendimentoPresencial && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-duo-blue/10 px-2 py-0.5 text-xs font-bold text-duo-blue">
                          <MapPin className="h-3 w-3" />
                          Presencial
                        </span>
                      )}
                      {profileData.atendimentoRemoto && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-duo-purple/10 px-2 py-0.5 text-xs font-bold text-duo-purple">
                          <Monitor className="h-3 w-3" />
                          Remoto
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {profileData.bio && (
                  <p className="text-sm text-duo-gray-dark mb-4">
                    {profileData.bio}
                  </p>
                )}
                {profileData.gyms.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-duo-fg-muted mb-2">
                      Academias
                    </p>
                    <div className="space-y-1">
                      {profileData.gyms.map((g) => (
                        <p key={g.id} className="text-sm text-duo-gray-dark">
                          {g.name}
                          {g.address && ` • ${g.address}`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {profileData.plans.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-duo-fg-muted mb-2 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Planos
                    </p>
                    <div className="space-y-2">
                      {profileData.plans.map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between items-center rounded-lg border border-duo-border p-2 text-sm"
                        >
                          <span className="font-medium text-duo-fg">
                            {p.name}
                          </span>
                          <span className="text-duo-green font-bold">
                            R$ {p.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-duo-fg-muted mt-2">
                      Academia não pode assinar planos do personal.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="py-8 text-center text-duo-gray-dark">
                Carregando perfil...
              </p>
            )}
          </div>
        </div>
      )}
    </DuoCard.Root>
  );
}
