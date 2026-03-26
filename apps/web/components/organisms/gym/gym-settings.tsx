"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GymSettingsScreen, GYM_SETTINGS_WEEKDAYS, type GymSettingsDaySchedule, type GymSettingsInfoState } from "@/components/screens/gym";
import { useGym } from "@/hooks/use-gym";
import { useUserSession } from "@/hooks/use-user-session";
import type { GymProfile, MembershipPlan } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { GymSettingsTeamCard } from "./gym-settings/gym-settings-team-card";
import { MembershipPlansPage } from "./membership-plans-page";

const DEFAULT_OPEN = "06:00";
const DEFAULT_CLOSE = "22:00";

interface GymSettingsPageProps {
  profile: GymProfile;
  plans?: MembershipPlan[];
  userInfo?: { isAdmin: boolean; role: string | null };
}

function createGymSettingsInfoState(profile: GymProfile): GymSettingsInfoState {
  return {
    address: profile.address ?? "",
    phone: profile.phone ?? "",
    cnpj: profile.cnpj ?? "",
    pixKeyType: profile.pixKeyType ?? "",
    pixKey: profile.pixKey ?? "",
  };
}

function areGymSettingsInfoStatesEqual(
  current: GymSettingsInfoState,
  next: GymSettingsInfoState,
) {
  return (
    current.address === next.address &&
    current.phone === next.phone &&
    current.cnpj === next.cnpj &&
    current.pixKeyType === next.pixKeyType &&
    current.pixKey === next.pixKey
  );
}

