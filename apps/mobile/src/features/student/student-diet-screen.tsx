import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type { DailyNutrition, Meal, StudentHomeData } from "./types";

type StudentDietScreenProps = {
  data: StudentHomeData;
  onRefresh: () => void;
  onSaveNutrition: (nutrition: DailyNutrition) => Promise<void>;
  refreshing: boolean;
};

type DraftMeal = {
  calories: string;
  carbs: string;
  fats: string;
  name: string;
  protein: string;
  time: string;
  type: Meal["type"];
};

const DEFAULT_DRAFT_MEAL: DraftMeal = {
  calories: "",
  carbs: "",
  fats: "",
  name: "",
  protein: "",
  time: "",
  type: "snack",
};

const MEAL_TYPE_OPTIONS: Array<{ label: string; value: Meal["type"] }> = [
  { label: "Cafe", value: "breakfast" },
  { label: "Almoco", value: "lunch" },
  { label: "Jantar", value: "dinner" },
  { label: "Lanche", value: "snack" },
  { label: "Pre", value: "pre-workout" },
  { label: "Pos", value: "post-workout" },
];

function formatPercentage(current: number, target: number) {
  if (!target) {
    return 0;
  }

  return Math.round((current / target) * 100);
}

function recalculateNutrition(base: DailyNutrition, meals: Meal[], waterIntake: number) {
  const completedMeals = meals.filter((meal) => meal.completed);

  return {
    ...base,
    meals,
    totalCalories: completedMeals.reduce((sum, meal) => sum + meal.calories, 0),
    totalProtein: completedMeals.reduce((sum, meal) => sum + meal.protein, 0),
    totalCarbs: completedMeals.reduce((sum, meal) => sum + meal.carbs, 0),
    totalFats: completedMeals.reduce((sum, meal) => sum + meal.fats, 0),
    waterIntake,
  };
}

