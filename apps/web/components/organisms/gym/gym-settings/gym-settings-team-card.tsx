"use client";

import { ArrowLeft, Search, Trash2, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { PersonalListItemCard } from "@/components/organisms/sections/list-item-cards";
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

type PersonalProfileForGym = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  email?: string;
  phone?: string | null;
  cref?: string | null;
  gyms: { id: string; name: string; address?: string }[];
  studentsCount?: number;
};

export function GymSettingsTeamCard() {
  const [personals, setPersonals] = useState<TeamPersonal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [viewPersonalId, setViewPersonalId] = useState<string | null>(null);
  const [personalProfile, setPersonalProfile] =
    useState<PersonalProfileForGym | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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

  const loadPersonalProfile = useCallback(async (personalId: string) => {
    setLoadingProfile(true);
    try {
      const res = await apiClient.get<PersonalProfileForGym>(
        `/api/gym/personals/${personalId}/profile`,
      );
      setPersonalProfile(res.data);
    } catch {
      setPersonalProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (viewPersonalId) {
      loadPersonalProfile(viewPersonalId);
    } else {
      setPersonalProfile(null);
    }
  }, [viewPersonalId, loadPersonalProfile]);

  async function handleAddPersonal(personalId: string) {
    setError("");
    try {
      await apiClient.post("/api/gym/personals", { personalId });
      setSearchQuery("");
      setSearchResults([]);
      await loadTeam();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao adicionar personal",
      );
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
      setError(
        err instanceof Error ? err.message : "Erro ao remover personal",
      );
    }
  }

  if (viewPersonalId) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <DuoButton
            variant="ghost"
            size="sm"
            onClick={() => setViewPersonalId(null)}
            className="gap-1 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </DuoButton>
        </DuoCard.Header>

        {loadingProfile ? (
          <p className="py-8 text-center text-sm text-duo-fg-muted">
            Carregando perfil...
          </p>
        ) : personalProfile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-duo-border">
                <Image
                  src={personalProfile.avatar || "/placeholder.svg"}
                  alt={personalProfile.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-duo-fg">{personalProfile.name}</h3>
                {personalProfile.email && (
                  <p className="text-xs text-duo-fg-muted">
                    {personalProfile.email}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {personalProfile.atendimentoPresencial && (
                    <span className="rounded-full bg-duo-blue/10 px-2 py-0.5 text-xs font-bold text-duo-blue">
                      Presencial
                    </span>
                  )}
                  {personalProfile.atendimentoRemoto && (
                    <span className="rounded-full bg-duo-purple/10 px-2 py-0.5 text-xs font-bold text-duo-purple">
                      Remoto
                    </span>
                  )}
                </div>
              </div>
            </div>

            {personalProfile.bio && (
              <p className="text-sm text-duo-fg-muted">{personalProfile.bio}</p>
            )}

            {personalProfile.cref && (
              <div className="rounded-lg border border-duo-border p-3">
                <p className="text-xs text-duo-fg-muted">CREF</p>
                <p className="text-sm font-semibold text-duo-fg">
                  {personalProfile.cref}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-duo-border p-3 text-center">
                <p className="text-lg font-bold text-duo-fg">
                  {personalProfile.studentsCount ?? 0}
                </p>
                <p className="text-xs text-duo-fg-muted">Alunos</p>
              </div>
              <div className="rounded-lg border border-duo-border p-3 text-center">
                <p className="text-lg font-bold text-duo-fg">
                  {personalProfile.gyms.length}
                </p>
                <p className="text-xs text-duo-fg-muted">Academias</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-duo-fg-muted">
            Não foi possível carregar o perfil.
          </p>
        )}
      </DuoCard.Root>
    );
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
                    {p.alreadyLinked ? (
                      "Vinculado"
                    ) : (
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
            <p className="text-sm text-duo-fg-muted">
              Nenhum personal vinculado.
            </p>
          ) : null}
          {personals.map((item) => (
            <PersonalListItemCard
              key={item.id}
              image={item.personal.avatar || "/placeholder.svg"}
              name={item.personal.name}
              onClick={() => setViewPersonalId(item.personal.id)}
              email={item.personal.email}
              hoverColor="duo-primary"
              trailingAction={
                <DuoButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePersonal(item.personal.id);
                  }}
                  className="text-duo-red hover:bg-duo-red/10 hover:text-duo-red"
                >
                  <Trash2 className="h-4 w-4" />
                </DuoButton>
              }
            />
          ))}
        </div>
      </div>
    </DuoCard.Root>
  );
}
