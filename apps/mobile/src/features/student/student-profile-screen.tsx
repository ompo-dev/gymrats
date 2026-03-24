import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DuoCard } from "../../components/duo-card";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type { StudentHomeData } from "./types";

type StudentProfileScreenProps = {
  data: StudentHomeData;
  isAdmin: boolean;
  onAddWeight: (weight: number) => Promise<void>;
  onLogout: () => void;
  onNavigate: (tab: "learn" | "gyms" | "payments" | "personals") => void;
  onRefresh: () => void;
  onSwitchToGym: () => void;
  refreshing: boolean;
};

function formatShortDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function getUsername(email?: string, explicitUsername?: string) {
  if (explicitUsername) {
    return explicitUsername.startsWith("@")
      ? explicitUsername
      : `@${explicitUsername}`;
  }

  if (!email) {
    return "@usuario";
  }

  return `@${email.split("@")[0]}`;
}

function calculateWeightGain(data: StudentHomeData) {
  if (data.weightHistory.length < 2) {
    return null;
  }

  const latest = data.weightHistory[0]?.weight;
  const earliest = data.weightHistory[data.weightHistory.length - 1]?.weight;

  if (typeof latest !== "number" || typeof earliest !== "number") {
    return null;
  }

  return Number((latest - earliest).toFixed(1));
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "active":
      return "Ativa";
    case "trialing":
      return "Em teste";
    case "pending_payment":
      return "Pagamento pendente";
    case "past_due":
      return "Em atraso";
    case "canceled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    default:
      return "Sem assinatura";
  }
}

function WeightEntryModal({
  loading,
  onClose,
  onSubmit,
  value,
  onChangeValue,
  visible,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeValue: (value: string) => void;
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Atualizar peso</Text>
          <Text style={styles.modalDescription}>
            Registre seu peso atual para manter a evolucao sincronizada.
          </Text>
          <TextInput
            autoFocus
            keyboardType="decimal-pad"
            onChangeText={onChangeValue}
            placeholder="Ex: 74.8"
            placeholderTextColor={colors.foregroundMuted}
            style={styles.modalInput}
            value={value}
          />
          <View style={styles.modalActions}>
            <SecondaryButton onPress={onClose} title="Cancelar" />
            <PrimaryButton
              disabled={loading}
              onPress={onSubmit}
              title={loading ? "Salvando..." : "Salvar peso"}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProfileHeader({
  currentWeight,
  name,
  username,
  memberSince,
  onOpenWeightModal,
}: {
  currentWeight: number | null;
  memberSince: string;
  name: string;
  onOpenWeightModal: () => void;
  username: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <DuoCard>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials || "GR"}</Text>
        </View>
        <View style={styles.profileMain}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileUsername}>{username}</Text>
          <Text style={styles.profileMemberSince}>Membro desde {memberSince}</Text>
        </View>
      </View>

      <Pressable onPress={onOpenWeightModal} style={styles.weightQuickAction}>
        <View>
          <Text style={styles.weightQuickLabel}>Peso Atual</Text>
          <Text style={styles.weightQuickValue}>
            {currentWeight != null ? `${currentWeight.toFixed(1)} kg` : "Nao informado"}
          </Text>
        </View>
        <Ionicons color={colors.foregroundMuted} name="create-outline" size={18} />
      </Pressable>
    </DuoCard>
  );
}