function AddMealModal({
  draft,
  onChangeDraft,
  onClose,
  onSubmit,
  visible,
}: {
  draft: DraftMeal;
  onChangeDraft: (next: DraftMeal) => void;
  onClose: () => void;
  onSubmit: () => void;
  visible: boolean;
}) {
  const updateField = (key: keyof DraftMeal, value: string) => {
    onChangeDraft({
      ...draft,
      [key]: value,
    });
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Adicionar refeicao</Text>
          <TextInput
            onChangeText={(value) => updateField("name", value)}
            placeholder="Nome da refeicao"
            placeholderTextColor={colors.foregroundMuted}
            style={styles.modalInput}
            value={draft.name}
          />
          <TextInput
            onChangeText={(value) => updateField("time", value)}
            placeholder="Horario (ex: 08:30)"
            placeholderTextColor={colors.foregroundMuted}
            style={styles.modalInput}
            value={draft.time}
          />

          <View style={styles.typePills}>
            {MEAL_TYPE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() =>
                  onChangeDraft({
                    ...draft,
                    type: option.value,
                  })
                }
                style={[
                  styles.typePill,
                  draft.type === option.value && styles.typePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.typePillText,
                    draft.type === option.value && styles.typePillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.macroGrid}>
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => updateField("calories", value)}
              placeholder="Kcal"
              placeholderTextColor={colors.foregroundMuted}
              style={styles.modalInputHalf}
              value={draft.calories}
            />
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => updateField("protein", value)}
              placeholder="Proteina"
              placeholderTextColor={colors.foregroundMuted}
              style={styles.modalInputHalf}
              value={draft.protein}
            />
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => updateField("carbs", value)}
              placeholder="Carbo"
              placeholderTextColor={colors.foregroundMuted}
              style={styles.modalInputHalf}
              value={draft.carbs}
            />
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => updateField("fats", value)}
              placeholder="Gorduras"
              placeholderTextColor={colors.foregroundMuted}
              style={styles.modalInputHalf}
              value={draft.fats}
            />
          </View>

          <View style={styles.modalActions}>
            <SecondaryButton onPress={onClose} title="Cancelar" />
            <PrimaryButton onPress={onSubmit} title="Salvar refeicao" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function StudentDietScreen({
  data,
  onRefresh,
  onSaveNutrition,
  refreshing,
}: StudentDietScreenProps) {
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [draftMeal, setDraftMeal] = useState<DraftMeal>(DEFAULT_DRAFT_MEAL);
  const [saving, setSaving] = useState(false);
  const nutrition = data.dailyNutrition;

  const safeNutrition = useMemo<DailyNutrition>(() => {
    if (nutrition) {
      return nutrition;
    }

    return {
      date: new Date().toISOString().split("T")[0],
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      waterIntake: 0,
      targetCalories: data.profile?.targetCalories ?? 2000,
      targetProtein: data.profile?.targetProtein ?? 150,
      targetCarbs: data.profile?.targetCarbs ?? 250,
      targetFats: data.profile?.targetFats ?? 65,
      targetWater: data.profile?.targetWater ?? 3000,
    };
  }, [data.profile?.targetCalories, data.profile?.targetCarbs, data.profile?.targetFats, data.profile?.targetProtein, data.profile?.targetWater, nutrition]);

  const saveNutrition = async (nextNutrition: DailyNutrition) => {
    setSaving(true);

    try {
      await onSaveNutrition(nextNutrition);
    } finally {
      setSaving(false);
    }
  };

  const toggleMealComplete = async (mealId: string) => {
    const nextMeals = safeNutrition.meals.map((meal) =>
      meal.id === mealId ? { ...meal, completed: !meal.completed } : meal,
    );

    await saveNutrition(
      recalculateNutrition(safeNutrition, nextMeals, safeNutrition.waterIntake),
    );
  };

  const removeMeal = async (mealId: string) => {
    const nextMeals = safeNutrition.meals.filter((meal) => meal.id !== mealId);

    await saveNutrition(
      recalculateNutrition(safeNutrition, nextMeals, safeNutrition.waterIntake),
    );
  };

  const changeWater = async (delta: number) => {
    const nextWater = Math.max(
      0,
      Math.min(safeNutrition.targetWater, safeNutrition.waterIntake + delta),
    );

    await saveNutrition(
      recalculateNutrition(safeNutrition, safeNutrition.meals, nextWater),
    );
  };

  const submitMeal = async () => {
    const calories = Number(draftMeal.calories || 0);
    const protein = Number(draftMeal.protein || 0);
    const carbs = Number(draftMeal.carbs || 0);
    const fats = Number(draftMeal.fats || 0);

    if (!draftMeal.name.trim()) {
      return;
    }

    const nextMeal: Meal = {
      id: `meal-${Date.now()}`,
      name: draftMeal.name.trim(),
      calories,
      carbs,
      completed: false,
      fats,
      protein,
      time: draftMeal.time.trim() || undefined,
      type: draftMeal.type,
      foods: [],
    };

    const nextMeals = [...safeNutrition.meals, nextMeal];
    await saveNutrition(
      recalculateNutrition(safeNutrition, nextMeals, safeNutrition.waterIntake),
    );
    setDraftMeal(DEFAULT_DRAFT_MEAL);
    setAddMealOpen(false);
  };

  const caloriesProgress = formatPercentage(
    safeNutrition.totalCalories,
    safeNutrition.targetCalories,
  );
  const proteinProgress = formatPercentage(
    safeNutrition.totalProtein,
    safeNutrition.targetProtein,
  );
  const carbsProgress = formatPercentage(
    safeNutrition.totalCarbs,
    safeNutrition.targetCarbs,
  );
  const fatsProgress = formatPercentage(
    safeNutrition.totalFats,
    safeNutrition.targetFats,
  );
  const waterProgress = formatPercentage(
    safeNutrition.waterIntake,
    safeNutrition.targetWater,
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || saving}
            tintColor={colors.primary}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Nutricao</Text>
          <Text style={styles.heroSubtitle}>
            {safeNutrition.meals.filter((meal) => meal.completed).length} de{" "}
            {safeNutrition.meals.length} refeicoes concluidas hoje
          </Text>
        </View>

        <View style={styles.statGrid}>
          {[
            {
              icon: (
                <Ionicons color={colors.secondary} name="restaurant-outline" size={18} />
              ),
              label: "Meta calorica",
              value: `${caloriesProgress}%`,
              badge: `${safeNutrition.totalCalories}/${safeNutrition.targetCalories} kcal`,
              color: colors.secondary,
            },
            {
              icon: (
                <MaterialCommunityIcons color={colors.primary} name="food-drumstick-outline" size={18} />
              ),
              label: "Proteina",
              value: `${proteinProgress}%`,
              badge: `${safeNutrition.totalProtein}/${safeNutrition.targetProtein} g`,
              color: colors.primary,
            },
            {
              icon: (
                <MaterialCommunityIcons color={colors.warning} name="bread-slice-outline" size={18} />
              ),
              label: "Carbo",
              value: `${carbsProgress}%`,
              badge: `${safeNutrition.totalCarbs}/${safeNutrition.targetCarbs} g`,
              color: colors.warning,
            },
            {
              icon: <Ionicons color={colors.blue} name="water-outline" size={18} />,
              label: "Agua",
              value: `${waterProgress}%`,
              badge: `${safeNutrition.waterIntake}/${safeNutrition.targetWater} ml`,
              color: colors.blue,
            },
          ].map((item) => (
            <View key={item.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: `${item.color}1A` }]}>
                {item.icon}
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statBadge}>{item.badge}</Text>
            </View>
          ))}
        </View>

        <DuoCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons color={colors.blue} name="water-outline" size={20} />
              <Text style={styles.cardTitle}>Hidratacao</Text>
            </View>
          </View>

          <Text style={styles.waterSummary}>
            {safeNutrition.waterIntake} ml de {safeNutrition.targetWater} ml
          </Text>
          <View style={styles.waterActions}>
            <SecondaryButton onPress={() => void changeWater(-300)} title="- 300ml" />
            <PrimaryButton onPress={() => void changeWater(300)} title="+ 300ml" />
          </View>
        </DuoCard>

        <DuoCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons color={colors.secondary} name="list-outline" size={20} />
              <Text style={styles.cardTitle}>Refeicoes do dia</Text>
            </View>
            <Pressable
              onPress={() => setAddMealOpen(true)}
              style={styles.addMealButton}
            >
              <Text style={styles.addMealButtonText}>Adicionar</Text>
            </Pressable>
          </View>

          {safeNutrition.meals.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>Nenhuma refeicao registrada</Text>
              <Text style={styles.emptyText}>
                Crie sua primeira refeicao manualmente para acompanhar o dia.
              </Text>
              <SecondaryButton
                onPress={() => setAddMealOpen(true)}
                title="Criar refeicao"
              />
            </View>
          ) : (
            <View style={styles.mealStack}>
              {safeNutrition.meals.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealMain}>
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealTitle}>{meal.name}</Text>
                      <Pressable onPress={() => void removeMeal(meal.id)}>
                        <Ionicons
                          color={colors.foregroundMuted}
                          name="trash-outline"
                          size={18}
                        />
                      </Pressable>
                    </View>
                    <Text style={styles.mealMeta}>
                      {meal.time || "Sem horario"} - {meal.type}
                    </Text>
                    <Text style={styles.mealMeta}>
                      {meal.calories} kcal | P {meal.protein}g | C {meal.carbs}g | G {meal.fats}g
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => void toggleMealComplete(meal.id)}
                    style={[
                      styles.completePill,
                      meal.completed && styles.completePillActive,
                    ]}
                  >
                    <Ionicons
                      color={meal.completed ? "#ffffff" : colors.primary}
                      name={meal.completed ? "checkmark" : "ellipse-outline"}
                      size={16}
                    />
                    <Text
                      style={[
                        styles.completePillText,
                        meal.completed && styles.completePillTextActive,
                      ]}
                    >
                      {meal.completed ? "Concluida" : "Marcar"}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </DuoCard>

        <DuoCard>
          <View style={styles.cardHeaderLeft}>
            <Ionicons color={colors.warning} name="analytics-outline" size={20} />
            <Text style={styles.cardTitle}>Macros do dia</Text>
          </View>
          <View style={styles.macroRows}>
            {[
              {
                current: safeNutrition.totalProtein,
                label: "Proteina",
                target: safeNutrition.targetProtein,
              },
              {
                current: safeNutrition.totalCarbs,
                label: "Carboidratos",
                target: safeNutrition.targetCarbs,
              },
              {
                current: safeNutrition.totalFats,
                label: "Gorduras",
                target: safeNutrition.targetFats,
              },
            ].map((item) => {
              const progress = formatPercentage(item.current, item.target);
              return (
                <View key={item.label} style={styles.macroRow}>
                  <View style={styles.macroRowHeader}>
                    <Text style={styles.macroLabel}>{item.label}</Text>
                    <Text style={styles.macroLabel}>
                      {item.current} / {item.target} g
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(progress, 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </DuoCard>
      </ScrollView>

      <AddMealModal
        draft={draftMeal}
        onChangeDraft={setDraftMeal}
        onClose={() => {
          setDraftMeal(DEFAULT_DRAFT_MEAL);
          setAddMealOpen(false);
        }}
        onSubmit={() => void submitMeal()}
        visible={addMealOpen}
      />
    </>
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
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: 6,
    minHeight: 150,
    padding: spacing.md,
    width: "48%",
    ...shadow.soft,
  },
  statIconWrap: {
    alignItems: "center",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  statValue: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  statBadge: {
    color: colors.foregroundMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: "auto",
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
  waterSummary: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  waterActions: {
    gap: spacing.sm,
  },
  addMealButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  addMealButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  mealStack: {
    gap: spacing.sm,
  },
  mealCard: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  mealMain: {
    gap: 4,
  },
  mealHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mealTitle: {
    color: colors.foreground,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    paddingRight: spacing.sm,
  },
  mealMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  completePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: colors.primary,
    borderRadius: radius.round,
    borderWidth: 2,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completePillActive: {
    backgroundColor: colors.primary,
  },
  completePillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  completePillTextActive: {
    color: "#ffffff",
  },
  emptyBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  macroRows: {
    gap: spacing.sm,
  },
  macroRow: {
    gap: 8,
  },
  macroRowHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroLabel: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    backgroundColor: "#dfe6df",
    borderRadius: radius.round,
    height: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: "100%",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(48, 52, 51, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.md,
    padding: spacing.lg,
    width: "100%",
    ...shadow.soft,
  },
  modalTitle: {
    color: colors.foreground,
    fontSize: typography.heading.fontSize,
    fontWeight: "900",
    textAlign: "center",
  },
  modalInput: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  typePill: {
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  typePillActive: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  typePillText: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  typePillTextActive: {
    color: colors.blue,
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modalInputHalf: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: "47.5%",
  },
  modalActions: {
    gap: spacing.sm,
  },
});
