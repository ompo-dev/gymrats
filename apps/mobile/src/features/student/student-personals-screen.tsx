import * as Location from "expo-location";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PrimaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { LeafletMap } from "../../components/leaflet-map";
import { PixPaymentModal } from "../../components/pix-payment-modal";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type {
  StudentPersonalAssignment,
  StudentPersonalDirectoryItem,
  StudentPersonalFilter,
  StudentPersonalProfile,
  StudentPixPayload,
} from "./types";

type Props = {
  initialCouponId?: string | null;
  initialPersonalId?: string | null;
  initialPlanId?: string | null;
  onLoadAssigned: () => Promise<{ personals: StudentPersonalAssignment[] }>;
  onLoadDirectory: (options: {
    filter: StudentPersonalFilter;
    lat?: number;
    lng?: number;
  }) => Promise<{ personals: StudentPersonalDirectoryItem[] }>;
  onLoadProfile: (personalId: string) => Promise<StudentPersonalProfile>;
  onOpenGym: (gymId: string) => void;
  onSubscribe: (
    personalId: string,
    planId: string,
    couponId?: string | null,
  ) => Promise<StudentPixPayload>;
  onCancelAssignment: (assignmentId: string) => Promise<void>;
  onSimulatePayment: (paymentId: string) => Promise<void>;
};