export function GymSettingsPage({
  profile: initialProfile,
  plans = [],
}: GymSettingsPageProps) {
  const router = useRouter();
  const actions = useGym("actions");
  const [profile, setProfile] = useState(initialProfile);
  const [info, setInfo] = useState<GymSettingsInfoState>(() =>
    createGymSettingsInfoState(initialProfile),
  );

  const parseInitialSchedules = useCallback((): Record<string, GymSettingsDaySchedule> => {
    const openingHours = initialProfile.openingHours;
    const enabledDays = openingHours?.days ?? [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const defaultOpen = openingHours?.open ?? DEFAULT_OPEN;
    const defaultClose = openingHours?.close ?? DEFAULT_CLOSE;
    const byDay = openingHours?.byDay ?? {};
    const schedules: Record<string, GymSettingsDaySchedule> = {};

    for (const day of GYM_SETTINGS_WEEKDAYS) {
      const override = byDay[day.id];
      schedules[day.id] = {
        open: override?.open ?? defaultOpen,
        close: override?.close ?? defaultClose,
        enabled: enabledDays.includes(day.id),
      };
    }

    return schedules;
  }, [initialProfile.openingHours]);

  const [daySchedules, setDaySchedules] = useState<Record<string, GymSettingsDaySchedule>>(
    parseInitialSchedules,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const nextInfo = createGymSettingsInfoState(initialProfile);
    const nextSchedules = parseInitialSchedules();

    setProfile((current) =>
      current.id === initialProfile.id ? current : initialProfile,
    );
    setInfo((current) =>
      areGymSettingsInfoStatesEqual(current, nextInfo) ? current : nextInfo,
    );
    setDaySchedules((current) => {
      const currentKey = JSON.stringify(current);
      const nextKey = JSON.stringify(nextSchedules);
      return currentKey === nextKey ? current : nextSchedules;
    });
  }, [initialProfile, parseInitialSchedules]);

  const {
    isAdmin: serverIsAdmin,
    role: serverRole,
  } = useUserSession();

  const isAdmin = serverIsAdmin || serverRole === "ADMIN";
  const canSwitchToStudent = isAdmin || serverRole === "GYM";

  const updateDaySchedule = (
    dayId: string,
    field: keyof GymSettingsDaySchedule,
    value: string | boolean,
  ) => {
    setDaySchedules((current) => ({
      ...current,
      [dayId]: { ...current[dayId], [field]: value },
    }));
  };

  const buildPayload = (
    section: "info" | "schedules",
  ): Record<string, import("@/lib/types/api-error").JsonValue> => {
    const payload: Record<string, import("@/lib/types/api-error").JsonValue> =
      {};

    if (section === "info") {
      if (info.address !== (profile.address ?? "")) {
        payload.address = info.address.trim() || null;
      }

      if (info.phone !== (profile.phone ?? "")) {
        payload.phone = info.phone.trim() || null;
      }

      if (info.cnpj !== (profile.cnpj ?? "")) {
        payload.cnpj = info.cnpj.trim() || null;
      }

      const validPixTypes = ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM"];
      const hasValidPixType = validPixTypes.includes(info.pixKeyType);
      const pixKeyTrimmed = info.pixKey.trim();
      const previousPixKey = profile.pixKey ?? "";
      const previousPixType = profile.pixKeyType ?? "";

      if (
        pixKeyTrimmed !== previousPixKey ||
        info.pixKeyType !== previousPixType
      ) {
        payload.pixKey =
          hasValidPixType && pixKeyTrimmed ? pixKeyTrimmed : null;
        payload.pixKeyType =
          hasValidPixType && pixKeyTrimmed ? info.pixKeyType : null;
      }
    }

    if (section === "schedules") {
      const openDays = Object.entries(daySchedules)
        .filter(([, schedule]) => schedule.enabled)
        .map(([id]) => id);
      const byDay: Record<string, { open: string; close: string }> = {};

      for (const [id, schedule] of Object.entries(daySchedules)) {
        if (schedule.enabled) {
          byDay[id] = {
            open: schedule.open,
            close: schedule.close,
          };
        }
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

    const validPixTypes = ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM"];
    const hasValidPixType = validPixTypes.includes(info.pixKeyType);
    const pixKeyTrimmed = info.pixKey.trim();

    if (pixKeyTrimmed && !hasValidPixType) {
      setSaveError("Selecione um tipo de chave PIX válido (CPF, CNPJ, etc.)");
      return;
    }

    if (hasValidPixType && !pixKeyTrimmed) {
      setSaveError("Informe o valor da chave PIX");
      return;
    }

    const payload = buildPayload("info");

    if (Object.keys(payload).length === 0) {
      return;
    }

    setSaving(true);

    try {
      await actions.updateProfile(payload);
      setSaveError("");
    } catch (error) {
      const responseData =
        error && typeof error === "object" && "response" in error
          ? (
              error as {
                response?: {
                  data?: {
                    details?: Record<
                      string,
                      string | number | boolean | object | null
                    >;
                  };
                };
              }
            ).response?.data
          : null;
      const details =
        responseData && typeof responseData === "object" && "details" in responseData
          ? (
              responseData as {
                details?: Record<
                  string,
                  string | number | boolean | object | null
                >;
              }
            ).details
          : null;
      const errorMessage =
        Array.isArray(details) && details.length > 0
          ? ((details[0] as { message?: string }).message ??
            "Erro de validação")
          : error instanceof Error
            ? error.message
            : "Erro ao salvar. Tente novamente.";
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedules = async () => {
    setSaveError("");
    const payload = buildPayload("schedules");

    if (Object.keys(payload).length === 0) {
      return;
    }

    setSaving(true);

    try {
      await actions.updateProfile(payload);
      setSaveError("");
    } catch (error) {
      const responseData =
        error && typeof error === "object" && "response" in error
          ? (
              error as {
                response?: {
                  data?: {
                    details?: Record<
                      string,
                      string | number | boolean | object | null
                    >;
                  };
                };
              }
            ).response?.data
          : null;
      const details =
        responseData && typeof responseData === "object" && "details" in responseData
          ? (
              responseData as {
                details?: Record<
                  string,
                  string | number | boolean | object | null
                >;
              }
            ).details
          : null;
      const errorMessage =
        Array.isArray(details) && details.length > 0
          ? ((details[0] as { message?: string }).message ??
            "Erro de validação")
          : error instanceof Error
            ? error.message
            : "Erro ao salvar. Tente novamente.";
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const baselineInfo = createGymSettingsInfoState(profile);
  const hasInfoChanges = !areGymSettingsInfoStatesEqual(info, baselineInfo);

  const hasScheduleChanges = (() => {
    const openingHours = profile.openingHours;
    const previousDays = (openingHours?.days ?? []).sort();
    const currentDays = Object.entries(daySchedules)
      .filter(([, schedule]) => schedule.enabled)
      .map(([id]) => id)
      .sort();

    if (JSON.stringify(previousDays) !== JSON.stringify(currentDays)) {
      return true;
    }

    const previousByDay = openingHours?.byDay ?? {};

    for (const [id, schedule] of Object.entries(daySchedules)) {
      if (!schedule.enabled) {
        continue;
      }

      const previous = previousByDay[id] ?? {
        open: openingHours?.open ?? DEFAULT_OPEN,
        close: openingHours?.close ?? DEFAULT_CLOSE,
      };

      if (previous.open !== schedule.open || previous.close !== schedule.close) {
        return true;
      }
    }

    return false;
  })();

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().signOut();
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
    <GymSettingsScreen
      profile={{
        name: profile.name,
        plan: profile.plan,
        email: profile.email,
      }}
      info={info}
      daySchedules={daySchedules}
      hasInfoChanges={hasInfoChanges}
      hasScheduleChanges={hasScheduleChanges}
      saving={saving}
      saveError={saveError}
      canSwitchToStudent={canSwitchToStudent}
      onInfoChange={(field, value) =>
        setInfo((current) =>
          current[field] === value ? current : { ...current, [field]: value },
        )
      }
      onDayScheduleChange={updateDaySchedule}
      onSaveInfo={handleSaveInfo}
      onSaveSchedules={handleSaveSchedules}
      onLogout={handleLogout}
      onSwitchToStudent={handleSwitchToStudent}
      plansSlot={<MembershipPlansPage plans={plans} />}
      teamSlot={<GymSettingsTeamCard />}
    />
  );
}
