"use client";

import { CreditCard, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { useAuthStore } from "@/stores/auth-store";
import { useUserSession } from "@/hooks/use-user-session";
import { useToast } from "@/hooks/use-toast";
import { usePersonalSettings } from "@/hooks/use-personal-settings";
import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";
import { PersonalSettingsAccountCard } from "./personal-settings/personal-settings-account-card";
import { cn } from "@/lib/utils";

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
import { PersonalMembershipPlansPage } from "./personal-membership-plans-page";

export interface PersonalSettingsPageProps {
  profile: PersonalProfileDisplay | null;
  plans?: PersonalMembershipPlan[];
  onRefresh?: () => Promise<void>;
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

  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [cref, setCref] = useState(profile?.cref ?? "");
  const [pixKeyType, setPixKeyType] = useState<string>(profile?.pixKeyType ?? "");
  const [pixKey, setPixKey] = useState(profile?.pixKey ?? "");
  const [atendimentoPresencial, setAtendimentoPresencial] = useState(
    profile?.atendimentoPresencial ?? true,
  );
  const [atendimentoRemoto, setAtendimentoRemoto] = useState(
    profile?.atendimentoRemoto ?? true,
  );

  useEffect(() => {
    const nextName = profile?.name ?? "";
    const nextEmail = profile?.email ?? "";
    const nextPhone = profile?.phone ?? "";
    const nextBio = profile?.bio ?? "";
    const nextAddress = profile?.address ?? "";
    const nextCref = profile?.cref ?? "";
    const nextPixKeyType = profile?.pixKeyType ?? "";
    const nextPixKey = profile?.pixKey ?? "";
    const nextAtendimentoPresencial = profile?.atendimentoPresencial ?? true;
    const nextAtendimentoRemoto = profile?.atendimentoRemoto ?? true;

    setName((current) => (current === nextName ? current : nextName));
    setEmail((current) => (current === nextEmail ? current : nextEmail));
    setPhone((current) => (current === nextPhone ? current : nextPhone));
    setBio((current) => (current === nextBio ? current : nextBio));
    setAddress((current) => (current === nextAddress ? current : nextAddress));
    setCref((current) => (current === nextCref ? current : nextCref));
    setPixKeyType((current) =>
      current === nextPixKeyType ? current : nextPixKeyType,
    );
    setPixKey((current) => (current === nextPixKey ? current : nextPixKey));
    setAtendimentoPresencial((current) =>
      current === nextAtendimentoPresencial
        ? current
        : nextAtendimentoPresencial,
    );
    setAtendimentoRemoto((current) =>
      current === nextAtendimentoRemoto ? current : nextAtendimentoRemoto,
    );
  }, [profile]);

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
      name,
      email, // Read only now, but kept in payload just in case
      phone: phone || null,
      bio: bio || null,
      address: address || null,
      cref: cref || null,
      pixKey: pixKey || null,
      pixKeyType: pixKeyType || null,
      atendimentoPresencial,
      atendimentoRemoto,
    });
    await onRefresh?.();
  };

  const hasChanges =
    name !== (profile?.name ?? "") ||
    phone !== (profile?.phone ?? "") ||
    bio !== (profile?.bio ?? "") ||
    address !== (profile?.address ?? "") ||
    cref !== (profile?.cref ?? "") ||
    pixKeyType !== (profile?.pixKeyType ?? "") ||
    pixKey !== (profile?.pixKey ?? "") ||
    atendimentoPresencial !== (profile?.atendimentoPresencial ?? true) ||
    atendimentoRemoto !== (profile?.atendimentoRemoto ?? true);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-fg">
            Configurações
          </h1>
          <p className="text-sm text-duo-fg-muted">
            Gerencie seu perfil, endereço e dados financeiros
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--duo-fg)]">
                E-mail
              </label>
              <div className="px-3 py-2 text-sm text-[var(--duo-fg-muted)] bg-[var(--duo-bg-elevated)] rounded-xl border border-[var(--duo-border)] select-none">
                {email}
              </div>
              <p className="text-xs text-[var(--duo-fg-muted)]">
                Não pode ser alterado aqui
              </p>
            </div>
            <DuoInput.Simple
              label="CREF"
              value={cref}
              onChange={(e) => setCref(e.target.value)}
              placeholder="000000-G/XX"
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

      {/* Address & PIX Cards matching gym layout */}
      <SlideIn delay={0.15}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-duo-fg">Endereço e Financeiro</h2>
          </DuoCard.Header>
          <div className="space-y-3">
            {[
              {
                title: "Endereço",
                description: "Onde você atende presencialmente",
                iconBg: "bg-duo-green/10",
                Icon: MapPin,
                iconClass: "text-duo-green",
                content: (
                  <DuoInput.Simple
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Opcional"
                    className="mt-2"
                  />
                ),
              },
              {
                title: "Chave PIX para Recebimentos",
                description:
                  "Os pagamentos dos alunos podem ser transferidos para esta chave",
                iconBg: "bg-duo-yellow/10",
                Icon: CreditCard,
                iconClass: "text-duo-yellow",
                content: (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <DuoSelect.Simple
                      options={[
                        { value: "CPF", label: "CPF" },
                        { value: "CNPJ", label: "CNPJ" },
                        { value: "PHONE", label: "Telefone" },
                        { value: "EMAIL", label: "E-mail" },
                        { value: "RANDOM", label: "Chave aleatória" },
                      ]}
                      value={pixKeyType || undefined}
                      onChange={setPixKeyType}
                      placeholder="Tipo de chave"
                      className="min-w-[180px] sm:min-w-0 sm:flex-1"
                    />
                    <DuoInput.Simple
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder={
                        pixKeyType === "CPF"
                          ? "000.000.000-00"
                          : pixKeyType === "CNPJ"
                            ? "00.000.000/0001-00"
                            : pixKeyType === "PHONE"
                              ? "(00) 00000-0000"
                              : pixKeyType === "EMAIL"
                                ? "email@exemplo.com"
                                : pixKeyType === "RANDOM"
                                  ? "Chave aleatória"
                                  : "Selecione o tipo primeiro"
                      }
                      className="flex-1"
                    />
                  </div>
                ),
              },
            ].map((field, index) => (
              <div
                key={field.title}
                className={index > 0 ? "pt-0" : undefined}
              >
                <DuoCard.Root
                  variant="default"
                  size="default"
                  className="border-2 border-duo-border"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-3",
                          field.iconBg,
                        )}
                      >
                        <field.Icon
                          className={cn("h-5 w-5", field.iconClass)}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-duo-fg">
                          {field.title}
                        </div>
                        <div className="text-xs text-duo-fg-muted">
                          {field.description}
                        </div>
                      </div>
                    </div>
                    <div>{field.content}</div>
                  </div>
                </DuoCard.Root>
              </div>
            ))}
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
            {[
              {
                id: "presencial",
                label: "Atendimento presencial",
                checked: atendimentoPresencial,
                onChange: setAtendimentoPresencial,
              },
              {
                id: "remoto",
                label: "Atendimento remoto",
                checked: atendimentoRemoto,
                onChange: setAtendimentoRemoto,
              },
            ].map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border-2 p-3 transition-all",
                  item.checked
                    ? "border-duo-secondary/40 bg-duo-secondary/5"
                    : "border-duo-border bg-duo-bg-elevated/50",
                )}
              >
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm font-bold text-duo-fg">
                    {item.label}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-duo-border transition-colors peer-checked:bg-duo-secondary" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-duo-bg-card shadow-sm transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </DuoCard.Root>
      </SlideIn>

      {hasChanges && (
        <SlideIn delay={0.25}>
          <DuoButton
            onClick={onSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar perfil"
            )}
          </DuoButton>
        </SlideIn>
      )}

      {saveError && (
        <SlideIn delay={0.3}>
          <p className="text-sm font-medium text-red-600 text-center">
            {saveError}
          </p>
        </SlideIn>
      )}

      <SlideIn delay={0.35}>
        <PersonalMembershipPlansPage plans={plans} onRefresh={onRefresh} />
      </SlideIn>

      <SlideIn delay={0.4}>
        <PersonalSettingsAccountCard
          onSwitchToStudent={
            canSwitchToStudent ? handleSwitchToStudent : undefined
          }
          onLogout={handleLogout}
        />
      </SlideIn>
    </div>
  );
}
