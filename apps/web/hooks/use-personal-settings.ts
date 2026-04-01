"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";

export interface UsePersonalSettingsProps {
  initialProfile: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    bio?: string | null;
    address?: string | null;
    cref?: string | null;
    pixKey?: string | null;
    pixKeyType?: string | null;
    atendimentoPresencial?: boolean;
    atendimentoRemoto?: boolean;
  } | null;
}

export function usePersonalSettings({
  initialProfile,
}: UsePersonalSettingsProps) {
  const profile = usePersonalUnifiedStore((state) => state.data.profile);
  const updateProfile = usePersonalUnifiedStore((state) => state.updateProfile);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const effectiveProfile = profile ?? initialProfile;

  const handleSave = useCallback(
    async (data: {
      name: string;
      email: string;
      phone?: string | null;
      bio?: string | null;
      address?: string | null;
      cref?: string | null;
      pixKey?: string | null;
      pixKeyType?: string | null;
      atendimentoPresencial?: boolean;
      atendimentoRemoto?: boolean;
    }) => {
      setSaveError("");
      if (!data.name.trim() || !data.email.trim()) {
        setSaveError("Nome e email sao obrigatorios.");
        return undefined;
      }

      setSaving(true);

      try {
        const updatedProfile = await updateProfile({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone?.trim() || null,
          bio: data.bio?.trim() || null,
          address: data.address?.trim() || null,
          cref: data.cref?.trim() || null,
          pixKey: data.pixKey?.trim() || null,
          pixKeyType: data.pixKeyType || null,
          atendimentoPresencial: data.atendimentoPresencial,
          atendimentoRemoto: data.atendimentoRemoto,
        });

        toast({
          title: "Perfil atualizado",
          description: "Suas alteracoes foram salvas.",
        });
        setSaveError("");

        return updatedProfile ?? effectiveProfile;
      } catch (err) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : err instanceof Error
              ? err.message
              : "Erro ao salvar. Tente novamente.";

        setSaveError(msg ?? "Erro ao salvar.");
        toast({
          variant: "destructive",
          title: "Erro",
          description: msg,
        });
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [effectiveProfile, toast, updateProfile],
  );

  return {
    profile: effectiveProfile,
    saving,
    saveError,
    handleSave,
  };
}