function StatGrid({
  currentLevel,
  currentStreak,
  longestStreak,
  totalXP,
  weeklyWorkouts,
  workoutsCompleted,
  xpToNextLevel,
}: {
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  weeklyWorkouts: number;
  workoutsCompleted: number;
  xpToNextLevel: number;
}) {
  const items = [
    {
      badge: `Recorde: ${longestStreak}`,
      color: colors.warning,
      icon: <Ionicons color={colors.warning} name="flame" size={18} />,
      label: "Dias seguidos",
      value: String(currentStreak),
    },
    {
      badge: `${xpToNextLevel} ate o proximo nivel`,
      color: colors.blue,
      icon: <Ionicons color={colors.blue} name="flash" size={18} />,
      label: "XP total",
      value: String(totalXP),
    },
    {
      badge: "Continue treinando",
      color: colors.secondary,
      icon: <Ionicons color={colors.secondary} name="trophy-outline" size={18} />,
      label: "Nivel atual",
      value: `#${currentLevel}`,
    },
    {
      badge: weeklyWorkouts > 0 ? `+${weeklyWorkouts} esta semana` : "Sem treino nesta semana",
      color: colors.primary,
      icon: <Ionicons color={colors.primary} name="trending-up-outline" size={18} />,
      label: "Treinos",
      value: String(workoutsCompleted),
    },
  ];

  return (
    <View style={styles.statGrid}>
      {items.map((item) => (
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
  );
}

function WeightEvolutionCard({
  currentWeight,
  data,
  onOpenWeightModal,
  weightGain,
}: {
  currentWeight: number | null;
  data: StudentHomeData;
  onOpenWeightModal: () => void;
  weightGain: number | null;
}) {
  const recentWeights = data.weightHistory.slice(0, 8).reverse();
  const maxWeight =
    recentWeights.length > 0
      ? Math.max(...recentWeights.map((item) => item.weight))
      : currentWeight ?? 0;
  const minWeight =
    recentWeights.length > 0
      ? Math.min(...recentWeights.map((item) => item.weight))
      : currentWeight ?? 0;
  const range = maxWeight - minWeight || 1;
  const directionLabel =
    weightGain == null
      ? "Sem historico suficiente"
      : weightGain < 0
        ? `${Math.abs(weightGain).toFixed(1)} kg perdidos`
        : weightGain > 0
          ? `+${weightGain.toFixed(1)} kg ganhos`
          : "Sem mudanca";

  return (
    <DuoCard>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <MaterialCommunityIcons
            color={colors.secondary}
            name="chart-line"
            size={20}
          />
          <Text style={styles.cardTitle}>Evolucao de Peso</Text>
        </View>
        <Pressable onPress={onOpenWeightModal} style={styles.cardLinkButton}>
          <Text style={styles.cardLinkText}>Atualizar</Text>
        </Pressable>
      </View>

      <View style={styles.weightSummaryRow}>
        <View>
          <Text style={styles.weightSummaryValue}>
            {currentWeight != null ? `${currentWeight.toFixed(1)} kg` : "Nao informado"}
          </Text>
          <Text style={styles.weightSummarySubtext}>{directionLabel}</Text>
        </View>
        <MaterialIcons color={colors.foregroundMuted} name="monitor-weight" size={28} />
      </View>

      {recentWeights.length > 1 ? (
        <View style={styles.weightChartRow}>
          {recentWeights.map((entry, index) => {
            const height = ((entry.weight - minWeight) / range) * 100;

            return (
              <View key={`${entry.date}-${index}`} style={styles.weightChartColumn}>
                <View
                  style={[
                    styles.weightChartBar,
                    { height: `${Math.max(height, 12)}%` },
                  ]}
                />
                <Text style={styles.weightChartLabel}>
                  {formatShortDate(entry.date)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          Adicione mais registros para acompanhar a curva de evolucao.
        </Text>
      )}
    </DuoCard>
  );
}

function RecentHistoryCard({
  onNavigate,
  workouts,
}: {
  onNavigate: () => void;
  workouts: StudentHomeData["workoutHistory"];
}) {
  const recent = workouts.slice(0, 3);

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.secondary} name="calendar-outline" size={20} />
        <Text style={styles.cardTitle}>Historico Recente</Text>
      </View>
      {recent.length > 0 ? (
        <View style={styles.listStack}>
          {recent.map((workout, index) => (
            <View
              key={`${workout.id || workout.workoutName}-${index}`}
              style={styles.rowCard}
            >
              <View style={styles.rowCardMain}>
                <Text style={styles.rowCardTitle}>{workout.workoutName}</Text>
                <Text style={styles.rowCardMeta}>
                  {formatShortDate(workout.date)} - {workout.duration} min
                </Text>
              </View>
              <Text style={styles.rowCardBadge}>
                {workout.overallFeedback ?? "feito"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>Hora de comecar</Text>
          <Text style={styles.emptyText}>
            Complete seu primeiro treino para montar o historico.
          </Text>
          <SecondaryButton onPress={onNavigate} title="Ir para treinos" />
        </View>
      )}
    </DuoCard>
  );
}

function PersonalRecordsCard({
  onNavigate,
  records,
}: {
  onNavigate: () => void;
  records: StudentHomeData["personalRecords"];
}) {
  const recentRecords = records.slice(0, 3);

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.secondary} name="trophy-outline" size={20} />
        <Text style={styles.cardTitle}>Recordes Pessoais</Text>
      </View>
      {recentRecords.length > 0 ? (
        <View style={styles.listStack}>
          {recentRecords.map((record, index) => (
            <View
              key={`${record.exerciseId}-${record.date}-${index}`}
              style={styles.rowCard}
            >
              <View style={styles.rowCardMain}>
                <Text style={styles.rowCardTitle}>{record.exerciseName}</Text>
                <Text style={styles.rowCardMeta}>
                  {record.type === "max-weight"
                    ? `${record.value} kg`
                    : record.type === "max-volume"
                      ? `${record.value} volume`
                      : `${record.value} reps`}
                </Text>
              </View>
              <Text style={styles.rowCardBadge}>{formatShortDate(record.date)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>Seus recordes estao esperando</Text>
          <Text style={styles.emptyText}>
            Complete treinos para destravar seus primeiros PRs.
          </Text>
          <SecondaryButton onPress={onNavigate} title="Fazer primeiro treino" />
        </View>
      )}
    </DuoCard>
  );
}

function AcademiasCard({
  memberships,
  dayPasses,
  onNavigate,
}: {
  dayPasses: StudentHomeData["dayPasses"];
  memberships: StudentHomeData["memberships"];
  onNavigate: () => void;
}) {
  return (
    <DuoCard>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.blue} name="location-outline" size={20} />
          <Text style={styles.cardTitle}>Minhas Academias</Text>
        </View>
        <Pressable onPress={onNavigate} style={styles.cardLinkButton}>
          <Text style={styles.cardLinkText}>Ver mais</Text>
        </Pressable>
      </View>

      {memberships.length > 0 ? (
        <View style={styles.listStack}>
          {memberships.slice(0, 3).map((membership) => (
            <View key={membership.id} style={styles.rowCard}>
              <View style={styles.rowCardMain}>
                <Text style={styles.rowCardTitle}>{membership.gymName}</Text>
                <Text style={styles.rowCardMeta}>{membership.planName}</Text>
              </View>
              <Text style={styles.rowCardBadge}>
                {membership.status === "active" ? "ativa" : membership.status}
              </Text>
            </View>
          ))}
        </View>
      ) : dayPasses.length > 0 ? (
        <View style={styles.listStack}>
          {dayPasses.slice(0, 3).map((pass) => (
            <View key={pass.id} style={styles.rowCard}>
              <View style={styles.rowCardMain}>
                <Text style={styles.rowCardTitle}>{pass.gymName}</Text>
                <Text style={styles.rowCardMeta}>
                  Valido em {formatShortDate(pass.validDate)}
                </Text>
              </View>
              <Text style={styles.rowCardBadge}>{pass.status}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>Nenhuma academia vinculada</Text>
          <Text style={styles.emptyText}>
            Explore academias parceiras e ative uma matricula ou diaria.
          </Text>
          <SecondaryButton onPress={onNavigate} title="Encontrar academias" />
        </View>
      )}
    </DuoCard>
  );
}

function PersonalsCard({ onNavigate }: { onNavigate: () => void }) {
  return (
    <DuoCard>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color="#8b5cf6" name="people-outline" size={20} />
          <Text style={styles.cardTitle}>Meus Personais</Text>
        </View>
        <Pressable onPress={onNavigate} style={styles.cardLinkButton}>
          <Text style={styles.cardLinkText}>Explorar</Text>
        </Pressable>
      </View>

      <View style={styles.emptyBlock}>
        <Text style={styles.emptyTitle}>Descubra personais proximos ou remotos</Text>
        <Text style={styles.emptyText}>
          Explore profissionais, assine planos e gerencie vinculos direto pelo app.
        </Text>
        <SecondaryButton onPress={onNavigate} title="Abrir personais" />
      </View>
    </DuoCard>
  );
}

function SubscriptionCard({
  onNavigate,
  subscription,
}: {
  onNavigate: () => void;
  subscription: StudentHomeData["subscription"];
}) {
  return (
    <DuoCard>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <MaterialIcons color={colors.warning} name="workspace-premium" size={20} />
          <Text style={styles.cardTitle}>Assinatura</Text>
        </View>
        <Pressable onPress={onNavigate} style={styles.cardLinkButton}>
          <Text style={styles.cardLinkText}>Pagamentos</Text>
        </Pressable>
      </View>

      {subscription ? (
        <View style={styles.subscriptionBlock}>
          <Text style={styles.subscriptionPlan}>{subscription.plan}</Text>
          <Text style={styles.subscriptionStatus}>
            {statusLabel(subscription.status)}
          </Text>
          {subscription.enterpriseGymName ? (
            <Text style={styles.subscriptionMeta}>
              Vinculada via {subscription.enterpriseGymName}
            </Text>
          ) : null}
          {subscription.currentPeriodEnd ? (
            <Text style={styles.subscriptionMeta}>
              Renova em {formatShortDate(subscription.currentPeriodEnd)}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>Nenhuma assinatura premium ativa</Text>
          <Text style={styles.emptyText}>
            Gerencie planos, PIX e historico pela area de pagamentos.
          </Text>
          <SecondaryButton onPress={onNavigate} title="Abrir pagamentos" />
        </View>
      )}
    </DuoCard>
  );
}

function AccountCard({
  isAdmin,
  onLogout,
  onSwitchToGym,
}: {
  isAdmin: boolean;
  onLogout: () => void;
  onSwitchToGym: () => void;
}) {
  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.secondary} name="shield-checkmark-outline" size={20} />
        <Text style={styles.cardTitle}>Conta</Text>
      </View>
      <View style={styles.accountStack}>
        {isAdmin ? (
          <Pressable onPress={onSwitchToGym} style={styles.accountActionCard}>
            <View style={styles.accountActionIcon}>
              <MaterialIcons color={colors.blue} name="swap-horiz" size={20} />
            </View>
            <View style={styles.accountActionBody}>
              <Text style={styles.accountActionTitle}>
                Trocar para perfil de academia
              </Text>
              <Text style={styles.accountActionDescription}>
                Abrir o contexto de gym enquanto a versao nativa nao fica pronta.
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Pressable onPress={onLogout} style={styles.accountActionCard}>
          <View style={[styles.accountActionIcon, styles.accountActionDanger]}>
            <Ionicons color={colors.danger} name="log-out-outline" size={20} />
          </View>
          <View style={styles.accountActionBody}>
            <Text style={styles.accountActionTitle}>Sair</Text>
            <Text style={styles.accountActionDescription}>
              Encerrar sessao do app mobile.
            </Text>
          </View>
        </Pressable>
      </View>
    </DuoCard>
  );
}

export function StudentProfileScreen({
  data,
  isAdmin,
  onAddWeight,
  onLogout,
  onNavigate,
  onRefresh,
  onSwitchToGym,
  refreshing,
}: StudentProfileScreenProps) {
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [weightSaving, setWeightSaving] = useState(false);

  const currentWeight = data.profile?.weight ?? data.weightHistory[0]?.weight ?? null;
  const weightGain = useMemo(() => calculateWeightGain(data), [data]);
  const username = getUsername(data.user?.email, data.user?.username);
  const weeklyWorkouts = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return data.workoutHistory.filter(
      (workout) => new Date(workout.date) >= oneWeekAgo,
    ).length;
  }, [data.workoutHistory]);

  const handleOpenWeightModal = () => {
    setWeightInput(currentWeight != null ? currentWeight.toFixed(1) : "");
    setWeightModalOpen(true);
  };

  const handleSubmitWeight = async () => {
    const parsed = Number(weightInput.replace(",", "."));

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    setWeightSaving(true);

    try {
      await onAddWeight(parsed);
      setWeightModalOpen(false);
    } finally {
      setWeightSaving(false);
    }
  };

  return (
    <>
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
        <ProfileHeader
          currentWeight={currentWeight}
          memberSince={data.user?.memberSince || "Jan 2025"}
          name={data.user?.name || "Usuario"}
          onOpenWeightModal={handleOpenWeightModal}
          username={username}
        />

        <StatGrid
          currentLevel={data.progress?.currentLevel ?? 1}
          currentStreak={data.progress?.currentStreak ?? 0}
          longestStreak={data.progress?.longestStreak ?? 0}
          totalXP={data.progress?.totalXP ?? 0}
          weeklyWorkouts={weeklyWorkouts}
          workoutsCompleted={data.progress?.workoutsCompleted ?? 0}
          xpToNextLevel={data.progress?.xpToNextLevel ?? 100}
        />

        <WeightEvolutionCard
          currentWeight={currentWeight}
          data={data}
          onOpenWeightModal={handleOpenWeightModal}
          weightGain={weightGain}
        />

        <RecentHistoryCard
          onNavigate={() => onNavigate("learn")}
          workouts={data.workoutHistory}
        />

        <PersonalRecordsCard
          onNavigate={() => onNavigate("learn")}
          records={data.personalRecords}
        />

        <AcademiasCard
          dayPasses={data.dayPasses}
          memberships={data.memberships}
          onNavigate={() => onNavigate("gyms")}
        />

        <PersonalsCard onNavigate={() => onNavigate("personals")} />

        <SubscriptionCard
          onNavigate={() => onNavigate("payments")}
          subscription={data.subscription}
        />

        <AccountCard
          isAdmin={isAdmin}
          onLogout={onLogout}
          onSwitchToGym={onSwitchToGym}
        />
      </ScrollView>

      <WeightEntryModal
        loading={weightSaving}
        onChangeValue={setWeightInput}
        onClose={() => setWeightModalOpen(false)}
        onSubmit={handleSubmitWeight}
        value={weightInput}
        visible={weightModalOpen}
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
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: {
    color: colors.blue,
    fontSize: 20,
    fontWeight: "900",
  },
  profileMain: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  profileUsername: {
    color: colors.foregroundMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  profileMemberSince: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  weightQuickAction: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  weightQuickLabel: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  weightQuickValue: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "900",
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
  cardLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cardLinkText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  weightSummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weightSummaryValue: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "900",
  },
  weightSummarySubtext: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  weightChartRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 6,
    height: 110,
  },
  weightChartColumn: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    height: "100%",
    justifyContent: "flex-end",
  },
  weightChartBar: {
    backgroundColor: colors.blueSoftStrong,
    borderRadius: 6,
    minHeight: 12,
    width: "100%",
  },
  weightChartLabel: {
    color: colors.foregroundMuted,
    fontSize: 10,
  },
  listStack: {
    gap: spacing.sm,
  },
  rowCard: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  rowCardMain: {
    flex: 1,
    gap: 3,
  },
  rowCardTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  rowCardMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  rowCardBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
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
  subscriptionBlock: {
    gap: 4,
  },
  subscriptionPlan: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  subscriptionStatus: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "900",
  },
  subscriptionMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  accountStack: {
    gap: spacing.sm,
  },
  accountActionCard: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  accountActionIcon: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  accountActionDanger: {
    backgroundColor: "rgba(214, 69, 69, 0.12)",
  },
  accountActionBody: {
    flex: 1,
    gap: 3,
  },
  accountActionTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  accountActionDescription: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(48, 52, 51, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    alignItems: "stretch",
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
  modalDescription: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    textAlign: "center",
  },
  modalInput: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "800",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalActions: {
    gap: spacing.sm,
  },
});
