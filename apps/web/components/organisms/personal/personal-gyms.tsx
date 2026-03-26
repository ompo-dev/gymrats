"use client";

import { useState } from "react";
import { PersonalGymsScreen } from "@/components/screens/personal";
import { usePersonal } from "@/hooks/use-personal";
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
  onViewGym?: (gymId: string) => void;
}

export function PersonalGymsPage({
  affiliations,
  onRefresh,
  onViewGym,
}: PersonalGymsPageProps) {
  const { toast } = useToast();
  const actions = usePersonal("actions");
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
      await actions.linkAffiliation(gymId);
      await onRefresh();
      toast({
        title: "Academia vinculada",
        description: "Você foi vinculado à academia.",
      });
      setGymHandleInput("");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao vincular";

      toast({
        variant: "destructive",
        title: "Erro",
        description: String(message),
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (gymId: string) => {
    setUnlinkingId(gymId);

    try {
      await actions.unlinkAffiliation(gymId);
      await onRefresh();
      toast({
        title: "Academia desvinculada",
        description: "O vínculo com a academia foi removido.",
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao desvincular";

      toast({
        variant: "destructive",
        title: "Erro",
        description: String(message),
      });
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <PersonalGymsScreen
      affiliations={affiliations}
      gymHandleInput={gymHandleInput}
      isLinking={isLinking}
      unlinkingId={unlinkingId}
      onGymHandleInputChange={setGymHandleInput}
      onLink={handleLink}
      onUnlink={handleUnlink}
      onViewGym={onViewGym}
    />
  );
}
