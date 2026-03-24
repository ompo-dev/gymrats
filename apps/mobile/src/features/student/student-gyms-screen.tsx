import * as Location from "expo-location";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { LeafletMap } from "../../components/leaflet-map";
import { PixPaymentModal } from "../../components/pix-payment-modal";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type {
  GymLocation,
  GymProfileData,
  StudentGymMembership,
  StudentHomeData,
} from "./types";

type StudentGymsScreenProps = {
  data: StudentHomeData;
  initialGymId?: string;
  onCancelMembership: (membershipId: string) => Promise<void>;
  onChangePlan: (membershipId: string, planId: string) => Promise<{
    amount: number;
    brCode: string;
    expiresAt?: string;
    paymentId?: string;
  }>;
  onJoinGym: (gymId: string, planId: string) => Promise<{
    amount: number;
    brCode: string;
    expiresAt?: string;
    paymentId?: string;
  }>;
  onLoadGymProfile: (gymId: string) => Promise<GymProfileData>;
  onRefresh: () => void;
  onSimulatePayment: (paymentId: string) => Promise<void>;
  refreshing: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function getMembershipForGym(
  memberships: StudentGymMembership[],
  gymId: string,
) {
  return memberships.find((membership) => membership.gymId === gymId) ?? null;
}

function GymListCard({
  gym,
  membership,
  onOpen,
}: {
  gym: GymLocation;
  membership: StudentGymMembership | null;
  onOpen: () => void;
}) {
  return (
    <Pressable onPress={onOpen} style={styles.gymListCard}>
      <View style={styles.gymListMain}>
        <Text style={styles.gymListTitle}>{gym.name}</Text>
        <Text style={styles.gymListMeta}>
          {gym.address || "Endereco indisponivel"}
        </Text>
        <Text style={styles.gymListMeta}>
          {typeof gym.rating === "number" ? `${gym.rating.toFixed(1)} estrelas` : "Sem nota"}
        </Text>
      </View>
      <View style={styles.gymListRight}>
        {membership ? (
          <Text style={styles.gymListBadge}>
            {membership.status === "active" ? "matriculado" : membership.status}
          </Text>
        ) : null}
        <Ionicons color={colors.foregroundMuted} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

function DayPassList({
  passes,
}: {
  passes: StudentHomeData["dayPasses"];
}) {
  if (passes.length === 0) {
    return null;
  }

  return (
    <DuoCard>
      <View style={styles.cardHeaderLeft}>
        <Ionicons color={colors.warning} name="ticket-outline" size={20} />
        <Text style={styles.cardTitle}>Seus day passes</Text>
      </View>

      <View style={styles.listStack}>
        {passes.map((pass) => (
          <View key={pass.id} style={styles.rowCard}>
            <View style={styles.rowCardMain}>
              <Text style={styles.rowCardTitle}>{pass.gymName}</Text>
              <Text style={styles.rowCardMeta}>
                Valido ate {new Date(pass.validDate).toLocaleString("pt-BR")}
              </Text>
            </View>
            <Text style={styles.rowCardBadge}>
              {pass.status === "active" ? "ativo" : pass.status}
            </Text>
          </View>
        ))}
      </View>
    </DuoCard>
  );
}

function GymProfileView({
  changingPlanId,
  gym,
  hasActiveDayPass,
  isCancellingMembership,
  joiningPlanId,
  onBack,
  onCancelMembership,
  onChangePlan,
  onJoinPlan,
  onPurchaseDayPass,
  sourceGym,
}: {
  changingPlanId: string | null;
  gym: GymProfileData;
  hasActiveDayPass: boolean;
  isCancellingMembership: boolean;
  joiningPlanId: string | null;
  onBack: () => void;
  onCancelMembership: () => void;
  onChangePlan: (planId: string) => void;
  onJoinPlan: (planId: string) => void;
  onPurchaseDayPass: () => void;
  sourceGym: GymLocation | null;
}) {
  return (
    <View style={styles.sectionStack}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.foreground} name="arrow-back" size={18} />
        <Text style={styles.backButtonText}>Voltar para academias</Text>
      </Pressable>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="business-outline" size={20} />
          <Text style={styles.cardTitle}>{gym.name}</Text>
        </View>
        <Text style={styles.gymProfileText}>{gym.address}</Text>
        {gym.phone ? <Text style={styles.gymProfileText}>Tel: {gym.phone}</Text> : null}
        <Text style={styles.gymProfileText}>
          {gym.rating.toFixed(1)} estrelas - {gym.totalReviews} avaliacoes
        </Text>
        <Text style={styles.gymProfileText}>
          {gym.activeStudents}/{gym.totalStudents} alunos ativos
        </Text>
        {gym.phone ? (
          <SecondaryButton
            onPress={() => {
              void Linking.openURL(`tel:${gym.phone}`);
            }}
            title="Ligar para a academia"
          />
        ) : null}
      </DuoCard>

      {gym.myMembership ? (
        <DuoCard>
          <View style={styles.cardHeaderLeft}>
            <Ionicons color={colors.primary} name="checkmark-circle-outline" size={20} />
            <Text style={styles.cardTitle}>Sua matricula</Text>
          </View>
          <Text style={styles.gymProfileText}>
            {gym.myMembership.status === "active"
              ? "Matricula ativa nesta academia."
              : "Matricula pendente de pagamento."}
          </Text>
          <SecondaryButton
            disabled={isCancellingMembership}
            onPress={onCancelMembership}
            title={isCancellingMembership ? "Cancelando..." : "Cancelar assinatura"}
          />
        </DuoCard>
      ) : null}

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <MaterialIcons color={colors.warning} name="workspace-premium" size={20} />
          <Text style={styles.cardTitle}>Planos disponiveis</Text>
        </View>

        <View style={styles.sectionStack}>
          {gym.plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <Text style={styles.planTitle}>{plan.name}</Text>
              <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
              <Text style={styles.planMeta}>
                {plan.type} - {plan.duration} dias
              </Text>
              {plan.benefits.length > 0 ? (
                <Text style={styles.planMeta}>{plan.benefits.join(" • ")}</Text>
              ) : null}
              {gym.myMembership?.planId === plan.id ? (
                <View style={styles.planStatusBadge}>
                  <Text style={styles.planStatusBadgeText}>
                    {gym.myMembership.status === "active"
                      ? "Plano ativo"
                      : "Mensalidade pendente"}
                  </Text>
                </View>
              ) : gym.myMembership?.status === "active" ? (
                <SecondaryButton
                  disabled={changingPlanId === plan.id}
                  onPress={() => onChangePlan(plan.id)}
                  title={
                    changingPlanId === plan.id
                      ? "Gerando PIX..."
                      : "Trocar para este plano"
                  }
                />
              ) : (
                <PrimaryButton
                  disabled={joiningPlanId === plan.id}
                  onPress={() => onJoinPlan(plan.id)}
                  title={joiningPlanId === plan.id ? "Gerando PIX..." : "Entrar neste plano"}
                />
              )}
            </View>
          ))}
        </View>
      </DuoCard>

      {!gym.myMembership &&
      sourceGym?.plans?.daily &&
      sourceGym.plans.daily > 0 &&
      (!sourceGym.membershipPlans || sourceGym.membershipPlans.length === 0) ? (
        <DuoCard>
          <View style={styles.cardHeaderLeft}>
            <Ionicons color={colors.warning} name="ticket-outline" size={20} />
            <Text style={styles.cardTitle}>Day pass</Text>
          </View>
          <Text style={styles.gymProfileText}>
            Diaria disponivel por {formatCurrency(sourceGym.plans.daily)} com acesso
            por 24 horas.
          </Text>
          {hasActiveDayPass ? (
            <View style={styles.planStatusBadge}>
              <Text style={styles.planStatusBadgeText}>Passe ativo</Text>
            </View>
          ) : (
            <PrimaryButton onPress={onPurchaseDayPass} title="Comprar diaria" />
          )}
        </DuoCard>
      ) : null}

      {gym.amenities.length > 0 ? (
        <DuoCard>
          <View style={styles.cardHeaderLeft}>
            <Ionicons color={colors.primary} name="sparkles-outline" size={20} />
            <Text style={styles.cardTitle}>Estrutura</Text>
          </View>
          <Text style={styles.gymProfileText}>{gym.amenities.join(" • ")}</Text>
        </DuoCard>
      ) : null}

      {gym.personals.length > 0 ? (
        <DuoCard>
          <View style={styles.cardHeaderLeft}>
            <Ionicons color={colors.blue} name="people-outline" size={20} />
            <Text style={styles.cardTitle}>Personais vinculados</Text>
          </View>
          <View style={styles.listStack}>
            {gym.personals.map((personal) => (
              <View key={personal.id} style={styles.rowCard}>
                <View style={styles.rowCardMain}>
                  <Text style={styles.rowCardTitle}>{personal.name}</Text>
                  <Text style={styles.rowCardMeta}>Disponivel nesta academia</Text>
                </View>
              </View>
            ))}
          </View>
        </DuoCard>
      ) : null}
    </View>
  );
}

