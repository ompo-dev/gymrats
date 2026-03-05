"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [email, setEmail] = useState(initialProfile?.email ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [atendimentoPresencial, setAtendimentoPresencial] = useState(
    initialProfile?.atendimentoPresencial ?? true,
  );
  const [atendimentoRemoto, setAtendimentoRemoto] = useState(
    initialProfile?.atendimentoRemoto ?? true,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setName(initialProfile?.name ?? "");
    setEmail(initialProfile?.email ?? "");
    setPhone(initialProfile?.phone ?? "");
    setBio(initialProfile?.bio ?? "");
    setAtendimentoPresencial(initialProfile?.atendimentoPresencial ?? true);
    setAtendimentoRemoto(initialProfile?.atendimentoRemoto ?? true);
  }, [initialProfile]);

  const handleSave = async () => {
    setSaveError("");
    if (!name.trim() || !email.trim()) {
      setSaveError("Nome e email são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch("/api/personals", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        atendimentoPresencial,
        atendimentoRemoto,
      });
      toast({
        title: "Perfil atualizado",
        description: "Suas alterações foram salvas.",
      });
      setSaveError("");
      router.refresh();
      await onRefresh?.();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao salvar. Tente novamente.";
      setSaveError(msg);
      toast({
        variant: "destructive",
        title: "Erro",
        description: msg,
      });
    } finally {
      setSaving(false);
    }
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

      {saveError && (
        <div className="rounded-lg border border-duo-danger/40 bg-duo-danger/10 px-4 py-3 text-sm text-duo-danger">
          {saveError}
        </div>
      )}

      <SlideIn delay={0.3}>
        <DuoButton
          onClick={handleSave}
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
