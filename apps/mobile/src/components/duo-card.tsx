import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, shadow, spacing } from "../theme";

type DuoCardProps = {
  children: ReactNode;
};

export function DuoCard({ children }: DuoCardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.soft
  }
});
