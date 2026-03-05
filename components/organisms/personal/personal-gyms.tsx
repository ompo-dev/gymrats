"use client";

import { Building2, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  onViewGym?: (gymId: string) => void;
}

export function PersonalGymsPage({
  affiliations,
  onRefresh,
  onViewGym,
}: PersonalGymsPageProps) {
  const { toast } = useToast();
  const [gymHandleInput, setGymHandleInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const handleLink = async () => {
    const handle = gymHandleInput.trim();
    if (!handle) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe o @ da academia.",
      });
      return;
    }
    const gymId = handle.startsWith("@") ? handle : `@${handle}`;
    setIsLinking(true);
    try {
      await apiClient.post("/api/personals/affiliations", { gymId });
      toast({
        title: "Academia vinculada",
        description: "Você foi vinculado à academia.",
      });
      setGymHandleInput("");
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
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Academias</h1>
          <p className="text-sm text-duo-gray-dark">
            Academias onde você atua
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
      <DuoCard.Root>
        <h3 className="font-semibold text-duo-fg">Vincular nova academia</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <DuoInput.Simple
              label="@ da academia"
              placeholder="@academia (ex: @maromba)"
              value={gymHandleInput}
              onChange={(e) => setGymHandleInput(e.target.value)}
            />
          </div>
          <DuoButton
            onClick={handleLink}
            disabled={isLinking || !gymHandleInput.trim()}
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
      </SlideIn>

      <SlideIn delay={0.2}>
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
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3",
                  onViewGym && "cursor-pointer",
                )}
                onClick={() => onViewGym?.(item.gym.id)}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-duo-bg-elevated">
                  <Image
                    src={
                      item.gym?.logo || item.gym?.image || "/placeholder.svg"
                    }
                    alt={item.gym?.name || "Academia"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-duo-fg truncate">
                    {item.gym?.name || "Academia"}
                  </p>
                  {onViewGym && (
                    <p className="flex items-center gap-1 text-xs text-duo-gray-dark">
                      Ver perfil
                      <ChevronRight className="h-3 w-3" />
                    </p>
                  )}
                </div>
              </div>
              <DuoButton
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnlink(item.gym.id);
                }}
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
      </SlideIn>
    </div>
  );
}
