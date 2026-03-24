import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { colors, radius, spacing, typography } from "../../theme";
import type {
  PlanSlotData,
  StudentHomeData,
  TrainingLibraryPlanSummary,
  Unit,
} from "./types";

type StudentLearnScreenProps = {
  onActivateLibraryPlan?: (libraryPlanId: string) => Promise<void>;
  onCreateLibraryPlan?: () => Promise<void>;
  onCreateWeeklyPlan?: () => Promise<void>;
  data: StudentHomeData;
  onGeneratePlan?: () => Promise<void>;
  onOpenLibraryPlan?: (libraryPlanId: string) => void;
  onOpenWeeklyPlanEditor?: () => void;
  onOpenWorkout: (workoutId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

const WEEKDAY_LABELS = [
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
  "Domingo",
];

function resolvePlanSlots(data: StudentHomeData) {
  if (data.weeklyPlan?.slots?.length) {
    return data.weeklyPlan.slots;
  }

  const fallbackSlots: PlanSlotData[] = [];

  data.units.slice(0, 7).forEach((unit, index) => {
    const firstWorkout = unit.workouts.find((workout) => !workout.locked);

    fallbackSlots.push({
      dayOfWeek: index,
      id: unit.id,
      type: firstWorkout ? "workout" : "rest",
      workout: firstWorkout,
    });
  });

  return fallbackSlots;
}

function getWorkoutVariant(slot: PlanSlotData, todayIndex: number) {
  if (slot.type === "rest" || !slot.workout) {
    return "rest";
  }

  if (slot.workout.completed) {
    return "done";
  }

  if (slot.dayOfWeek === todayIndex) {
    return "today";
  }

  if (slot.dayOfWeek < todayIndex) {
    return "missed";
  }

  return "upcoming";
}

function getVariantStyles(variant: ReturnType<typeof getWorkoutVariant>) {
  switch (variant) {
    case "done":
      return {
        badge: "Completo",
        badgeColor: colors.primary,
        icon: "checkmark-circle-outline" as const,
        iconColor: colors.primary,
      };
    case "today":
      return {
        badge: "Hoje",
        badgeColor: colors.warning,
        icon: "flash-outline" as const,
        iconColor: colors.warning,
      };
    case "missed":
      return {
        badge: "Pendente",
        badgeColor: colors.danger,
        icon: "alert-circle-outline" as const,
        iconColor: colors.danger,
      };
    case "rest":
      return {
        badge: "Descanso",
        badgeColor: colors.foregroundMuted,
        icon: "bed-outline" as const,
        iconColor: colors.foregroundMuted,
      };
    default:
      return {
        badge: "Proximo",
        badgeColor: colors.blue,
        icon: "barbell-outline" as const,
        iconColor: colors.blue,
      };
  }
}

function EmptyPlanState({
  onCreateWeeklyPlan,
  onGeneratePlan,
}: {
  onCreateWeeklyPlan?: () => Promise<void>;
  onGeneratePlan?: () => Promise<void>;
}) {
  return (
    <DuoCard>
      <View style={styles.emptyState}>
        <MaterialIcons color={colors.secondary} name="fitness-center" size={34} />
        <Text style={styles.emptyTitle}>Seu plano semanal ainda nao apareceu</Text>
        <Text style={styles.emptyDescription}>
          Gere seu plano automaticamente ou monte a semana manualmente no editor.
        </Text>
        {onGeneratePlan ? (
          <PrimaryButton onPress={() => void onGeneratePlan()} title="Gerar treinos" />
        ) : null}
        {onCreateWeeklyPlan ? (
          <SecondaryButton
            onPress={() => void onCreateWeeklyPlan()}
            title="Criar plano manual"
          />
        ) : null}
      </View>
    </DuoCard>
  );
}

function WorkoutUnitList({
  units,
}: {
  units: Unit[];
}) {
  if (units.length === 0) {
    return null;
  }

  return (
    <DuoCard>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="albums-outline" size={20} />
          <Text style={styles.cardTitle}>Biblioteca de Unidades</Text>
        </View>
      </View>

      <View style={styles.unitStack}>
        {units.map((unit) => (
          <View key={unit.id} style={styles.unitCard}>
            <View style={styles.unitMain}>
              <Text style={styles.unitTitle}>{unit.title}</Text>
              <Text style={styles.unitDescription}>{unit.description}</Text>
            </View>
            <Text style={styles.unitCount}>{unit.workouts.length} treinos</Text>
          </View>
        ))}
      </View>
    </DuoCard>
  );
}

function TrainingLibraryList({
  activeSourcePlanId,
  libraryPlans,
  onCreateLibraryPlan,
  onActivate,
  onOpenPlan,
}: {
  activeSourcePlanId?: string | null;
  libraryPlans: TrainingLibraryPlanSummary[];
  onCreateLibraryPlan?: () => Promise<void>;
  onActivate?: (libraryPlanId: string) => Promise<void>;
  onOpenPlan?: (libraryPlanId: string) => void;
}) {
  return (
    <DuoCard>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.warning} name="book-outline" size={20} />
          <Text style={styles.cardTitle}>Biblioteca de Treinos</Text>
        </View>
        {onCreateLibraryPlan ? (
          <Pressable onPress={() => void onCreateLibraryPlan()} style={styles.inlineAction}>
            <Text style={styles.inlineActionText}>Criar</Text>
          </Pressable>
        ) : null}
      </View>

      {libraryPlans.length === 0 ? (
        <Text style={styles.emptyDescription}>
          Nenhum template salvo ainda. Crie um plano para reutilizar depois.
        </Text>
      ) : (
        <View style={styles.unitStack}>
          {libraryPlans.map((plan) => {
            const isActive = activeSourcePlanId === plan.id;

            return (
              <View key={plan.id} style={styles.unitCard}>
                <View style={styles.unitMain}>
                  <Text style={styles.unitTitle}>{plan.title}</Text>
                  <Text style={styles.unitDescription}>
                    {plan.description ||
                      plan.preview ||
                      `${plan.estimatedDays || 0} dias de treino`}
                  </Text>
                  <Text style={styles.unitCount}>
                    {(plan.creatorType || "student").toLowerCase()} •{" "}
                    {plan.slotCount || plan.slots.length || 0} slots
                  </Text>
                  {isActive ? (
                    <Text style={styles.activePlanText}>Plano ativo nesta semana</Text>
                  ) : null}
                </View>
                <View style={styles.libraryActionStack}>
                  {onOpenPlan ? (
                    <SecondaryButton
                      onPress={() => onOpenPlan(plan.id)}
                      title="Editar"
                    />
                  ) : null}
                  {!isActive && onActivate ? (
                    <SecondaryButton
                      onPress={() => {
                        void onActivate(plan.id);
                      }}
                      title="Usar"
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </DuoCard>
  );
}

export function StudentLearnScreen({
  onActivateLibraryPlan,
  onCreateLibraryPlan,
  onCreateWeeklyPlan,
  data,
  onGeneratePlan,
  onOpenLibraryPlan,
  onOpenWeeklyPlanEditor,
  onOpenWorkout,
  onRefresh,
  refreshing,
}: StudentLearnScreenProps) {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const slots = resolvePlanSlots(data);
  const hasWeeklyPlan = slots.length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.primary}
          onRefresh={onRefresh}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Treinos</Text>
        <Text style={styles.heroSubtitle}>
          {data.weeklyPlan?.description || "Plano semanal e progresso dos workouts"}
        </Text>
      </View>

      {hasWeeklyPlan ? (
        <DuoCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons color={colors.secondary} name="calendar-outline" size={20} />
              <Text style={styles.cardTitle}>
                {data.weeklyPlan?.title || "Plano Semanal"}
              </Text>
            </View>
            {onOpenWeeklyPlanEditor ? (
              <Pressable onPress={onOpenWeeklyPlanEditor} style={styles.inlineAction}>
                <Text style={styles.inlineActionText}>Editar semana</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.slotStack}>
            {slots.map((slot, index) => {
              const variant = getWorkoutVariant(slot, todayIndex);
              const variantMeta = getVariantStyles(variant);

              return (
                <View key={`${slot.id}-${index}`} style={styles.slotCard}>
                  <View style={styles.slotDayBadge}>
                    <Text style={styles.slotDayBadgeText}>
                      {WEEKDAY_LABELS[slot.dayOfWeek] || `Dia ${slot.dayOfWeek + 1}`}
                    </Text>
                  </View>

                  <View style={styles.slotMain}>
                    <View style={styles.slotHeaderRow}>
                      <View style={styles.cardHeaderLeft}>
                        <Ionicons
                          color={variantMeta.iconColor}
                          name={variantMeta.icon}
                          size={18}
                        />
                        <Text style={styles.slotTitle}>
                          {slot.workout?.title || "Descanso"}
                        </Text>
                      </View>
                      <Text
                        style={[styles.slotBadgeText, { color: variantMeta.badgeColor }]}
                      >
                        {variantMeta.badge}
                      </Text>
                    </View>

                    <Text style={styles.slotDescription}>
                      {slot.type === "rest"
                        ? "Dia planejado para recuperacao."
                        : slot.workout?.completed
                          ? "Treino concluido e salvo no seu progresso."
                          : "Toque para abrir a execucao completa do treino."}
                    </Text>

                    {slot.type === "workout" && slot.workout ? (
                      <SecondaryButton
                        onPress={() => onOpenWorkout(slot.workout!.id)}
                        title={slot.workout.completed ? "Rever treino" : "Abrir treino"}
                      />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </DuoCard>
      ) : (
        <EmptyPlanState
          onCreateWeeklyPlan={onCreateWeeklyPlan}
          onGeneratePlan={onGeneratePlan}
        />
      )}

      <TrainingLibraryList
        activeSourcePlanId={data.weeklyPlan?.sourceLibraryPlanId ?? null}
        libraryPlans={data.libraryPlans}
        onActivate={
          onActivateLibraryPlan
            ? async (libraryPlanId) => {
                try {
                  await onActivateLibraryPlan(libraryPlanId);
                  Alert.alert(
                    "Plano enviado",
                    "A ativacao do plano foi enviada. Atualize em instantes se necessario.",
                  );
                } catch (error) {
                  Alert.alert(
                    "Nao foi possivel ativar o plano",
                    error instanceof Error ? error.message : "Erro inesperado.",
                  );
                }
              }
            : undefined
        }
        onCreateLibraryPlan={onCreateLibraryPlan}
        onOpenPlan={onOpenLibraryPlan}
      />

      <WorkoutUnitList units={data.units} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  hero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  heroTitle: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    color: colors.foregroundMuted,
    fontSize: 14,
    textAlign: "center",
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "900",
  },
  inlineAction: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  slotStack: {
    gap: spacing.sm,
  },
  slotCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  slotDayBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.blueSoft,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  slotDayBadgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  slotMain: {
    gap: spacing.sm,
  },
  slotHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  slotTitle: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "900",
  },
  slotBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  slotDescription: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  unitStack: {
    gap: spacing.sm,
  },
  unitCard: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  unitMain: {
    flex: 1,
    gap: 4,
  },
  unitTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  unitDescription: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  unitCount: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  activePlanText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  libraryActionStack: {
    gap: spacing.sm,
    minWidth: 132,
  },
});