export function StudentGymsScreen({
  data,
  initialGymId,
  onCancelMembership,
  onChangePlan,
  onJoinGym,
  onLoadGymProfile,
  onRefresh,
  onSimulatePayment,
  refreshing,
}: StudentGymsScreenProps) {
  const [selectedGym, setSelectedGym] = useState<GymProfileData | null>(null);
  const [loadingGymId, setLoadingGymId] = useState<string | null>(null);
  const [joiningPlanId, setJoiningPlanId] = useState<string | null>(null);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [isCancellingMembership, setIsCancellingMembership] = useState(false);
  const [localDayPasses, setLocalDayPasses] = useState(data.dayPasses);
  const [mapMode, setMapMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pixModal, setPixModal] = useState<{
    amount: number;
    brCode: string;
    expiresAt?: string;
    paymentId?: string;
  } | null>(null);

  const openGym = async (gym: GymLocation) => {
    setLoadingGymId(gym.id);

    try {
      const profile = await onLoadGymProfile(gym.id);
      setSelectedGym(profile);
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a academia.",
      );
    } finally {
      setLoadingGymId(null);
    }
  };

  const joinPlan = async (planId: string) => {
    if (!selectedGym) {
      return;
    }

    setJoiningPlanId(planId);

    try {
      const payload = await onJoinGym(selectedGym.id, planId);
      setPixModal(payload);
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Nao foi possivel gerar o PIX da academia.",
      );
    } finally {
      setJoiningPlanId(null);
    }
  };

  const changePlan = async (planId: string) => {
    if (!selectedGym?.myMembership) {
      return;
    }

    setChangingPlanId(planId);

    try {
      const payload = await onChangePlan(selectedGym.myMembership.id, planId);
      setPixModal(payload);
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Nao foi possivel gerar o PIX para trocar o plano.",
      );
    } finally {
      setChangingPlanId(null);
    }
  };

  const cancelMembership = async () => {
    if (!selectedGym?.myMembership) {
      return;
    }

    setIsCancellingMembership(true);

    try {
      await onCancelMembership(selectedGym.myMembership.id);
      setSelectedGym({
        ...selectedGym,
        myMembership: null,
      });
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Nao foi possivel cancelar a matricula.",
      );
    } finally {
      setIsCancellingMembership(false);
    }
  };

  const purchaseDayPass = () => {
    if (!selectedGym) {
      return;
    }

    const sourceGym = data.gymLocations.find((gym) => gym.id === selectedGym.id);
    const dailyPrice = sourceGym?.plans?.daily;

    if (!sourceGym || !dailyPrice || dailyPrice <= 0) {
      return;
    }

    setLocalDayPasses((current) => [
      {
        gymId: sourceGym.id,
        gymName: sourceGym.name,
        id: `day-pass-${Date.now()}`,
        price: dailyPrice,
        purchaseDate: new Date().toISOString(),
        qrCode: `QR_${sourceGym.id}_${Date.now()}`,
        status: "active",
        validDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      ...current.filter((pass) => !(pass.gymId === sourceGym.id && pass.status === "active")),
    ]);

    Alert.alert(
      "Diaria liberada",
      `Passe de 24h ativado em ${sourceGym.name}.`,
    );
  };

  useEffect(() => {
    setLocalDayPasses(data.dayPasses);
  }, [data.dayPasses]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted" || cancelled) {
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setUserLocation({
            lat: current.coords.latitude,
            lng: current.coords.longitude,
          });
        }
      } catch {
        // Map can still render without the user pin.
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialGymId || selectedGym || loadingGymId) {
      return;
    }

    const target = data.gymLocations.find((gym) => gym.id === initialGymId);

    if (target) {
      void openGym(target);
    }
  }, [data.gymLocations, initialGymId, loadingGymId, selectedGym]);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loadingGymId !== null}
            tintColor={colors.primary}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Academias</Text>
          <Text style={styles.heroSubtitle}>
            Explore parceiros e entre em um plano pelo mobile
          </Text>
        </View>

        {selectedGym ? (
          <GymProfileView
            changingPlanId={changingPlanId}
            gym={selectedGym}
            hasActiveDayPass={localDayPasses.some(
              (pass) => pass.gymId === selectedGym.id && pass.status === "active",
            )}
            isCancellingMembership={isCancellingMembership}
            joiningPlanId={joiningPlanId}
            onBack={() => setSelectedGym(null)}
            onCancelMembership={() => void cancelMembership()}
            onChangePlan={(planId) => void changePlan(planId)}
            onJoinPlan={(planId) => void joinPlan(planId)}
            onPurchaseDayPass={purchaseDayPass}
            sourceGym={
              data.gymLocations.find((gym) => gym.id === selectedGym.id) ?? null
            }
          />
        ) : (
          <View style={styles.sectionStack}>
            <DuoCard>
              <View style={styles.cardHeaderLeft}>
                <Ionicons color={colors.secondary} name="map-outline" size={20} />
                <Text style={styles.cardTitle}>Visualizacao</Text>
              </View>
              <View style={styles.filterRow}>
                <Pressable
                  onPress={() => setMapMode("list")}
                  style={[styles.modeChip, mapMode === "list" && styles.modeChipActive]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      mapMode === "list" && styles.modeChipTextActive,
                    ]}
                  >
                    Lista
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMapMode("map")}
                  style={[styles.modeChip, mapMode === "map" && styles.modeChipActive]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      mapMode === "map" && styles.modeChipTextActive,
                    ]}
                  >
                    Mapa
                  </Text>
                </Pressable>
              </View>
            </DuoCard>

            {mapMode === "map" ? (
              <DuoCard>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons color={colors.secondary} name="navigate-outline" size={20} />
                  <Text style={styles.cardTitle}>Mapa de academias</Text>
                </View>
                <LeafletMap
                  markers={data.gymLocations
                    .filter((gym) => gym.coordinates)
                    .map((gym) => ({
                      accent:
                        getMembershipForGym(data.memberships, gym.id)?.status === "active"
                          ? colors.primary
                          : colors.blue,
                      id: gym.id,
                      label: gym.name,
                      lat: gym.coordinates!.lat,
                      lng: gym.coordinates!.lng,
                      subtitle: gym.address || undefined,
                    }))}
                  onSelectMarker={(gymId) => {
                    const target = data.gymLocations.find((gym) => gym.id === gymId);
                    if (target) {
                      void openGym(target);
                    }
                  }}
                  selectedMarkerId={null}
                  userLocation={userLocation}
                />
              </DuoCard>
            ) : null}

            <DayPassList passes={localDayPasses} />

            <DuoCard>
              <View style={styles.cardHeaderLeft}>
                <Ionicons color={colors.secondary} name="location-outline" size={20} />
                <Text style={styles.cardTitle}>Academias parceiras</Text>
              </View>

              <View style={styles.listStack}>
                {data.gymLocations.map((gym) => (
                  <GymListCard
                    key={gym.id}
                    gym={gym}
                    membership={getMembershipForGym(data.memberships, gym.id)}
                    onOpen={() => void openGym(gym)}
                  />
                ))}
              </View>

              {loadingGymId ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingInlineText}>Carregando perfil da academia...</Text>
                </View>
              ) : null}
            </DuoCard>
          </View>
        )}
      </ScrollView>

      <PixPaymentModal
        amount={pixModal?.amount ?? 0}
        brCode={pixModal?.brCode ?? ""}
        expiresAt={pixModal?.expiresAt}
        onClose={() => setPixModal(null)}
        onSimulate={
          pixModal?.paymentId
            ? async () => {
                await onSimulatePayment(pixModal.paymentId!);
                setPixModal(null);
                setSelectedGym(null);
              }
            : undefined
        }
        title="PIX da academia"
        visible={pixModal != null}
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
  sectionStack: {
    gap: spacing.md,
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
  gymListCard: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  gymListMain: {
    flex: 1,
    gap: 4,
  },
  gymListTitle: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "900",
  },
  gymListMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  gymListRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  gymListBadge: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  listStack: {
    gap: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  loadingInline: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  loadingInlineText: {
    color: colors.foregroundMuted,
    fontSize: 13,
  },
  modeChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeChipActive: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  modeChipText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  modeChipTextActive: {
    color: colors.blue,
  },
  backButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  backButtonText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  gymProfileText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  planCard: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.md,
  },
  planStatusBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  planStatusBadgeText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
  },
  planTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
  },
  planPrice: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  planMeta: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  rowCard: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm,
  },
  rowCardMain: {
    flex: 1,
    gap: 3,
    paddingRight: spacing.sm,
  },
  rowCardTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  rowCardMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  rowCardBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
});
