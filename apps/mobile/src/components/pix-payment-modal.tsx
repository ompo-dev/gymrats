import { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, shadow, spacing, typography } from "../theme";
import { PrimaryButton, SecondaryButton } from "./buttons";

type PixPaymentModalProps = {
  amount: number;
  brCode: string;
  expiresAt?: string;
  onClose: () => void;
  onSimulate?: () => Promise<void>;
  onCancelPayment?: () => Promise<void>;
  title: string;
  valueSlot?: {
    label?: string;
    strikethrough?: number;
    badge?: string;
  };
  visible: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

export function PixPaymentModal({
  amount,
  brCode,
  expiresAt,
  onCancelPayment,
  onClose,
  onSimulate,
  title,
  valueSlot,
  visible,
}: PixPaymentModalProps) {
  const expiresLabel = useMemo(() => {
    if (!expiresAt) {
      return "";
    }

    const parsed = new Date(expiresAt);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleString("pt-BR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
    });
  }, [expiresAt]);

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            Use o codigo PIX abaixo no seu banco. O app continua sincronizando o
            status apos a confirmacao.
          </Text>

          <View style={styles.amountCard}>
            {valueSlot?.strikethrough ? (
              <Text style={styles.originalAmount}>
                {formatCurrency(valueSlot.strikethrough)}
              </Text>
            ) : null}
            <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
            {valueSlot?.label ? (
              <Text style={styles.amountLabel}>{valueSlot.label}</Text>
            ) : null}
            {valueSlot?.badge ? (
              <Text style={styles.badgeText}>{valueSlot.badge}</Text>
            ) : null}
            {expiresLabel ? (
              <Text style={styles.expiryText}>Expira em {expiresLabel}</Text>
            ) : null}
          </View>

          <View style={styles.codeBox}>
            <ScrollView nestedScrollEnabled style={styles.codeScroll}>
              <Text selectable style={styles.codeText}>
                {brCode}
              </Text>
            </ScrollView>
          </View>

          <PrimaryButton
            onPress={() =>
              Share.share({
                message: brCode,
                title: "Codigo PIX GymRats",
              })
            }
            title="Compartilhar codigo PIX"
          />

          {onSimulate ? (
            <SecondaryButton onPress={() => void onSimulate()} title="Simular pagamento" />
          ) : null}

          {onCancelPayment ? (
            <SecondaryButton
              onPress={() => void onCancelPayment()}
              title="Cancelar cobranca"
            />
          ) : null}

          <Pressable onPress={onClose} style={styles.closeLink}>
            <Text style={styles.closeLinkText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
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
    maxHeight: "88%",
    padding: spacing.lg,
    width: "100%",
    ...shadow.soft,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading.fontSize,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    textAlign: "center",
  },
  amountCard: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    gap: 4,
    padding: spacing.md,
  },
  originalAmount: {
    color: colors.foregroundMuted,
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  amountValue: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "900",
  },
  amountLabel: {
    color: colors.foregroundMuted,
    fontSize: 13,
    textAlign: "center",
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  expiryText: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  codeBox: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    maxHeight: 180,
    padding: spacing.sm,
  },
  codeScroll: {
    minHeight: 100,
  },
  codeText: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 18,
  },
  closeLink: {
    alignItems: "center",
    paddingVertical: 6,
  },
  closeLinkText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    fontWeight: "800",
  },
});
