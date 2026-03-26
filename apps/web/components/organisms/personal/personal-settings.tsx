"use client";

import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PersonalSettingsScreen,
  type PersonalSettingsFormState,
} from "@/components/screens/personal";
import { usePersonalSettings } from "@/hooks/use-personal-settings";
import { useToast } from "@/hooks/use-toast";
import { useUserSession } from "@/hooks/use-user-session";
import { useAuthStore } from "@/stores/auth-store";
import { PersonalMembershipPlansPage } from "./personal-membership-plans-page";

export interface PersonalProfileDisplay {
  id?: string;
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
}

export interface PersonalSettingsPageProps {
  profile: PersonalProfileDisplay | null;
  plans?: PersonalMembershipPlan[];
  onRefresh?: () => Promise<void>;
}

function createPersonalSettingsFormState(
  profile: PersonalProfileDisplay | null | undefined,
): PersonalSettingsFormState {
  return {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    bio: profile?.bio ?? "",
    address: profile?.address ?? "",
    cref: profile?.cref ?? "",
    pixKeyType: profile?.pixKeyType ?? "",
    pixKey: profile?.pixKey ?? "",
    atendimentoPresencial: profile?.atendimentoPresencial ?? true,
    atendimentoRemoto: profile?.atendimentoRemoto ?? true,
  };
}

function arePersonalSettingsFormsEqual(
  current: PersonalSettingsFormState,
  next: PersonalSettingsFormState,
) {
  return (
    current.name === next.name &&
    current.email === next.email &&
    current.phone === next.phone &&
    current.bio === next.bio &&
    current.address === next.address &&
    current.cref === next.cref &&
    current.pixKeyType === next.pixKeyType &&
    current.pixKey === next.pixKey &&
    current.atendimentoPresencial === next.atendimentoPresencial &&
    current.atendimentoRemoto === next.atendimentoRemoto
  );
}

export function PersonalSettingsPage({
  profile: initialProfile,
  plans = [],
  onRefresh,
}: PersonalSettingsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, saving, saveError, handleSave } = usePersonalSettings({
    initialProfile,
  });
  const { role } = useUserSession();
  const canSwitchToStudent = role === "PERSONAL" || role === "ADMIN";

  const [form, setForm] = useState<PersonalSettingsFormState>(() =>
    createPersonalSettingsFormState(profile),
  );

  useEffect(() => {
    const nextForm = createPersonalSettingsFormState(profile);

    setForm((current) =>
      arePersonalSettingsFormsEqual(current, nextForm) ? current : nextForm,
    );
  }, [profile]);

  const baselineForm = createPersonalSettingsFormState(profile);
  const hasChanges = !arePersonalSettingsFormsEqual(form, baselineForm);

  const handleFieldChange = <K extends keyof PersonalSettingsFormState>(
    field: K,
    value: PersonalSettingsFormState[K],
  ) => {
    setForm((current) =>
      current[field] === value ? current : { ...current, [field]: value },
    );
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().signOut();
      router.push("/welcome");
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível sair.",
      });
    }
  };

  const handleSwitchToStudent = () => {
    router.push("/student");
  };

  const onSave = async () => {
    await handleSave({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      bio: form.bio || null,
      address: form.address || null,
      cref: form.cref || null,
      pixKey: form.pixKey || null,
      pixKeyType: form.pixKeyType || null,
      atendimentoPresencial: form.atendimentoPresencial,
      atendimentoRemoto: form.atendimentoRemoto,
    });
    await onRefresh?.();
  };

  return (
    <PersonalSettingsScreen
      form={form}
      hasChanges={hasChanges}
      saving={saving}
      saveError={saveError}
      canSwitchToStudent={canSwitchToStudent}
      onFieldChange={handleFieldChange}
      onSave={onSave}
      onLogout={handleLogout}
      onSwitchToStudent={
        canSwitchToStudent ? handleSwitchToStudent : undefined
      }
      plansSlot={
        <PersonalMembershipPlansPage plans={plans} onRefresh={onRefresh} />
      }
    />
  );
}
