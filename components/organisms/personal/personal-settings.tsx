"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { useUserSession } from "@/hooks/use-user-session";
import { useToast } from "@/hooks/use-toast";
import { usePersonalSettings } from "@/hooks/use-personal-settings";
import { PersonalSettingsAccountCard } from "./personal-settings/personal-settings-account-card";

export interface PersonalProfileDisplay {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  atendimentoPresencial?: boolean;
  atendimentoRemoto?: boolean;
}

export interface PersonalSettingsPageProps {
  profile: PersonalProfileDisplay | null;
  onRefresh?: () => Promise<void>;
}

export function PersonalSettingsPage({
  profile: initialProfile,
  onRefresh,
}: PersonalSettingsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, saving, saveError, handleSave } = usePersonalSettings({
    initialProfile,
  });

  const { role } = useUserSession();
  const canSwitchToStudent = role === "PERSONAL" || role === "ADMIN";

  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [atendimentoPresencial, setAtendimentoPresencial] = useState(
    profile?.atendimentoPresencial ?? true,
  );
  const [atendimentoRemoto, setAtendimentoRemoto] = useState(
    profile?.atendimentoRemoto ?? true,
  );

  useEffect(() => {
    setName(profile?.name ?? "");
    setEmail(profile?.email ?? "");
    setPhone(profile?.phone ?? "");
    setBio(profile?.bio ?? "");
    setAtendimentoPresencial(profile?.atendimentoPresencial ?? true);
    setAtendimentoRemoto(profile?.atendimentoRemoto ?? true);
  }, [profile]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
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
      name,
      email,
      phone: phone || null,
      bio: bio || null,
      atendimentoPresencial,
      atendimentoRemoto,
    });
    await onRefresh?.();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-fg">
            Configurações
          </h1>
          <p className="text-sm text-duo-fg-muted">
            Gerencie seu perfil e modalidades de atendimento
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-duo-fg">Perfil</h2>
          </DuoCard.Header>
          <div className="space-y-4">
            <DuoInput.Simple
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
            <DuoInput.Simple
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            <DuoInput.Simple
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-duo-fg">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                rows={4}
                className="w-full rounded-xl border border-duo-border bg-duo-bg px-4 py-3 text-duo-fg placeholder:text-duo-fg-muted focus:border-duo-primary focus:outline-none focus:ring-1 focus:ring-duo-primary"
              />
            </div>
          </div>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h3 className="font-bold text-duo-fg">
              Modalidade de atendimento
            </h3>
          </DuoCard.Header>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={atendimentoPresencial}
                onChange={(e) => setAtendimentoPresencial(e.target.checked)}
                className="h-4 w-4 rounded border-duo-border text-duo-primary focus:ring-duo-primary"
              />
              <span className="text-sm font-medium text-duo-fg">
                Atendimento presencial
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={atendimentoRemoto}
                onChange={(e) => setAtendimentoRemoto(e.target.checked)}
                className="h-4 w-4 rounded border-duo-border text-duo-primary focus:ring-duo-primary"
              />
              <span className="text-sm font-medium text-duo-fg">
                Atendimento remoto
              </span>
            </label>
          </div>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.25}>
        <PersonalSettingsAccountCard
          canSwitchToStudent={!!canSwitchToStudent}
          onSwitchToStudent={handleSwitchToStudent}
          onLogout={handleLogout}
        />
      </SlideIn>

      {saveError && (
        <div className="rounded-lg border border-duo-danger/40 bg-duo-danger/10 px-4 py-3 text-sm text-duo-danger">
          {saveError}
        </div>
      )}

      <SlideIn delay={0.3}>
        <DuoButton
          onClick={onSave}
          disabled={saving}
          variant="primary"
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar alterações"
          )}
        </DuoButton>
      </SlideIn>
    </div>
  );
}
