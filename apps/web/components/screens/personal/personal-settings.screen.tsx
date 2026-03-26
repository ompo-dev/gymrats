"use client";

import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";
import { CreditCard, Loader2, MapPin } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import {
  ScreenShell,
  createTestSelector,
} from "@/components/foundations";
import { PersonalSettingsAccountCard } from "@/components/organisms/personal/personal-settings/personal-settings-account-card";
import { cn } from "@/lib/utils";

export interface PersonalSettingsFormState {
  name: string;
  email: string;
  phone: string;
  bio: string;
  address: string;
  cref: string;
  pixKeyType: string;
  pixKey: string;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
}

export interface PersonalSettingsScreenProps
  extends ScreenProps<{
    form: PersonalSettingsFormState;
    plans?: PersonalMembershipPlan[];
    hasChanges: boolean;
    saving?: boolean;
    saveError?: string;
    canSwitchToStudent?: boolean;
    plansSlot?: ReactNode;
    onFieldChange: <K extends keyof PersonalSettingsFormState>(
      field: K,
      value: PersonalSettingsFormState[K],
    ) => void;
    onSave: () => void | Promise<void>;
    onLogout: () => void | Promise<void>;
    onSwitchToStudent?: () => void;
  }> {}

export const personalSettingsScreenContract: ViewContract = {
  componentId: "personal-settings-screen",
  testId: "personal-settings-screen",
};

const PIX_KEY_OPTIONS = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "PHONE", label: "Telefone" },
  { value: "EMAIL", label: "E-mail" },
  { value: "RANDOM", label: "Chave aleatória" },
];

function resolvePixPlaceholder(pixKeyType: string) {
  if (pixKeyType === "CPF") {
    return "000.000.000-00";
  }

  if (pixKeyType === "CNPJ") {
    return "00.000.000/0001-00";
  }

  if (pixKeyType === "PHONE") {
    return "(00) 00000-0000";
  }

  if (pixKeyType === "EMAIL") {
    return "email@exemplo.com";
  }

  if (pixKeyType === "RANDOM") {
    return "Chave aleatória";
  }

  return "Selecione o tipo primeiro";
}

function PersonalSettingsFieldCard({
  title,
  description,
  iconBg,
  iconClassName,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  iconBg: string;
  iconClassName: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
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
              iconBg,
            )}
          >
            <Icon className={cn("h-5 w-5", iconClassName)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-duo-fg">{title}</div>
            <div className="text-xs text-duo-fg-muted">{description}</div>
          </div>
        </div>
        <div>{children}</div>
      </div>
    </DuoCard.Root>
  );
}

