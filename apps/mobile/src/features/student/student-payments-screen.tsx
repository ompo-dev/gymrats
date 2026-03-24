import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { PixPaymentModal } from "../../components/pix-payment-modal";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type {
  StudentHomeData,
  StudentReferralData,
  StudentReferralWithdraw,
  StudentPayment,
  SubscriptionData,
} from "./types";

type PaymentTab = "memberships" | "payments" | "subscription" | "referrals";

type PixPayload = {
  amount: number;
  brCode: string;
  expiresAt?: string;
  paymentId?: string;
  pixId?: string;
};

type StudentPaymentsScreenProps = {
  data: StudentHomeData;
  initialTab?: string;
  onApplySubscriptionReferral: (referralCode: string) => Promise<PixPayload>;
  onCancelPayment: (paymentId: string) => Promise<void>;
  onCancelSubscription: () => Promise<void>;
  onCreateSubscription: (
    plan: "monthly" | "annual",
    referralCode?: string | null,
  ) => Promise<PixPayload>;
  onPayNow: (paymentId: string) => Promise<PixPayload>;
  onRefresh: () => void;
  onRequestWithdraw: (amountCents: number) => Promise<void>;
  onSimulatePayment: (paymentId: string) => Promise<void>;
  onSimulateSubscription: (pixId: string) => Promise<void>;
  onStartTrial: () => Promise<void>;
  onUpdateReferralPixKey: (pixKey: string, pixKeyType: string) => Promise<void>;
  refreshing: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function getSubscriptionStatusLabel(subscription: SubscriptionData | null) {
  if (!subscription) {
    return "Sem assinatura";
  }

  switch (subscription.status) {
    case "active":
      return "Ativa";
    case "trialing":
      return "Trial ativo";
    case "pending_payment":
      return "Pagamento pendente";
    case "past_due":
      return "Em atraso";
    case "canceled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    default:
      return subscription.status;
  }
}

function PaymentTabs({
  activeTab,
  onChange,
}: {
  activeTab: PaymentTab;
  onChange: (tab: PaymentTab) => void;
}) {
  const items: Array<{ id: PaymentTab; label: string }> = [
    { id: "memberships", label: "Academias" },
    { id: "payments", label: "Historico" },
    { id: "subscription", label: "Assinatura" },
    { id: "referrals", label: "Indicacoes" },
  ];

  return (
    <View style={styles.tabRow}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onChange(item.id)}
          style={[
            styles.tabPill,
            activeTab === item.id && styles.tabPillActive,
          ]}
        >
          <Text
            style={[
              styles.tabPillText,
              activeTab === item.id && styles.tabPillTextActive,
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function MembershipsTab({
  data,
}: {
  data: StudentHomeData;
}) {
  const totalMonthly = data.memberships
    .filter((membership) => membership.status === "active")
    .reduce((sum, membership) => sum + (membership.amount ?? 0), 0);

  return (
    <View style={styles.sectionStack}>
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: `${colors.primary}1A` }]}>
            <MaterialIcons color={colors.primary} name="payments" size={18} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(totalMonthly)}</Text>
          <Text style={styles.statLabel}>Total mensal</Text>
          <Text style={styles.statBadge}>Soma das mensalidades ativas</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: `${colors.warning}1A` }]}>
            <Ionicons color={colors.warning} name="alert-circle-outline" size={18} />
          </View>
          <Text style={styles.statValue}>
            {data.memberships.filter((membership) => membership.status !== "active").length}
          </Text>
          <Text style={styles.statLabel}>Pendencias</Text>
          <Text style={styles.statBadge}>Planos ainda nao ativos</Text>
        </View>
      </View>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="location-outline" size={20} />
          <Text style={styles.cardTitle}>Minhas academias</Text>
        </View>

        {data.memberships.length > 0 ? (
          <View style={styles.listStack}>
            {data.memberships.map((membership) => (
              <View key={membership.id} style={styles.rowCard}>
                <View style={styles.rowCardMain}>
                  <Text style={styles.rowCardTitle}>{membership.gymName}</Text>
                  <Text style={styles.rowCardMeta}>
                    {membership.planName}
                    {membership.nextBillingDate
                      ? ` - vence ${formatShortDate(membership.nextBillingDate)}`
                      : ""}
                  </Text>
                </View>
                <Text style={styles.rowCardBadge}>
                  {membership.status === "active" ? "ativa" : membership.status}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            Nenhuma academia vinculada ainda.
          </Text>
        )}
      </DuoCard>
    </View>
  );
}

function PaymentsHistoryTab({
  loadingAction,
  onCancelPayment,
  onPayNow,
  payments,
}: {
  loadingAction: string | null;
  onCancelPayment: (paymentId: string) => void;
  onPayNow: (paymentId: string) => void;
  payments: StudentPayment[];
}) {
  const pendingCount = payments.filter(
    (payment) => payment.status === "pending" || payment.status === "overdue",
  ).length;

  return (
    <View style={styles.sectionStack}>
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: `${colors.secondary}1A` }]}>
            <MaterialIcons color={colors.secondary} name="receipt-long" size={18} />
          </View>
          <Text style={styles.statValue}>{payments.length}</Text>
          <Text style={styles.statLabel}>Pagamentos</Text>
          <Text style={styles.statBadge}>Historico total</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: `${colors.warning}1A` }]}>
            <Ionicons color={colors.warning} name="time-outline" size={18} />
          </View>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
          <Text style={styles.statBadge}>Aguardando confirmacao</Text>
        </View>
      </View>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="wallet-outline" size={20} />
          <Text style={styles.cardTitle}>Historico de pagamentos</Text>
        </View>

        {payments.length > 0 ? (
          <View style={styles.listStack}>
            {payments.map((payment) => {
              const isPending =
                payment.status === "pending" || payment.status === "overdue";

              return (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.rowCardMain}>
                    <Text style={styles.rowCardTitle}>
                      {payment.gymName} - {payment.planName}
                    </Text>
                    <Text style={styles.rowCardMeta}>
                      {formatCurrency(payment.amount)} - venc. {formatShortDate(payment.dueDate)}
                    </Text>
                    <Text style={styles.rowCardMeta}>
                      Metodo: {payment.paymentMethod}
                    </Text>
                  </View>

                  <Text style={styles.rowCardBadge}>{payment.status}</Text>

                  {isPending ? (
                    <View style={styles.inlineActions}>
                      <SecondaryButton
                        disabled={loadingAction === payment.id}
                        onPress={() => onCancelPayment(payment.id)}
                        title="Cancelar"
                      />
                      <PrimaryButton
                        disabled={loadingAction === payment.id}
                        onPress={() => onPayNow(payment.id)}
                        title="Pagar agora"
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhum pagamento encontrado.</Text>
        )}
      </DuoCard>
    </View>
  );
}

function SubscriptionTab({
  loadingAction,
  onCancelSubscription,
  onCreateSubscription,
  onStartTrial,
  subscription,
}: {
  loadingAction: string | null;
  onCancelSubscription: () => void;
  onCreateSubscription: (
    plan: "monthly" | "annual",
    referralCode?: string | null,
  ) => void;
  onStartTrial: () => void;
  subscription: SubscriptionData | null;
}) {
  const [referralCode, setReferralCode] = useState("");

  return (
    <View style={styles.sectionStack}>
      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <MaterialIcons color={colors.warning} name="workspace-premium" size={20} />
          <Text style={styles.cardTitle}>Assinatura atual</Text>
        </View>
        <Text style={styles.subscriptionStatusLabel}>
          {getSubscriptionStatusLabel(subscription)}
        </Text>
        <Text style={styles.subscriptionPlanText}>
          {subscription?.plan || "Plano Free"}
        </Text>
        {subscription?.currentPeriodEnd ? (
          <Text style={styles.subscriptionMetaText}>
            Periodo atual ate {formatShortDate(subscription.currentPeriodEnd)}
          </Text>
        ) : null}
        {subscription?.enterpriseGymName ? (
          <Text style={styles.subscriptionMetaText}>
            Beneficio via {subscription.enterpriseGymName}
          </Text>
        ) : null}

        {subscription?.status === "trialing" ||
        subscription?.status === "active" ||
        subscription?.status === "pending_payment" ? (
          <SecondaryButton
            disabled={loadingAction === "cancel-subscription"}
            onPress={onCancelSubscription}
            title="Cancelar assinatura"
          />
        ) : null}
      </DuoCard>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="pricetag-outline" size={20} />
          <Text style={styles.cardTitle}>Ativar premium</Text>
        </View>

        <TextInput
          autoCapitalize="none"
          onChangeText={setReferralCode}
          placeholder="Codigo de indicacao opcional"
          placeholderTextColor={colors.foregroundMuted}
          style={styles.textInput}
          value={referralCode}
        />

        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Premium Mensal</Text>
          <Text style={styles.planPrice}>R$ 29,90</Text>
          <Text style={styles.planMeta}>Renovacao mensal via PIX</Text>
          <PrimaryButton
            disabled={loadingAction === "create-monthly"}
            onPress={() =>
              onCreateSubscription("monthly", referralCode.trim() || null)
            }
            title="Gerar PIX mensal"
          />
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Premium Anual</Text>
          <Text style={styles.planPrice}>R$ 239,90</Text>
          <Text style={styles.planMeta}>Melhor custo anual via PIX</Text>
          <PrimaryButton
            disabled={loadingAction === "create-annual"}
            onPress={() =>
              onCreateSubscription("annual", referralCode.trim() || null)
            }
            title="Gerar PIX anual"
          />
        </View>

        <SecondaryButton
          disabled={loadingAction === "trial"}
          onPress={onStartTrial}
          title="Iniciar trial de 14 dias"
        />
      </DuoCard>
    </View>
  );
}

function ReferralWithdrawHistory({
  withdraws,
}: {
  withdraws: StudentReferralWithdraw[];
}) {
  if (withdraws.length === 0) {
    return <Text style={styles.emptyText}>Nenhum saque realizado ainda.</Text>;
  }

  return (
    <View style={styles.listStack}>
      {withdraws.map((withdraw) => (
        <View key={withdraw.id} style={styles.rowCard}>
          <View style={styles.rowCardMain}>
            <Text style={styles.rowCardTitle}>{formatCurrency(withdraw.amount)}</Text>
            <Text style={styles.rowCardMeta}>
              {formatShortDate(withdraw.createdAt)}
            </Text>
          </View>
          <Text style={styles.rowCardBadge}>{withdraw.status}</Text>
        </View>
      ))}
    </View>
  );
}

function ReferralsTab({
  loadingAction,
  onApplySubscriptionReferral,
  onRequestWithdraw,
  onUpdateReferralPixKey,
  referral,
}: {
  loadingAction: string | null;
  onApplySubscriptionReferral: (referralCode: string) => void;
  onRequestWithdraw: (amountCents: number) => void;
  onUpdateReferralPixKey: (pixKey: string, pixKeyType: string) => void;
  referral: StudentReferralData | null;
}) {
  const [pixKey, setPixKey] = useState(referral?.pixKey ?? "");
  const [pixKeyType, setPixKeyType] = useState(referral?.pixKeyType ?? "CPF");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [applyCode, setApplyCode] = useState("");
  const pixKeyTypes = ["CPF", "EMAIL", "PHONE", "RANDOM", "CNPJ"];

  useEffect(() => {
    setPixKey(referral?.pixKey ?? "");
    setPixKeyType(referral?.pixKeyType ?? "CPF");
  }, [referral?.pixKey, referral?.pixKeyType]);

  const withdrawAmountCents = Math.round(Number(withdrawAmount || 0) * 100);

  return (
    <View style={styles.sectionStack}>
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons color={colors.primary} name="cash-outline" size={18} />
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(referral?.balanceReais ?? 0)}
          </Text>
          <Text style={styles.statLabel}>Saldo disponivel</Text>
          <Text style={styles.statBadge}>Pronto para saque</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: `${colors.secondary}1A` }]}>
            <Ionicons color={colors.secondary} name="gift-outline" size={18} />
          </View>
          <Text style={styles.statValue}>
            {formatCurrency((referral?.totalEarnedCents ?? 0) / 100)}
          </Text>
          <Text style={styles.statLabel}>Ganho total</Text>
          <Text style={styles.statBadge}>Historico de indicacoes</Text>
        </View>
      </View>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="copy-outline" size={20} />
          <Text style={styles.cardTitle}>Seu codigo</Text>
        </View>
        <View style={styles.codeCard}>
          <Text selectable style={styles.codeValue}>
            {referral?.referralCode || "Carregando..."}
          </Text>
        </View>
      </DuoCard>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.blue} name="key-outline" size={20} />
          <Text style={styles.cardTitle}>Recebimento PIX</Text>
        </View>
        <View style={styles.tabRow}>
          {pixKeyTypes.map((type) => (
            <Pressable
              key={type}
              onPress={() => setPixKeyType(type)}
              style={[
                styles.tabPill,
                pixKeyType === type && styles.tabPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabPillText,
                  pixKeyType === type && styles.tabPillTextActive,
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          autoCapitalize="none"
          onChangeText={setPixKey}
          placeholder="Sua chave PIX"
          placeholderTextColor={colors.foregroundMuted}
          style={styles.textInput}
          value={pixKey}
        />
        <PrimaryButton
          disabled={loadingAction === "pix-key"}
          onPress={() => onUpdateReferralPixKey(pixKey, pixKeyType)}
          title="Salvar chave PIX"
        />
      </DuoCard>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.warning} name="send-outline" size={20} />
          <Text style={styles.cardTitle}>Solicitar saque</Text>
        </View>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setWithdrawAmount}
          placeholder="Valor em reais"
          placeholderTextColor={colors.foregroundMuted}
          style={styles.textInput}
          value={withdrawAmount}
        />
        <SecondaryButton
          disabled={loadingAction === "withdraw"}
          onPress={() => onRequestWithdraw(withdrawAmountCents)}
          title="Solicitar saque"
        />
      </DuoCard>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="pricetag-outline" size={20} />
          <Text style={styles.cardTitle}>Aplicar codigo em assinatura pendente</Text>
        </View>
        <TextInput
          autoCapitalize="none"
          onChangeText={setApplyCode}
          placeholder="@codigo"
          placeholderTextColor={colors.foregroundMuted}
          style={styles.textInput}
          value={applyCode}
        />
        <PrimaryButton
          disabled={loadingAction === "apply-referral"}
          onPress={() => onApplySubscriptionReferral(applyCode)}
          title="Aplicar indicacao"
        />
      </DuoCard>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="time-outline" size={20} />
          <Text style={styles.cardTitle}>Historico de saques</Text>
        </View>
        <ReferralWithdrawHistory withdraws={referral?.withdraws ?? []} />
      </DuoCard>
    </View>
  );
}

export function StudentPaymentsScreen({
  data,
  initialTab,
  onApplySubscriptionReferral,
  onCancelPayment,
  onCancelSubscription,
  onCreateSubscription,
  onPayNow,
  onRefresh,
  onRequestWithdraw,
  onSimulatePayment,
  onSimulateSubscription,
  onStartTrial,
  onUpdateReferralPixKey,
  refreshing,
}: StudentPaymentsScreenProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("memberships");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState<
    | ({
        kind: "payment" | "subscription";
      } & PixPayload)
    | null
  >(null);

  useEffect(() => {
    if (
      initialTab === "memberships" ||
      initialTab === "payments" ||
      initialTab === "subscription" ||
      initialTab === "referrals"
    ) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const sortedPayments = useMemo(
    () =>
      [...data.payments].sort(
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [data.payments],
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loadingAction !== null}
            tintColor={colors.primary}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Pagamentos</Text>
          <Text style={styles.heroSubtitle}>
            Gerencie assinaturas, cobrancas e indicacoes
          </Text>
        </View>

        <PaymentTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "memberships" ? <MembershipsTab data={data} /> : null}

        {activeTab === "payments" ? (
          <PaymentsHistoryTab
            loadingAction={loadingAction}
            onCancelPayment={(paymentId) => {
              setLoadingAction(paymentId);
              void onCancelPayment(paymentId)
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel cancelar o pagamento.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            onPayNow={(paymentId) => {
              setLoadingAction(paymentId);
              void onPayNow(paymentId)
                .then((payload) => {
                  setPixModal({
                    kind: "payment",
                    ...payload,
                  });
                })
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel gerar o PIX.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            payments={sortedPayments}
          />
        ) : null}

        {activeTab === "subscription" ? (
          <SubscriptionTab
            loadingAction={loadingAction}
            onCancelSubscription={() => {
              setLoadingAction("cancel-subscription");
              void onCancelSubscription()
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel cancelar a assinatura.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            onCreateSubscription={(plan, referralCode) => {
              setLoadingAction(`create-${plan}`);
              void onCreateSubscription(plan, referralCode)
                .then((payload) => {
                  setPixModal({
                    kind: "subscription",
                    ...payload,
                  });
                })
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel gerar o PIX da assinatura.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            onStartTrial={() => {
              setLoadingAction("trial");
              void onStartTrial()
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel iniciar o trial.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            subscription={data.subscription}
          />
        ) : null}

        {activeTab === "referrals" ? (
          <ReferralsTab
            loadingAction={loadingAction}
            onApplySubscriptionReferral={(referralCode) => {
              setLoadingAction("apply-referral");
              void onApplySubscriptionReferral(referralCode)
                .then((payload) => {
                  setPixModal({
                    kind: "subscription",
                    ...payload,
                  });
                })
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel aplicar a indicacao.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            onRequestWithdraw={(amountCents) => {
              setLoadingAction("withdraw");
              void onRequestWithdraw(amountCents)
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel solicitar o saque.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            onUpdateReferralPixKey={(pixKey, pixKeyType) => {
              setLoadingAction("pix-key");
              void onUpdateReferralPixKey(pixKey, pixKeyType)
                .catch((error) => {
                  Alert.alert(
                    "Erro",
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel salvar a chave PIX.",
                  );
                })
                .finally(() => setLoadingAction(null));
            }}
            referral={data.referral}
          />
        ) : null}
      </ScrollView>

      <PixPaymentModal
        amount={pixModal?.amount ?? 0}
        brCode={pixModal?.brCode ?? ""}
        expiresAt={pixModal?.expiresAt}
        onCancelPayment={
          pixModal?.kind === "payment" && pixModal.paymentId
            ? async () => {
                await onCancelPayment(pixModal.paymentId!);
                setPixModal(null);
              }
            : undefined
        }
        onClose={() => setPixModal(null)}
        onSimulate={
          pixModal?.kind === "payment" && pixModal.paymentId
            ? async () => {
                await onSimulatePayment(pixModal.paymentId!);
                setPixModal(null);
              }
            : pixModal?.kind === "subscription" && pixModal.pixId
              ? async () => {
                  await onSimulateSubscription(pixModal.pixId!);
                  setPixModal(null);
                }
              : undefined
        }
        title={
          pixModal?.kind === "subscription"
            ? "PIX da assinatura"
            : "PIX do pagamento"
        }
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
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tabPill: {
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  tabPillText: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  tabPillTextActive: {
    color: colors.blue,
  },
  sectionStack: {
    gap: spacing.md,
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
    fontSize: 22,
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
  listStack: {
    gap: spacing.sm,
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
  paymentCard: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  inlineActions: {
    gap: spacing.sm,
  },
  subscriptionStatusLabel: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  subscriptionPlanText: {
    color: colors.foreground,
    fontSize: 26,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  subscriptionMetaText: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  textInput: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  planCard: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.md,
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
  codeCard: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  codeValue: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
