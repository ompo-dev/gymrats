import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { colors, radius, shadow, spacing } from "../theme";

type DuoCardVariant = "default" | "highlighted" | "blue" | "orange" | "yellow";

type DuoCardPadding = "none" | "sm" | "md" | "lg";

type DuoCardProps = {
  children: ReactNode;
  padding?: DuoCardPadding;
  style?: StyleProp<ViewStyle>;
  variant?: DuoCardVariant;
};

const paddingStyles = StyleSheet.create({
  none: {
    padding: 0,
  },
  sm: {
    padding: spacing.sm,
  },
  md: {
    padding: spacing.md,
  },
  lg: {
    padding: 20,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...shadow.soft,
  },
  highlighted: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
  blue: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.secondary,
    borderWidth: 2,
    shadowColor: colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
  orange: {
    backgroundColor: colors.orangeSoft,
    borderColor: colors.orange,
    borderWidth: 2,
    shadowColor: colors.orange,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
  yellow: {
    backgroundColor: "rgba(255, 200, 0, 0.1)",
    borderColor: colors.warning,
    borderWidth: 2,
    shadowColor: colors.warning,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
});

export function DuoCard({
  children,
  padding = "lg",
  style,
  variant = "default",
}: DuoCardProps) {
  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        paddingStyles[padding],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
});
