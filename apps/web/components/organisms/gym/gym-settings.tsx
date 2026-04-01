"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  GymSettingsScreen,
  GYM_SETTINGS_WEEKDAYS,
  type GymSettingsDaySchedule,
  type GymSettingsInfoState,
} from "@/components/screens/gym";
import { useFormBaseline } from "@/hooks/shared/use-form-baseline";
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

function createGymSettingsDaySchedules(
  profile: GymProfile,
): Record<string, GymSettingsDaySchedule> {
  const openingHours = profile.openingHours;
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
}

function areGymSettingsDaySchedulesEqual(
  current: Record<string, GymSettingsDaySchedule>,
  next: Record<string, GymSettingsDaySchedule>,
) {
  for (const day of GYM_SETTINGS_WEEKDAYS) {
    const currentDay = current[day.id];
    const nextDay = next[day.id];

    if (
      currentDay?.enabled !== nextDay?.enabled ||
      currentDay?.open !== nextDay?.open ||
      currentDay?.close !== nextDay?.close
    ) {
      return false;
    }
  }

  return true;
}

export function GymSettingsPage({
  profile: initialProfile,
  plans = [],
}: GymSettingsPageProps) {
  const router = useRouter();
  const { profile: storeProfile, actions } = useGym("profile", "actions");
  const profile = storeProfile ?? initialProfile;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    draft: info,
    baseline: baselineInfo,
    isDirty: hasInfoChanges,
    setDraft: setInfo,
    rebaseOnSuccess: rebaseInfo,
  } = useFormBaseline({
    snapshot: profile,
    toDraft: createGymSettingsInfoState,
    isEqual: areGymSettingsInfoStatesEqual,
  });

  const {
    draft: daySchedules,
    isDirty: hasScheduleChanges,
    setDraft: setDaySchedules,
    rebaseOnSuccess: rebaseSchedules,
  } = useFormBaseline({
    snapshot: profile,
    toDraft: createGymSettingsDaySchedules,
    isEqual: areGymSettingsDaySchedulesEqual,
  });

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

  const buildInfoPayload = (): Record<
    string,
    import("@/lib/types/api-error").JsonValue
  > => {
    const payload: Record<string, import("@/lib/types/api-error").JsonValue> =
      {};

    if (info.address !== baselineInfo.address) {
      payload.address = info.address.trim() || null;
    }

    if (info.phone !== baselineInfo.phone) {
      payload.phone = info.phone.trim() || null;
    }

    if (info.cnpj !== baselineInfo.cnpj) {
      payload.cnpj = info.cnpj.trim() || null;
    }

    const validPixTypes = ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM"];
    const hasValidPixType = validPixTypes.includes(info.pixKeyType);
    const pixKeyTrimmed = info.pixKey.trim();

    if (
      pixKeyTrimmed !== baselineInfo.pixKey ||
      info.pixKeyType !== baselineInfo.pixKeyType
    ) {
      payload.pixKey =
        hasValidPixType && pixKeyTrimmed ? pixKeyTrimmed : null;
      payload.pixKeyType =
        hasValidPixType && pixKeyTrimmed ? info.pixKeyType : null;
    }

    return payload;
  };

  const buildSchedulesPayload = (): Record<
    string,
    import("@/lib/types/api-error").JsonValue
  > => {
    const openDays = Object.entries(daySchedules)
      .filter(([, schedule]) => schedule.enabled)
      .map(([id]) => id);
    const byDay: Record<string, { open: string; close: string }> = {};

    for (const [id, schedule] of Object.entries(daySchedules)) {
      if (!schedule.enabled) {
        continue;
      }

      byDay[id] = {
        open: schedule.open,
        close: schedule.close,
      };
    }

    return {
      openingHours: {
        days: openDays,
        byDay: Object.keys(byDay).length > 0 ? byDay : null,
        open: DEFAULT_OPEN,
        close: DEFAULT_CLOSE,
      },
    };
  };

  const getApiErrorMessage = (error: unknown) => {
    const responseData =
      error && typeof error === "object" && "response" in error
        ? (
            error as {
              response?: {
                data?: {
                  details?: Record<string, string | number | boolean | object | null>;
                };
              };
            }
          ).response?.data
        : null;
    const details =
      responseData && typeof responseData === "object" && "details" in responseData
        ? (
            responseData as {
              details?: Record<string, string | number | boolean | object | null>;
            }
          ).details
        : null;

    if (Array.isArray(details) && details.length > 0) {
      return (
        (details[0] as { message?: string }).message ?? "Erro de validacao"
      );
    }

    return error instanceof Error
      ? error.message
      : "Erro ao salvar. Tente novamente.";
  };

  const handleSaveInfo = async () => {
    setSaveError("");

    const validPixTypes = ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM"];
    const hasValidPixType = validPixTypes.includes(info.pixKeyType);
    const pixKeyTrimmed = info.pixKey.trim();

    if (pixKeyTrimmed && !hasValidPixType) {
      setSaveError("Selecione um tipo de chave PIX valido.");
      return;
    }

    if (hasValidPixType && !pixKeyTrimmed) {
      setSaveError("Informe o valor da chave PIX.");
      return;
    }

    const payload = buildInfoPayload();

    if (Object.keys(payload).length === 0) {
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await actions.updateProfile(payload);
      rebaseInfo(createGymSettingsInfoState(updatedProfile ?? profile));
      setSaveError("");
    } catch (error) {
      setSaveError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedules = async () => {
    setSaveError("");

    if (!hasScheduleChanges) {
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await actions.updateProfile(buildSchedulesPayload());
      rebaseSchedules(createGymSettingsDaySchedules(updatedProfile ?? profile));
      setSaveError("");
    } catch (error) {
      setSaveError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

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
