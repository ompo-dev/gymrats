"use client";

import { Building2, Clock, CreditCard, FileText, Loader2, Mail, MapPin, Phone } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import {
  ScreenShell,
  createTestSelector,
} from "@/components/foundations";
import { GymSettingsAccountCard } from "@/components/organisms/gym/gym-settings/gym-settings-account-card";
import { cn } from "@/lib/utils";

export const GYM_SETTINGS_WEEKDAYS = [
  { id: "monday", label: "Segunda" },
  { id: "tuesday", label: "Terça" },
  { id: "wednesday", label: "Quarta" },
  { id: "thursday", label: "Quinta" },
  { id: "friday", label: "Sexta" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
] as const;

export interface GymSettingsInfoState {
  address: string;
  phone: string;
  cnpj: string;
  pixKeyType: string;
  pixKey: string;
}

export interface GymSettingsDaySchedule {
  open: string;
  close: string;
  enabled: boolean;
}

export interface GymSettingsProfileSummary {
  name: string;
  plan: string;
  email?: string | null;
}

export interface GymSettingsScreenProps
  extends ScreenProps<{
    profile: GymSettingsProfileSummary;
    info: GymSettingsInfoState;
    daySchedules: Record<string, GymSettingsDaySchedule>;
    hasInfoChanges: boolean;
    hasScheduleChanges: boolean;
    saving?: boolean;
    saveError?: string;
    canSwitchToStudent?: boolean;
    plansSlot?: ReactNode;
    teamSlot?: ReactNode;
    onInfoChange: <K extends keyof GymSettingsInfoState>(
      field: K,
      value: GymSettingsInfoState[K],
    ) => void;
    onDayScheduleChange: (
      dayId: string,
      field: keyof GymSettingsDaySchedule,
      value: string | boolean,
    ) => void;
    onSaveInfo: () => void | Promise<void>;
    onSaveSchedules: () => void | Promise<void>;
    onLogout: () => void | Promise<void>;
    onSwitchToStudent?: () => void;
  }> {}

export const gymSettingsScreenContract: ViewContract = {
  componentId: "gym-settings-screen",
  testId: "gym-settings-screen",
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

function GymSettingsFieldCard({
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

export function GymSettingsScreen({
  profile,
  info,
  daySchedules,
  hasInfoChanges,
  hasScheduleChanges,
  saving = false,
  saveError,
  canSwitchToStudent,
  plansSlot,
  teamSlot,
  onInfoChange,
  onDayScheduleChange,
  onSaveInfo,
  onSaveSchedules,
  onLogout,
  onSwitchToStudent,
}: GymSettingsScreenProps) {
  return (
    <ScreenShell.Root screenId={gymSettingsScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Configurações</ScreenShell.Title>
            <ScreenShell.Description>
              Gerencie o perfil e as configurações da academia.
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
              gymSettingsScreenContract.testId,
              "profile",
            )}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Building2
                  className="h-5 w-5 shrink-0 text-duo-secondary"
                  aria-hidden
                />
                <h2 className="font-bold text-duo-fg">{profile.name}</h2>
              </div>
            </DuoCard.Header>
            <p className="mb-4 text-sm font-medium text-duo-fg">
              Plano {profile.plan}
            </p>
            <div className="space-y-3">
              <GymSettingsFieldCard
                title="Endereço"
                description="Opcional"
                iconBg="bg-duo-green/10"
                iconClassName="text-duo-green"
                icon={MapPin}
              >
                <DuoInput.Simple
                  id="gym-settings-address"
                  value={info.address}
                  onChange={(event) =>
                    onInfoChange("address", event.target.value)
                  }
                  placeholder="Opcional"
                  className="mt-2"
                />
              </GymSettingsFieldCard>

              <GymSettingsFieldCard
                title="Telefone"
                description="Opcional"
                iconBg="bg-duo-blue/10"
                iconClassName="text-duo-blue"
                icon={Phone}
              >
                <DuoInput.Simple
                  id="gym-settings-phone"
                  value={info.phone}
                  onChange={(event) =>
                    onInfoChange("phone", event.target.value)
                  }
                  placeholder="Opcional"
                  className="mt-2"
                />
              </GymSettingsFieldCard>

              <GymSettingsFieldCard
                title="Email"
                description="Não pode ser alterado aqui"
                iconBg="bg-duo-bg-elevated"
                iconClassName="text-duo-fg-muted"
                icon={Mail}
              >
                <p className="mt-2 text-sm font-medium text-duo-fg">
                  {profile.email || "--"}
                </p>
              </GymSettingsFieldCard>

              <GymSettingsFieldCard
                title="CNPJ"
                description="Opcional"
                iconBg="bg-duo-purple/10"
                iconClassName="text-duo-purple"
                icon={FileText}
              >
                <DuoInput.Simple
                  id="gym-settings-cnpj"
                  value={info.cnpj}
                  onChange={(event) =>
                    onInfoChange("cnpj", event.target.value)
                  }
                  placeholder="Opcional"
                  className="mt-2"
                />
              </GymSettingsFieldCard>

              <GymSettingsFieldCard
                title="Chave PIX para Recebimentos"
                description="Os pagamentos dos alunos serão transferidos para esta chave"
                iconBg="bg-duo-yellow/10"
                iconClassName="text-duo-yellow"
                icon={CreditCard}
              >
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <DuoSelect.Simple
                    options={PIX_KEY_OPTIONS}
                    value={info.pixKeyType || undefined}
                    onChange={(value) => onInfoChange("pixKeyType", value)}
                    placeholder="Tipo de chave"
                    className="min-w-[180px] sm:min-w-0 sm:flex-1"
                  />
                  <DuoInput.Simple
                    value={info.pixKey}
                    onChange={(event) =>
                      onInfoChange("pixKey", event.target.value)
                    }
                    placeholder={resolvePixPlaceholder(info.pixKeyType)}
                    className="flex-1"
                  />
                </div>
              </GymSettingsFieldCard>

              {hasInfoChanges ? (
                <div>
                  <DuoButton
                    onClick={onSaveInfo}
                    disabled={saving}
                    className="w-full"
                    data-testid={createTestSelector(
                      gymSettingsScreenContract.testId,
                      "save-info",
                    )}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Salvar alterações"
                    )}
                  </DuoButton>
                </div>
              ) : null}

              {saveError ? (
                <p className="text-sm font-medium text-red-600">{saveError}</p>
              ) : null}
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.2}>
          <DuoCard.Root
            variant="blue"
            padding="md"
            data-testid={createTestSelector(
              gymSettingsScreenContract.testId,
              "schedule",
            )}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Clock
                  className="h-5 w-5 shrink-0 text-duo-secondary"
                  aria-hidden
                />
                <h2 className="font-bold text-duo-fg">
                  Horários e Dias de Funcionamento
                </h2>
              </div>
            </DuoCard.Header>
            <p className="mb-4 text-sm text-duo-fg-muted">
              Marque os dias em que a academia abre e defina o horário de cada
              um.
            </p>
            <div className="space-y-2">
              {GYM_SETTINGS_WEEKDAYS.map((day) => {
                const schedule = daySchedules[day.id];
                if (!schedule) {
                  return null;
                }

                return (
                  <div
                    key={day.id}
                    className={cn(
                      "rounded-xl border-2 p-3 transition-all",
                      schedule.enabled
                        ? "border-duo-secondary/40 bg-duo-secondary/5"
                        : "border-duo-border bg-duo-bg-elevated/50",
                    )}
                  >
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                      <label
                        className={cn(
                          "flex cursor-pointer shrink-0",
                          schedule.enabled
                            ? "flex-col items-start gap-1"
                            : "items-center gap-2",
                        )}
                      >
                        {schedule.enabled ? (
                          <span className="text-sm font-bold text-duo-fg">
                            {day.label}
                          </span>
                        ) : null}

                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(event) =>
                              onDayScheduleChange(
                                day.id,
                                "enabled",
                                event.target.checked,
                              )
                            }
                            className="peer sr-only"
                          />
                          <div className="h-6 w-11 rounded-full bg-duo-border transition-colors peer-checked:bg-duo-secondary" />
                          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-duo-bg-card shadow-sm transition-transform peer-checked:translate-x-5" />
                        </div>

                        {!schedule.enabled ? (
                          <span className="text-sm font-bold text-duo-fg">
                            {day.label}
                          </span>
                        ) : null}
                      </label>

                      {schedule.enabled ? (
                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">
                          <DuoInput.Simple
                            type="time"
                            value={schedule.open}
                            onChange={(event) =>
                              onDayScheduleChange(
                                day.id,
                                "open",
                                event.target.value,
                              )
                            }
                            className="w-24 min-w-0"
                            inputClassName="h-8 px-2 py-1 text-sm"
                          />
                          <span className="shrink-0 text-duo-fg-muted">-</span>
                          <DuoInput.Simple
                            type="time"
                            value={schedule.close}
                            onChange={(event) =>
                              onDayScheduleChange(
                                day.id,
                                "close",
                                event.target.value,
                              )
                            }
                            className="w-24 min-w-0"
                            inputClassName="h-8 px-2 py-1 text-sm"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasScheduleChanges ? (
              <div className="mt-4">
                <DuoButton
                  onClick={onSaveSchedules}
                  disabled={saving}
                  className="w-full"
                  data-testid={createTestSelector(
                    gymSettingsScreenContract.testId,
                    "save-schedule",
                  )}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar horários"
                  )}
                </DuoButton>
              </div>
            ) : null}

            {saveError ? (
              <p className="mt-3 text-sm font-medium text-red-600">
                {saveError}
              </p>
            ) : null}
          </DuoCard.Root>
        </SlideIn>

        {plansSlot ? (
          <SlideIn delay={0.3}>
            <div
              data-testid={createTestSelector(
                gymSettingsScreenContract.testId,
                "plans",
              )}
            >
              {plansSlot}
            </div>
          </SlideIn>
        ) : null}

        {teamSlot ? (
          <SlideIn delay={0.4}>
            <div
              data-testid={createTestSelector(
                gymSettingsScreenContract.testId,
                "team",
              )}
            >
              {teamSlot}
            </div>
          </SlideIn>
        ) : null}

        <SlideIn delay={0.5}>
          <div
            data-testid={createTestSelector(
              gymSettingsScreenContract.testId,
              "account",
            )}
          >
            <GymSettingsAccountCard
              isAdmin={Boolean(canSwitchToStudent)}
              onSwitchToStudent={onSwitchToStudent ?? (() => undefined)}
              onLogout={onLogout}
            />
          </div>
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
