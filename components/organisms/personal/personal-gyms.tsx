"use client";

import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

export interface PersonalGymItem {
  id: string;
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  };
}

export interface PersonalGymsPageProps {
  affiliations: PersonalGymItem[];
  onRefresh: () => Promise<void>;
}

export function PersonalGymsPage({
  affiliations,
  onRefresh,
}: PersonalGymsPageProps) {
  const { toast } = useToast();
  const [gymIdInput, setGymIdInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const handleLink = async () => {
    const gymId = gymIdInput.trim();
    if (!gymId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe o ID da academia.",
      });
      return;
    }
    setIsLinking(true);
    try {
      await apiClient.post("/api/personals/affiliations", { gymId });
      toast({
        title: "Academia vinculada",
        description: "Você foi vinculado à academia.",
      });
      setGymIdInput("");
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao vincular";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (gymId: string) => {
    setUnlinkingId(gymId);
    try {
      await apiClient.delete("/api/personals/affiliations", {
        data: { gymId },
      });
      toast({
        title: "Academia desvinculada",
        description: "O vínculo com a academia foi removido.",
      });
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao desvincular";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <DuoCard.Root>
        <h2 className="text-lg font-bold text-duo-fg">Academias vinculadas</h2>
        <p className="mt-1 text-sm text-duo-fg-muted">
          Academias onde você atua. Solicite à academia seu ID para vincular.
        </p>
      </DuoCard.Root>

      <DuoCard.Root>
        <h3 className="font-semibold text-duo-fg">Vincular nova academia</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <DuoInput.Simple
              label="ID da academia"
              placeholder="UUID da academia"
              value={gymIdInput}
              onChange={(e) => setGymIdInput(e.target.value)}
            />
          </div>
          <DuoButton
            onClick={handleLink}
            disabled={isLinking || !gymIdInput.trim()}
            variant="primary"
          >
            {isLinking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="mr-2 h-4 w-4" />
            )}
            Vincular
          </DuoButton>
        </div>
      </DuoCard.Root>

      {affiliations.length === 0 ? (
        <DuoCard.Root>
          <p className="text-sm text-duo-fg-muted">
            Nenhuma academia vinculada no momento.
          </p>
        </DuoCard.Root>
      ) : (
        affiliations.map((item) => (
          <DuoCard.Root key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-duo-fg">
                {item.gym?.name || "Academia"}
              </p>
              <DuoButton
                variant="danger"
                size="sm"
                onClick={() => handleUnlink(item.gym.id)}
                disabled={unlinkingId === item.gym.id}
              >
                {unlinkingId === item.gym.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Desvincular
              </DuoButton>
            </div>
          </DuoCard.Root>
        ))
      )}
    </div>
  );
}