export function PersonalSettingsScreen({
  form,
  hasChanges,
  saving = false,
  saveError,
  canSwitchToStudent,
  plansSlot,
  onFieldChange,
  onSave,
  onLogout,
  onSwitchToStudent,
}: PersonalSettingsScreenProps) {
  return (
    <ScreenShell.Root screenId={personalSettingsScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Configurações</ScreenShell.Title>
            <ScreenShell.Description>
              Gerencie seu perfil, endereço e dados financeiros.
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              personalSettingsScreenContract.testId,
              "profile",
            )}
          >
            <DuoCard.Header>
              <h2 className="font-bold text-duo-fg">Perfil</h2>
            </DuoCard.Header>
            <div className="space-y-4">
              <DuoInput.Simple
                label="Nome"
                value={form.name}
                onChange={(event) =>
                  onFieldChange("name", event.target.value)
                }
                placeholder="Seu nome"
              />

              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--duo-fg)]">
                  E-mail
                </p>
                <div className="select-none rounded-xl border border-[var(--duo-border)] bg-[var(--duo-bg-elevated)] px-3 py-2 text-sm text-[var(--duo-fg-muted)]">
                  {form.email}
                </div>
                <p className="text-xs text-[var(--duo-fg-muted)]">
                  Não pode ser alterado aqui
                </p>
              </div>

              <DuoInput.Simple
                label="CREF"
                value={form.cref}
                onChange={(event) =>
                  onFieldChange("cref", event.target.value)
                }
                placeholder="000000-G/XX"
              />

              <DuoInput.Simple
                label="Telefone"
                value={form.phone}
                onChange={(event) =>
                  onFieldChange("phone", event.target.value)
                }
                placeholder="(00) 00000-0000"
              />

              <div>
                <label
                  htmlFor="personal-settings-bio"
                  className="mb-1 block text-sm font-medium text-duo-fg"
                >
                  Bio
                </label>
                <textarea
                  id="personal-settings-bio"
                  value={form.bio}
                  onChange={(event) =>
                    onFieldChange("bio", event.target.value)
                  }
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                  className="w-full rounded-xl border border-duo-border bg-duo-bg px-4 py-3 text-duo-fg placeholder:text-duo-fg-muted focus:border-duo-primary focus:outline-none focus:ring-1 focus:ring-duo-primary"
                />
              </div>
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.15}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              personalSettingsScreenContract.testId,
              "operations",
            )}
          >
            <DuoCard.Header>
              <h2 className="font-bold text-duo-fg">Endereço e Financeiro</h2>
            </DuoCard.Header>
            <div className="space-y-3">
              <PersonalSettingsFieldCard
                title="Endereço"
                description="Onde você atende presencialmente"
                iconBg="bg-duo-green/10"
                iconClassName="text-duo-green"
                icon={MapPin}
              >
                <DuoInput.Simple
                  id="personal-settings-address"
                  value={form.address}
                  onChange={(event) =>
                    onFieldChange("address", event.target.value)
                  }
                  placeholder="Opcional"
                  className="mt-2"
                />
              </PersonalSettingsFieldCard>

              <PersonalSettingsFieldCard
                title="Chave PIX para Recebimentos"
                description="Os pagamentos dos alunos podem ser transferidos para esta chave"
                iconBg="bg-duo-yellow/10"
                iconClassName="text-duo-yellow"
                icon={CreditCard}
              >
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <DuoSelect.Simple
                    options={PIX_KEY_OPTIONS}
                    value={form.pixKeyType || undefined}
                    onChange={(value) => onFieldChange("pixKeyType", value)}
                    placeholder="Tipo de chave"
                    className="min-w-[180px] sm:min-w-0 sm:flex-1"
                  />
                  <DuoInput.Simple
                    value={form.pixKey}
                    onChange={(event) =>
                      onFieldChange("pixKey", event.target.value)
                    }
                    placeholder={resolvePixPlaceholder(form.pixKeyType)}
                    className="flex-1"
                  />
                </div>
              </PersonalSettingsFieldCard>
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.2}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              personalSettingsScreenContract.testId,
              "attendance",
            )}
          >
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
                  checked: form.atendimentoPresencial,
                  onChange: (value: boolean) =>
                    onFieldChange("atendimentoPresencial", value),
                },
                {
                  id: "remoto",
                  label: "Atendimento remoto",
                  checked: form.atendimentoRemoto,
                  onChange: (value: boolean) =>
                    onFieldChange("atendimentoRemoto", value),
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
                        onChange={(event) => item.onChange(event.target.checked)}
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

        {hasChanges ? (
          <SlideIn delay={0.25}>
            <DuoButton
              onClick={onSave}
              disabled={saving}
              className="w-full"
              data-testid={createTestSelector(
                personalSettingsScreenContract.testId,
                "save",
              )}
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
        ) : null}

        {saveError ? (
          <SlideIn delay={0.3}>
            <p
              className="text-center text-sm font-medium text-red-600"
              data-testid={createTestSelector(
                personalSettingsScreenContract.testId,
                "error",
              )}
            >
              {saveError}
            </p>
          </SlideIn>
        ) : null}

        {plansSlot ? (
          <SlideIn delay={0.35}>
            <div
              data-testid={createTestSelector(
                personalSettingsScreenContract.testId,
                "plans",
              )}
            >
              {plansSlot}
            </div>
          </SlideIn>
        ) : null}

        <SlideIn delay={0.4}>
          <div
            data-testid={createTestSelector(
              personalSettingsScreenContract.testId,
              "account",
            )}
          >
            <PersonalSettingsAccountCard
              canSwitchToStudent={canSwitchToStudent}
              onSwitchToStudent={onSwitchToStudent}
              onLogout={onLogout}
            />
          </div>
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
