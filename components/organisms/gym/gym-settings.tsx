"use client";

import {
  Building2,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard } from "@/components/duo";
import { DuoInput } from "@/components/duo";
import { DuoSelect } from "@/components/duo";
import { useUserSession } from "@/hooks/use-user-session";
import type { GymProfile, MembershipPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
	GymSettingsAccountCard,
	GymSettingsHeader,
	GymSettingsOtherCard,
} from "./gym-settings/index";
import { MembershipPlansPage } from "./membership-plans-page";

const WEEKDAYS = [
  { id: "monday", label: "Segunda" },
  { id: "tuesday", label: "Terça" },
  { id: "wednesday", label: "Quarta" },
  { id: "thursday", label: "Quinta" },
  { id: "friday", label: "Sexta" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
] as const;

const DEFAULT_OPEN = "06:00";
const DEFAULT_CLOSE = "22:00";

type DaySchedule = { open: string; close: string; enabled: boolean };

interface GymSettingsPageProps {
  profile: GymProfile;
  plans?: MembershipPlan[];
  userInfo?: { isAdmin: boolean; role: string | null };
}

export function GymSettingsPage({
  profile: initialProfile,
  plans = [],
  userInfo = { isAdmin: false, role: null },
}: GymSettingsPageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [address, setAddress] = useState(initialProfile.address ?? "");
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [cnpj, setCnpj] = useState(initialProfile.cnpj ?? "");
  const [pixKeyType, setPixKeyType] = useState<string>(
    initialProfile.pixKeyType ?? "",
  );
  const [pixKey, setPixKey] = useState(initialProfile.pixKey ?? "");

  // Horários por dia (ex: sexta 18h, outros 22h)
  const parseInitialSchedules = (): Record<string, DaySchedule> => {
    const oh = initialProfile.openingHours;
    const days = oh?.days ?? [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const defaultOpen = oh?.open ?? DEFAULT_OPEN;
    const defaultClose = oh?.close ?? DEFAULT_CLOSE;
    const byDay = oh?.byDay ?? {};
    const result: Record<string, DaySchedule> = {};
    for (const d of WEEKDAYS) {
      const override = byDay[d.id];
      result[d.id] = {
        open: override?.open ?? defaultOpen,
        close: override?.close ?? defaultClose,
        enabled: days.includes(d.id),
      };
    }
    return result;
  };
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>(
    parseInitialSchedules,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Sincroniza quando troca de academia (profile vem de outra gym)
  useEffect(() => {
    setProfile(initialProfile);
    setAddress(initialProfile.address ?? "");
    setPhone(initialProfile.phone ?? "");
    setCnpj(initialProfile.cnpj ?? "");
    setPixKeyType(initialProfile.pixKeyType ?? "");
    setPixKey(initialProfile.pixKey ?? "");
    setDaySchedules(parseInitialSchedules());
  }, [initialProfile?.id]);

  const {
    isAdmin: serverIsAdmin,
    role: serverRole,
    isLoading: _sessionLoading,
  } = useUserSession();

  const isAdmin = serverIsAdmin || serverRole === "ADMIN";

  const updateDaySchedule = (
    dayId: string,
    field: keyof DaySchedule,
    value: string | boolean,
  ) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value },
    }));
  };

  const buildPayload = (
    section: "info" | "schedules",
  ): Record<string, import("@/lib/types/api-error").JsonValue> => {
    const payload: Record<string, import("@/lib/types/api-error").JsonValue> = {};
    if (section === "info") {
      if (address !== (profile.address ?? "")) {
        payload.address = address.trim() || null;
      }
      if (phone !== (profile.phone ?? "")) {
        payload.phone = phone.trim() || null;
      }
      if (cnpj !== (profile.cnpj ?? "")) {
        payload.cnpj = cnpj.trim() || null;
      }
      const VALID_PIX_TYPES = ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM"];
      const hasValidPixType = VALID_PIX_TYPES.includes(pixKeyType);
      const pixKeyTrimmed = pixKey.trim();
      const prevPix = profile.pixKey ?? "";
      const prevPixType = profile.pixKeyType ?? "";
      if (pixKeyTrimmed !== prevPix || pixKeyType !== prevPixType) {
        payload.pixKey =
          hasValidPixType && pixKeyTrimmed ? pixKeyTrimmed : null;
        payload.pixKeyType =
          hasValidPixType && pixKeyTrimmed ? pixKeyType : null;
      }
    }
    if (section === "schedules") {
      const openDays = Object.entries(daySchedules)
        .filter(([, s]) => s.enabled)
        .map(([id]) => id);
      const byDay: Record<string, { open: string; close: string }> = {};
      for (const [id, s] of Object.entries(daySchedules)) {
        if (s.enabled) byDay[id] = { open: s.open, close: s.close };
      }
      payload.openingHours = {
        days: openDays,
        byDay: Object.keys(byDay).length > 0 ? byDay : null,
        open: DEFAULT_OPEN,
        close: DEFAULT_CLOSE,
      };
    }
    return payload;
  };

  const handleSaveInfo = async () => {
    setSaveError("");
    const VALID_PIX_TYPES = ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM"];
    const hasValidPixType = VALID_PIX_TYPES.includes(pixKeyType);
    const pixKeyTrimmed = pixKey.trim();
    if (pixKeyTrimmed && !hasValidPixType) {
      setSaveError("Selecione um tipo de chave PIX válido (CPF, CNPJ, etc.)");
      return;
    }
    if (hasValidPixType && !pixKeyTrimmed) {
      setSaveError("Informe o valor da chave PIX");
      return;
    }
    const payload = buildPayload("info");
    if (Object.keys(payload).length === 0) return;
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const { data } = await apiClient.patch<{ profile: GymProfile }>(
        "/api/gyms/profile",
        payload,
      );
      if (data.profile) setProfile(data.profile);
      setSaveError("");
      router.refresh();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { details?: Record<string, string | number | boolean | object | null> } } }).response
              ?.data
          : null;
      const details =
        msg && typeof msg === "object" && "details" in msg
          ? (msg as { details?: Record<string, string | number | boolean | object | null> }).details
          : null;
      const errMsg =
        Array.isArray(details) && details.length > 0
          ? ((details[0] as { message?: string }).message ??
            "Erro de validação")
          : err instanceof Error
            ? err.message
            : "Erro ao salvar. Tente novamente.";
      setSaveError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedules = async () => {
    setSaveError("");
    const payload = buildPayload("schedules");
    if (Object.keys(payload).length === 0) return;
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const { data } = await apiClient.patch<{ profile: GymProfile }>(
        "/api/gyms/profile",
        payload,
      );
      if (data.profile) setProfile(data.profile);
      setSaveError("");
      router.refresh();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { details?: Record<string, string | number | boolean | object | null> } } }).response
              ?.data
          : null;
      const details =
        msg && typeof msg === "object" && "details" in msg
          ? (msg as { details?: Record<string, string | number | boolean | object | null> }).details
          : null;
      const errMsg =
        Array.isArray(details) && details.length > 0
          ? ((details[0] as { message?: string }).message ??
            "Erro de validação")
          : err instanceof Error
            ? err.message
            : "Erro ao salvar. Tente novamente.";
      setSaveError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const hasInfoChanges =
    address !== (profile.address ?? "") ||
    phone !== (profile.phone ?? "") ||
    cnpj !== (profile.cnpj ?? "") ||
    pixKey !== (profile.pixKey ?? "") ||
    pixKeyType !== (profile.pixKeyType ?? "");

  const hasScheduleChanges = (() => {
    const oh = profile.openingHours;
    const prevDays = (oh?.days ?? []).sort();
    const currDays = Object.entries(daySchedules)
      .filter(([, s]) => s.enabled)
      .map(([id]) => id)
      .sort();
    if (JSON.stringify(prevDays) !== JSON.stringify(currDays)) return true;
    const prevByDay = oh?.byDay ?? {};
    for (const [id, s] of Object.entries(daySchedules)) {
      if (!s.enabled) continue;
      const prev = prevByDay[id] ?? {
        open: oh?.open ?? DEFAULT_OPEN,
        close: oh?.close ?? DEFAULT_CLOSE,
      };
      if (prev.open !== s.open || prev.close !== s.close) return true;
    }
    return false;
  })();

  const handleLogout = async () => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post("/api/auth/sign-out");

      router.push("/welcome");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleSwitchToStudent = () => {
    router.push("/student");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <GymSettingsHeader />

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
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
            {[
              {
                title: "Endereço",
                description: "Opcional",
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
                title: "Telefone",
                description: "Opcional",
                iconBg: "bg-duo-blue/10",
                Icon: Phone,
                iconClass: "text-duo-blue",
                content: (
                  <DuoInput.Simple
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Opcional"
                    className="mt-2"
                  />
                ),
              },
              {
                title: "Email",
                description: "Não pode ser alterado aqui",
                iconBg: "bg-duo-bg-elevated",
                Icon: Mail,
                iconClass: "text-duo-fg-muted",
                content: (
                  <p className="mt-2 text-sm font-medium text-duo-fg">
                    {profile.email}
                  </p>
                ),
              },
              {
                title: "CNPJ",
                description: "Opcional",
                iconBg: "bg-duo-purple/10",
                Icon: FileText,
                iconClass: "text-duo-purple",
                content: (
                  <DuoInput.Simple
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Opcional"
                    className="mt-2"
                  />
                ),
              },
              {
                title: "Chave PIX para Recebimentos",
                description:
                  "Os pagamentos dos alunos serão transferidos para esta chave",
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
                                  ? "Chave aleatória (e-mail)"
                                  : "Selecione o tipo primeiro"
                      }
                      className="flex-1"
                    />
                  </div>
                ),
              },
            ].map((field, index) => (
              <motion.div
                key={field.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
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
                        <field.Icon className={cn("h-5 w-5", field.iconClass)} />
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
              </motion.div>
            ))}
            {hasInfoChanges && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <DuoButton
                  onClick={handleSaveInfo}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar alterações"
                  )}
                </DuoButton>
              </motion.div>
            )}
            {saveError && (
              <p className="text-sm font-medium text-red-600">{saveError}</p>
            )}
          </div>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard.Root variant="blue" padding="md">
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
            Marque os dias em que a academia abre e defina o horário de cada um
          </p>
          <div className="space-y-2">
            {WEEKDAYS.map((day, index) => {
              const s = daySchedules[day.id];
              if (!s) return null;
              return (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className={cn(
                    "rounded-xl border-2 p-3 transition-all grid grid-cols-[1fr_auto] items-center gap-3",
                    s.enabled
                      ? "border-duo-secondary/40 bg-duo-secondary/5"
                      : "border-duo-border bg-duo-bg-elevated/50",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2 shrink-0">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={(e) =>
                            updateDaySchedule(
                              day.id,
                              "enabled",
                              e.target.checked,
                            )
                          }
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-duo-border transition-colors peer-checked:bg-duo-secondary" />
                        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-duo-bg-card shadow-sm transition-transform peer-checked:translate-x-5" />
                      </div>
                      <span className="text-sm font-bold text-duo-fg">
                        {day.label}
                      </span>
                    </label>
                  </div>
                  {s.enabled && (
                    <div className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0">
                      <DuoInput.Simple
                        type="time"
                        value={s.open}
                        onChange={(e) =>
                          updateDaySchedule(day.id, "open", e.target.value)
                        }
                        className="h-8 w-24 min-w-0 text-sm"
                      />
                      <span className="text-duo-fg-muted shrink-0">–</span>
                      <DuoInput.Simple
                        type="time"
                        value={s.close}
                        onChange={(e) =>
                          updateDaySchedule(day.id, "close", e.target.value)
                        }
                        className="h-8 w-24 min-w-0 text-sm"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {hasScheduleChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-4"
            >
              <DuoButton
                onClick={handleSaveSchedules}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar horários"
                )}
              </DuoButton>
            </motion.div>
          )}
          {saveError && (
            <p className="mt-3 text-sm font-medium text-red-600">{saveError}</p>
          )}
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <MembershipPlansPage plans={plans} />
      </SlideIn>

      <SlideIn delay={0.4}>
        <GymSettingsOtherCard />
      </SlideIn>

      <SlideIn delay={0.5}>
        <GymSettingsAccountCard
          isAdmin={isAdmin || userInfo?.role === "ADMIN"}
          onSwitchToStudent={handleSwitchToStudent}
          onLogout={handleLogout}
        />
      </SlideIn>
    </div>
  );
}
