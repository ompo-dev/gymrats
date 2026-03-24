import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type {
  BoostCampaign,
  DailyNutrition,
  StudentBottomTab,
  StudentHomeData,
  WorkoutHistory,
} from "./types";

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function calculateWeightGain(data: StudentHomeData | null) {
  if (!data?.profile?.weight || data.weightHistory.length < 2) {
    return null;
  }

  const latest = data.weightHistory[0]?.weight;
  const earliest = data.weightHistory[data.weightHistory.length - 1]?.weight;
  if (typeof latest !== "number" || typeof earliest !== "number") {
    return null;
  }

  return Number((latest - earliest).toFixed(1));
}

function CampaignsCarousel({
  campaigns,
  onOpenCampaign,
}: {
  campaigns: BoostCampaign[];
  onOpenCampaign: (campaign: BoostCampaign) => void;
}) {
  if (campaigns.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.campaignsContent}
      showsHorizontalScrollIndicator={false}
    >
      {campaigns.map((campaign) => (
        <Pressable
          key={campaign.id}
          onPress={() => onOpenCampaign(campaign)}
          style={styles.campaignCard}
        >
          <View style={styles.campaignMeta}>
            <Ionicons
              color={campaign.primaryColor || colors.primary}
              name="sparkles-outline"
              size={16}
            />
            <Text style={styles.campaignMetaText}>Patrocinado</Text>
          </View>
          <Text
            style={[
              styles.campaignTitle,
              { color: campaign.primaryColor || colors.primary },
            ]}
          >
            {campaign.title}
          </Text>
          <Text style={styles.campaignDescription}>{campaign.description}</Text>
          <View
            style={[
              styles.campaignButton,
              { backgroundColor: campaign.primaryColor || colors.primary },
            ]}
          >
            <Text style={styles.campaignButtonText}>Aproveitar Oferta</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function StatCard({
  accent,
  badge,
  icon,
  label,
  value,
}: {
  accent: string;
  badge: string;
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}1A` }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statBadge}>{badge}</Text>
    </View>
  );
}

function LevelCard({
  currentLevel,
  totalXP,
  xpToNextLevel,
}: {
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
}) {
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpGainedInCurrentLevel = totalXP - xpForCurrentLevel;
  const progress = Math.max(
    0,
    Math.min((xpGainedInCurrentLevel / 100) * 100, 100),
  );

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.secondary} name="trophy-outline" size={20} />
        <Text style={styles.cardTitle}>Seu Nivel</Text>
      </View>
      <View style={styles.levelRow}>
        <Text style={styles.levelTitle}>Nivel {currentLevel}</Text>
        <View style={styles.levelRight}>
          <Text style={styles.levelXp}>{totalXP} XP</Text>
          <Text style={styles.levelSubtext}>Total acumulado</Text>
        </View>
      </View>
      <View style={styles.progressMetaRow}>
        <Text style={styles.progressLabel}>
          Progresso para nivel {currentLevel + 1}
        </Text>
        <Text style={styles.progressValue}>{xpToNextLevel} XP restantes</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </DuoCard>
  );
}

function ContinueWorkoutCard({
  data,
  onOpenLearn,
}: {
  data: StudentHomeData;
  onOpenLearn: () => void;
}) {
  const nextWorkout = (() => {
    const weeklyPlanWorkout = data.weeklyPlan?.slots.find(
      (slot) => slot.type === "workout" && slot.workout && !slot.workout.completed,
    )?.workout;
    if (weeklyPlanWorkout) return weeklyPlanWorkout;

    for (const unit of data.units) {
      const workout = unit.workouts.find(
        (item) => !item.completed && !item.locked,
      );
      if (workout) return workout;
    }

    return null;
  })();

  const lastCompleted = data.workoutHistory[0] ?? null;

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.secondary} name="barbell-outline" size={20} />
        <Text style={styles.cardTitle}>Continue seu Treino</Text>
      </View>

      {nextWorkout ? (
        <View style={styles.emptyCardState}>
          <Text style={styles.quickTitle}>{nextWorkout.title}</Text>
          <Text style={styles.emptyStateDescription}>Seu proximo treino ja esta pronto</Text>
          <SecondaryButton onPress={onOpenLearn} title="Continuar" />
        </View>
      ) : lastCompleted ? (
        <View style={styles.emptyCardState}>
          <Text style={styles.quickTitle}>Ultimo treino: {lastCompleted.workoutName}</Text>
          <Text style={styles.emptyStateDescription}>
            {formatDateLabel(lastCompleted.date)}
          </Text>
          <SecondaryButton onPress={onOpenLearn} title="Ver treinos" />
        </View>
      ) : (
        <View style={styles.emptyCardState}>
          <Ionicons color={colors.primary} name="barbell-outline" size={32} />
          <Text style={styles.emptyStateTitle}>Comece sua jornada</Text>
          <Text style={styles.emptyStateDescription}>
            Seus treinos personalizados estao prontos. Comece agora.
          </Text>
          <SecondaryButton onPress={onOpenLearn} title="Ver treinos" />
        </View>
      )}
    </DuoCard>
  );
}

function NutritionCard({
  dailyNutrition,
  onOpenDiet,
}: {
  dailyNutrition: DailyNutrition | null;
  onOpenDiet: () => void;
}) {
  const hasMeals = Boolean(dailyNutrition?.meals?.length);
  const hasWater = Boolean(dailyNutrition?.waterIntake);
  const completedMeals = dailyNutrition?.meals?.filter((meal) => meal.completed)
    .length ?? 0;
  const totalMeals = dailyNutrition?.meals?.length ?? 0;
  const caloriesProgress = dailyNutrition?.targetCalories
    ? Math.round((dailyNutrition.totalCalories / dailyNutrition.targetCalories) * 100)
    : 0;
  const waterProgress = dailyNutrition?.targetWater
    ? Math.round((dailyNutrition.waterIntake / dailyNutrition.targetWater) * 100)
    : 0;

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.secondary} name="restaurant-outline" size={20} />
        <Text style={styles.cardTitle}>Nutricao de Hoje</Text>
      </View>

      {!dailyNutrition || (!hasMeals && !hasWater) ? (
        <View style={styles.emptyCardState}>
          <Ionicons color={colors.primary} name="restaurant-outline" size={32} />
          <Text style={styles.emptyStateTitle}>Comece a registrar</Text>
          <Text style={styles.emptyStateDescription}>
            Registre suas refeicoes e hidratacao para acompanhar seu progresso.
          </Text>
          <SecondaryButton onPress={onOpenDiet} title="Ir para nutricao" />
        </View>
      ) : (
        <View style={styles.nutritionStack}>
          <Text style={styles.nutritionItemTitle}>
            {completedMeals}/{totalMeals} refeicoes
          </Text>
          <Text style={styles.nutritionItemSubtitle}>
            {caloriesProgress}% da meta calorica
          </Text>
          <Text style={styles.nutritionItemTitle}>{dailyNutrition.waterIntake}ml</Text>
          <Text style={styles.nutritionItemSubtitle}>
            {waterProgress}% da meta diaria
          </Text>
          <SecondaryButton onPress={onOpenDiet} title="Abrir dieta" />
        </View>
      )}
    </DuoCard>
  );
}

function WeightCard({ data }: { data: StudentHomeData }) {
  const currentWeight = data.profile?.weight ?? null;
  const weightGain = calculateWeightGain(data);
  const recentWeights = data.weightHistory.slice(0, 7).reverse();

  if (!currentWeight) return null;

  const maxWeight =
    recentWeights.length > 0
      ? Math.max(...recentWeights.map((entry) => entry.weight))
      : currentWeight;
  const minWeight =
    recentWeights.length > 0
      ? Math.min(...recentWeights.map((entry) => entry.weight))
      : currentWeight;
  const range = maxWeight - minWeight || 1;

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <MaterialCommunityIcons color={colors.secondary} name="chart-line" size={20} />
        <Text style={styles.cardTitle}>Evolucao de Peso</Text>
      </View>
      <View style={styles.levelRow}>
        <Text style={styles.weightValue}>{currentWeight.toFixed(1)} kg</Text>
        {weightGain != null ? (
          <Text
            style={[
              styles.weightDelta,
              {
                color:
                  weightGain === 0
                    ? colors.foregroundMuted
                    : weightGain > 0
                      ? colors.danger
                      : colors.primary,
              },
            ]}
          >
            {weightGain > 0 ? "+" : ""}
            {weightGain.toFixed(1)} kg
          </Text>
        ) : null}
      </View>
      {recentWeights.length > 1 ? (
        <View style={styles.weightBarsRow}>
          {recentWeights.map((entry, index) => {
            const height = ((entry.weight - minWeight) / range) * 100;
            return (
              <View
                key={`${entry.date}-${index}`}
                style={[styles.weightBar, { height: `${Math.max(height, 10)}%` }]}
              />
            );
          })}
        </View>
      ) : null}
    </DuoCard>
  );
}

function RecentWorkoutsCard({ workouts }: { workouts: WorkoutHistory[] }) {
  const recentWorkouts = workouts.slice(0, 3);

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.secondary} name="calendar-outline" size={20} />
        <Text style={styles.cardTitle}>Treinos Recentes</Text>
      </View>
      {recentWorkouts.length === 0 ? (
        <Text style={styles.emptyListText}>Nenhum treino registrado ainda</Text>
      ) : (
        <View style={styles.recentWorkoutsStack}>
          {recentWorkouts.map((workout, index) => (
            <View key={`${workout.id || workout.workoutName}-${index}`} style={styles.recentWorkoutRow}>
              <View style={styles.recentWorkoutMain}>
                <Text style={styles.recentWorkoutName}>{workout.workoutName}</Text>
                <Text style={styles.recentWorkoutMeta}>
                  {formatDateLabel(workout.date)} - {workout.duration} min
                </Text>
              </View>
              {workout.overallFeedback ? (
                <Text style={styles.recentWorkoutBadge}>
                  {workout.overallFeedback}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </DuoCard>
  );
}

export function StudentHomeScreen({
  data,
  onRefresh,
  onOpenTab,
  onOpenCampaign,
  refreshing,
}: {
  data: StudentHomeData;
  onRefresh: () => void;
  onOpenTab: (tab: StudentBottomTab) => void;
  onOpenCampaign: (campaign: BoostCampaign) => void;
  refreshing: boolean;
}) {
  const progress = data.progress;
  const displayProgress = {
    currentStreak: progress?.currentStreak ?? 0,
    longestStreak: progress?.longestStreak ?? 0,
    totalXP: progress?.totalXP ?? 0,
    todayXP: progress?.todayXP ?? 0,
    currentLevel: progress?.currentLevel ?? 1,
    xpToNextLevel: progress?.xpToNextLevel ?? 100,
    workoutsCompleted: progress?.workoutsCompleted ?? 0,
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.primary}
          onRefresh={onRefresh}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroBlock}>
        <Text style={styles.heroTitle}>
          {data.user?.name ? `Ola, ${data.user.name.split(" ")[0]}!` : "Ola, Atleta!"}
        </Text>
        <Text style={styles.heroSubtitle}>
          Continue sua jornada fitness de hoje
        </Text>
      </View>

      <CampaignsCarousel campaigns={data.campaigns} onOpenCampaign={onOpenCampaign} />

      <LevelCard
        currentLevel={displayProgress.currentLevel}
        totalXP={displayProgress.totalXP}
        xpToNextLevel={displayProgress.xpToNextLevel}
      />

      <View style={styles.statGrid}>
        <StatCard
          accent={colors.warning}
          badge={`Recorde: ${displayProgress.longestStreak || 0}`}
          icon={<Ionicons color={colors.warning} name="flame" size={18} />}
          label="dias de sequencia"
          value={displayProgress.currentStreak}
        />
        <StatCard
          accent={colors.blue}
          badge={`Total: ${displayProgress.totalXP || 0} XP`}
          icon={<Ionicons color={colors.blue} name="flash" size={18} />}
          label="ganho hoje"
          value={`${displayProgress.todayXP} XP`}
        />
        <StatCard
          accent={colors.secondary}
          badge="Continue treinando"
          icon={<Ionicons color={colors.secondary} name="trophy-outline" size={18} />}
          label="nivel atual"
          value={`#${displayProgress.currentLevel}`}
        />
        <StatCard
          accent={colors.primary}
          badge={
            data.workoutHistory.length > 0
              ? `${data.workoutHistory.length} treinos registrados`
              : "Nenhum treino ainda"
          }
          icon={<Ionicons color={colors.primary} name="barbell-outline" size={18} />}
          label="treinos completos"
          value={displayProgress.workoutsCompleted}
        />
      </View>

      <WeightCard data={data} />
      <ContinueWorkoutCard data={data} onOpenLearn={() => onOpenTab("learn")} />
      <NutritionCard dailyNutrition={data.dailyNutrition} onOpenDiet={() => onOpenTab("diet")} />
      <RecentWorkoutsCard workouts={data.workoutHistory} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroBlock: {
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
  campaignsContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  campaignCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.sm,
    minHeight: 188,
    padding: spacing.md,
    width: 286,
    ...shadow.soft,
  },
  campaignMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  campaignMetaText: {
    color: colors.foregroundMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  campaignTitle: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  campaignDescription: {
    color: colors.foregroundMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  campaignButton: {
    alignItems: "center",
    borderRadius: radius.md,
    marginTop: "auto",
    paddingVertical: 12,
  },
  campaignButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
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
  levelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelTitle: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: "900",
  },
  levelRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  levelXp: {
    color: colors.warning,
    fontSize: 22,
    fontWeight: "900",
  },
  levelSubtext: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  progressMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  progressValue: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  progressTrack: {
    backgroundColor: "#dfe6df",
    borderRadius: 999,
    height: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%",
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
  emptyCardState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyStateTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyStateDescription: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  quickTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  nutritionStack: {
    gap: spacing.sm,
  },
  nutritionItemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  nutritionItemSubtitle: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  weightValue: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "900",
  },
  weightDelta: {
    fontSize: 20,
    fontWeight: "900",
  },
  weightBarsRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 6,
    height: 72,
  },
  weightBar: {
    backgroundColor: colors.blueSoftStrong,
    borderRadius: 6,
    flex: 1,
    minHeight: 10,
  },
  emptyListText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    textAlign: "center",
  },
  recentWorkoutsStack: {
    gap: spacing.sm,
  },
  recentWorkoutRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm,
  },
  recentWorkoutMain: {
    flex: 1,
    gap: 3,
    paddingRight: spacing.sm,
  },
  recentWorkoutName: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  recentWorkoutMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  recentWorkoutBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
});
