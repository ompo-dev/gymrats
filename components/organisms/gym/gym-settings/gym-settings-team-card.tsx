"use client";

import { UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
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

export function GymSettingsTeamCard() {
  const [personals, setPersonals] = useState<TeamPersonal[]>([]);
  const [loading, setLoading] = useState(false);
  const [personalId, setPersonalId] = useState("");
  const [error, setError] = useState("");

  async function loadTeam() {
    setLoading(true);
    try {
      const response = await apiClient.get<{ personals: TeamPersonal[] }>(
        "/api/gym/personals",
      );
      setPersonals(response.data.personals || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam().catch(() => undefined);
  }, []);

  async function handleAddPersonal() {
    if (!personalId.trim()) return;
    setError("");
    try {
      await apiClient.post("/api/gym/personals", {
        personalId: personalId.trim(),
      });
      setPersonalId("");
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <DuoInput.Simple
            label="ID do personal"
            placeholder="Cole o ID do personal para vincular"
            value={personalId}
            onChange={(e) => setPersonalId(e.target.value)}
          />
          <DuoButton
            type="button"
            onClick={handleAddPersonal}
            className="sm:self-end"
          >
            <UserPlus className="mr-1 h-4 w-4" />
            Adicionar
          </DuoButton>
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