const FILTERS: Array<{ label: string; value: StudentPersonalFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Inscritos", value: "subscribed" },
  { label: "Proximos", value: "near" },
  { label: "Remoto", value: "remote" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({
  uri,
  name,
  size = 56,
}: {
  uri?: string | null;
  name: string;
  size?: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatarImage, { height: size, width: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[styles.avatarFallback, { height: size, width: size, borderRadius: size / 2 }]}
    >
      <Text style={styles.avatarFallbackText}>{initials(name) || "PR"}</Text>
    </View>
  );
}

function Tag({
  color,
  icon,
  label,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: `${color}1A` }]}>
      <Ionicons color={color} name={icon} size={12} />
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function StudentPersonalsScreen({
  initialCouponId,
  initialPersonalId,
  initialPlanId,
  onCancelAssignment,
  onLoadAssigned,
  onLoadDirectory,
  onLoadProfile,
  onOpenGym,
  onSimulatePayment,
  onSubscribe,
}: Props) {
  const [filter, setFilter] = useState<StudentPersonalFilter>("all");
  const [directory, setDirectory] = useState<StudentPersonalDirectoryItem[]>([]);
  const [assignments, setAssignments] = useState<StudentPersonalAssignment[]>([]);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string | null>(
    initialPersonalId ?? null,
  );
  const [selectedProfile, setSelectedProfile] =
    useState<StudentPersonalProfile | null>(null);
  const [pixPayload, setPixPayload] = useState<StudentPixPayload | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<"list" | "map">("list");
  const [refreshing, setRefreshing] = useState(false);
  const autoSubscribeRef = useRef(false);

  const loadDirectory = useCallback(
    async (nextFilter: StudentPersonalFilter) => {
      if (nextFilter === "near" && !coords) {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          setLocationDenied(true);
          setDirectory([]);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nextCoords = {
          lat: current.coords.latitude,
          lng: current.coords.longitude,
        };
        setCoords(nextCoords);
        setLocationDenied(false);
        const response = await onLoadDirectory({ filter: nextFilter, ...nextCoords });
        setDirectory(response.personals ?? []);
        return;
      }

      const response = await onLoadDirectory({
        filter: nextFilter,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      setLocationDenied(false);
      setDirectory(response.personals ?? []);
    },
    [coords, onLoadDirectory],
  );

  const loadAll = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const assignedResponse = await onLoadAssigned();
        setAssignments(assignedResponse.personals ?? []);
        await loadDirectory(filter);

        if (selectedPersonalId) {
          const profile = await onLoadProfile(selectedPersonalId);
          setSelectedProfile(profile);
        }
      } catch (error) {
        Alert.alert(
          "Erro ao carregar personais",
          error instanceof Error ? error.message : "Erro inesperado.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, loadDirectory, onLoadAssigned, onLoadProfile, selectedPersonalId],
  );

  const openPersonal = useCallback(
    async (personalId: string) => {
      try {
        setSelectedPersonalId(personalId);
        const profile = await onLoadProfile(personalId);
        setSelectedProfile(profile);
      } catch (error) {
        Alert.alert(
          "Nao foi possivel abrir o perfil",
          error instanceof Error ? error.message : "Erro inesperado.",
        );
      }
    },
    [onLoadProfile],
  );

  useEffect(() => {
    void loadAll(true);
  }, [loadAll]);

  useEffect(() => {
    if (loading || !selectedPersonalId || selectedProfile) {
      return;
    }

    void openPersonal(selectedPersonalId);
  }, [loading, openPersonal, selectedPersonalId, selectedProfile]);

  useEffect(() => {
    if (
      !selectedProfile ||
      !selectedPersonalId ||
      !initialPlanId ||
      selectedProfile.isSubscribed ||
      autoSubscribeRef.current
    ) {
      return;
    }

    autoSubscribeRef.current = true;

    void onSubscribe(selectedPersonalId, initialPlanId, initialCouponId ?? null)
      .then((payload) => {
        setPixPayload(payload);
      })
      .catch((error) => {
        Alert.alert(
          "Nao foi possivel iniciar a assinatura",
          error instanceof Error ? error.message : "Erro inesperado.",
        );
      });
  }, [
    initialCouponId,
    initialPlanId,
    onSubscribe,
    selectedPersonalId,
    selectedProfile,
  ]);

  const handleSubscribe = useCallback(
    async (planId: string) => {
      if (!selectedPersonalId) {
        return;
      }

      try {
        const payload = await onSubscribe(
          selectedPersonalId,
          planId,
          initialCouponId ?? null,
        );
        setPixPayload(payload);
      } catch (error) {
        Alert.alert(
          "Nao foi possivel assinar",
          error instanceof Error ? error.message : "Erro inesperado.",
        );
      }
    },
    [initialCouponId, onSubscribe, selectedPersonalId],
  );

  const activePlanSummary = useMemo(() => {
    const plan = selectedProfile?.myAssignment?.activePlan;

    if (!plan) {
      return "";
    }

    return `${plan.name} - ${formatCurrency(plan.price)}`;
  }, [selectedProfile?.myAssignment?.activePlan]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Carregando personais...</Text>
        <Text style={styles.centerText}>
          Sincronizando discovery, vinculos e planos ativos.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => void loadAll(false)}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedProfile ? (
          <>
            <Pressable
              onPress={() => {
                setSelectedPersonalId(null);
                setSelectedProfile(null);
              }}
              style={styles.backButton}
            >
              <Ionicons color={colors.blue} name="arrow-back" size={16} />
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>

            <DuoCard>
              <View style={styles.profileHeader}>
                <Avatar
                  uri={selectedProfile.avatar}
                  name={selectedProfile.name}
                  size={72}
                />
                <View style={styles.profileBody}>
                  <Text style={styles.profileName}>{selectedProfile.name}</Text>
                  <View style={styles.wrap}>
                    {selectedProfile.atendimentoPresencial ? (
                      <Tag color={colors.blue} icon="location-outline" label="Presencial" />
                    ) : null}
                    {selectedProfile.atendimentoRemoto ? (
                      <Tag color="#8b5cf6" icon="videocam-outline" label="Remoto" />
                    ) : null}
                    {selectedProfile.isSubscribed ? (
                      <Tag color={colors.primary} icon="checkmark-circle-outline" label="Inscrito" />
                    ) : null}
                  </View>
                </View>
              </View>
              {selectedProfile.bio ? (
                <Text style={styles.mutedText}>{selectedProfile.bio}</Text>
              ) : null}
            </DuoCard>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons color={colors.blue} name="people-outline" size={18} />
                <Text style={styles.statValue}>{selectedProfile.studentsCount ?? 0}</Text>
                <Text style={styles.statLabel}>Alunos</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialIcons color={colors.warning} name="fitness-center" size={18} />
                <Text style={styles.statValue}>{selectedProfile.gyms.length}</Text>
                <Text style={styles.statLabel}>Academias</Text>
              </View>
            </View>

            {selectedProfile.gyms.length ? (
              <DuoCard>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons color={colors.blue} name="business-outline" size={20} />
                  <Text style={styles.cardTitle}>Academias vinculadas</Text>
                </View>
                <View style={styles.stack}>
                  {selectedProfile.gyms.map((gym) => (
                    <Pressable
                      key={gym.id}
                      onPress={() => onOpenGym(gym.id)}
                      style={styles.listCard}
                    >
                      <View style={styles.iconBubble}>
                        <Ionicons color={colors.blue} name="location-outline" size={16} />
                      </View>
                      <View style={styles.listBody}>
                        <Text style={styles.itemTitle}>{gym.name}</Text>
                        <Text style={styles.itemMeta}>
                          {gym.address || "Abrir detalhes da academia"}
                        </Text>
                      </View>
                      <Text style={styles.linkText}>Abrir</Text>
                    </Pressable>
                  ))}
                </View>
              </DuoCard>
            ) : null}

            {selectedProfile.isSubscribed && selectedProfile.myAssignment ? (
              <DuoCard>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons color={colors.primary} name="checkmark-done-outline" size={20} />
                    <Text style={styles.cardTitle}>Vinculo ativo</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      void onCancelAssignment(selectedProfile.myAssignment!.id)
                        .then(() => loadAll(false))
                        .catch((error) => {
                          Alert.alert(
                            "Nao foi possivel desvincular",
                            error instanceof Error ? error.message : "Erro inesperado.",
                          );
                        })
                    }
                  >
                    <Text style={styles.dangerLink}>Desvincular</Text>
                  </Pressable>
                </View>
                <Text style={styles.itemTitle}>Voce ja esta vinculado a este personal.</Text>
                <Text style={styles.itemMeta}>{activePlanSummary || "Plano ativo confirmado."}</Text>
              </DuoCard>
            ) : null}

            <DuoCard>
              <View style={styles.cardHeaderLeft}>
                <Ionicons color={colors.warning} name="card-outline" size={20} />
                <Text style={styles.cardTitle}>Planos</Text>
              </View>
              <View style={styles.stack}>
                {selectedProfile.plans.length ? (
                  selectedProfile.plans.map((plan) => {
                    const active = selectedProfile.myAssignment?.activePlan?.id === plan.id;

                    return (
                      <View key={plan.id} style={styles.planCard}>
                        <View style={styles.cardHeader}>
                          <View style={styles.listBody}>
                            <Text style={styles.itemTitle}>{plan.name}</Text>
                            <Text style={styles.itemMeta}>
                              {plan.duration} dias - {plan.type}
                            </Text>
                          </View>
                          <View style={styles.priceWrap}>
                            <Text style={styles.priceText}>{formatCurrency(plan.price)}</Text>
                            {active ? (
                              <Text style={styles.activeBadge}>Plano ativo</Text>
                            ) : null}
                          </View>
                        </View>
                        {plan.benefits?.length ? (
                          <View style={styles.wrap}>
                            {plan.benefits.slice(0, 4).map((benefit) => (
                              <View key={benefit} style={styles.benefitPill}>
                                <Text style={styles.benefitText}>{benefit}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                        {!selectedProfile.isSubscribed && !active ? (
                          <PrimaryButton
                            onPress={() => void handleSubscribe(plan.id)}
                            title="Assinar"
                          />
                        ) : null}
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.centerText}>
                    Este personal ainda nao publicou planos ativos.
                  </Text>
                )}
              </View>
            </DuoCard>
          </>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Personais</Text>
              <Text style={styles.heroSubtitle}>
                Encontre atendimentos proximos, remotos e gerencie seus vinculos.
              </Text>
            </View>

            {assignments.length ? (
              <DuoCard>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons color="#8b5cf6" name="people-outline" size={20} />
                  <Text style={styles.cardTitle}>Meus personais</Text>
                </View>
                <View style={styles.stack}>
                  {assignments.map((assignment) => (
                    <Pressable
                      key={assignment.id}
                      onPress={() => void openPersonal(assignment.personal.id)}
                      style={styles.listCard}
                    >
                      <Avatar
                        uri={assignment.personal.avatar}
                        name={assignment.personal.name}
                      />
                      <View style={styles.listBody}>
                        <Text style={styles.itemTitle}>{assignment.personal.name}</Text>
                        <Text style={styles.itemMeta}>
                          {assignment.gym?.name || "Atendimento independente"}
                        </Text>
                      </View>
                      <Text style={styles.linkText}>Abrir</Text>
                    </Pressable>
                  ))}
                </View>
              </DuoCard>
            ) : null}

            <DuoCard>
              <View style={styles.cardHeaderLeft}>
                <Ionicons color="#8b5cf6" name="options-outline" size={20} />
                <Text style={styles.cardTitle}>Filtros</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {FILTERS.map((item) => {
                    const active = item.value === filter;

                    return (
                      <Pressable
                        key={item.value}
                        onPress={() => {
                          setFilter(item.value);
                          void loadDirectory(item.value);
                        }}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                      >
                        <Text
                          style={[
                            styles.filterText,
                            active && styles.filterTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              {filter === "near" && locationDenied ? (
                <Text style={styles.warningText}>
                  Libere a localizacao para ver os profissionais realmente proximos.
                </Text>
              ) : null}
              <View style={styles.filterRow}>
                <Pressable
                  onPress={() => setMapMode("list")}
                  style={[styles.filterPill, mapMode === "list" && styles.filterPillActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      mapMode === "list" && styles.filterTextActive,
                    ]}
                  >
                    Lista
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMapMode("map")}
                  style={[styles.filterPill, mapMode === "map" && styles.filterPillActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      mapMode === "map" && styles.filterTextActive,
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
                  <Ionicons color="#8b5cf6" name="navigate-outline" size={20} />
                  <Text style={styles.cardTitle}>Mapa de personais</Text>
                </View>
                <LeafletMap
                  markers={directory
                    .filter((personal) => personal.coordinates)
                    .map((personal) => ({
                      accent: personal.isSubscribed ? colors.primary : "#8b5cf6",
                      id: personal.id,
                      label: personal.name,
                      lat: personal.coordinates!.lat,
                      lng: personal.coordinates!.lng,
                      subtitle:
                        personal.gyms.length > 0
                          ? personal.gyms.map((gym) => gym.name).join(", ")
                          : personal.bio || undefined,
                    }))}
                  onSelectMarker={(personalId) => {
                    void openPersonal(personalId);
                  }}
                  selectedMarkerId={selectedPersonalId}
                  userLocation={coords}
                />
              </DuoCard>
            ) : null}

            <DuoCard>
              <View style={styles.cardHeaderLeft}>
                <Ionicons color="#8b5cf6" name="sparkles-outline" size={20} />
                <Text style={styles.cardTitle}>Descobrir</Text>
              </View>
              {directory.length ? (
                <View style={styles.stack}>
                  {directory.map((personal) => (
                    <Pressable
                      key={personal.id}
                      onPress={() => void openPersonal(personal.id)}
                      style={styles.listCard}
                    >
                      <Avatar uri={personal.avatar} name={personal.name} />
                      <View style={styles.listBody}>
                        <Text style={styles.itemTitle}>{personal.name}</Text>
                        {personal.bio ? (
                          <Text numberOfLines={2} style={styles.itemMeta}>
                            {personal.bio}
                          </Text>
                        ) : null}
                        <View style={styles.wrap}>
                          {personal.atendimentoPresencial ? (
                            <Tag color={colors.blue} icon="location-outline" label="Presencial" />
                          ) : null}
                          {personal.atendimentoRemoto ? (
                            <Tag color="#8b5cf6" icon="videocam-outline" label="Remoto" />
                          ) : null}
                          {personal.isSubscribed ? (
                            <Tag color={colors.primary} icon="checkmark-circle-outline" label="Inscrito" />
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.linkText}>
                        {typeof personal.distance === "number"
                          ? `${personal.distance.toFixed(1)} km`
                          : "Abrir"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.centerState}>
                  <Text style={styles.centerTitle}>Nenhum personal encontrado</Text>
                  <Text style={styles.centerText}>
                    Ajuste os filtros ou tente novamente em outra regiao.
                  </Text>
                </View>
              )}
            </DuoCard>
          </>
        )}
      </ScrollView>

      <PixPaymentModal
        amount={pixPayload?.amount ?? 0}
        brCode={pixPayload?.brCode ?? ""}
        expiresAt={pixPayload?.expiresAt}
        onClose={() => setPixPayload(null)}
        onSimulate={
          pixPayload?.paymentId
            ? async () => {
                await onSimulatePayment(pixPayload.paymentId!);
                setPixPayload(null);
                await loadAll(false);
              }
            : undefined
        }
        title="Pagamento do personal"
        valueSlot={{
          label: pixPayload?.planName || "Finalize o PIX para ativar o vinculo",
          strikethrough: pixPayload?.originalPrice,
          badge: pixPayload?.appliedCoupon
            ? `Cupom ${pixPayload.appliedCoupon.code} aplicado`
            : undefined,
        }}
        visible={Boolean(pixPayload?.brCode)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  centerTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  centerText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
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
    lineHeight: 20,
    textAlign: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  backButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900",
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
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  profileBody: {
    flex: 1,
    gap: 8,
  },
  profileName: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  avatarImage: {
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft,
  },
  avatarFallbackText: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: "900",
  },
  mutedText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  statValue: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  stack: {
    gap: spacing.sm,
  },
  listCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  listBody: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  itemMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  iconBubble: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blueSoft,
  },
  dangerLink: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "900",
  },
  planCard: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  priceWrap: {
    alignItems: "flex-end",
    gap: 4,
  },
  priceText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  activeBadge: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  benefitPill: {
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  benefitText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  filterPillActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  filterText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  filterTextActive: {
    color: colors.blue,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
  },
});
