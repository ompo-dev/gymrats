import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, shadow, spacing, typography } from "../theme";

type ButtonProps = {
  disabled?: boolean;
  onPress: () => void;
  title: string;
};

export function PrimaryButton({
  disabled = false,
  onPress,
  title
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        styles.primaryButton,
        (pressed || disabled) && styles.buttonPressed
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  disabled = false,
  onPress,
  title
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        styles.secondaryButton,
        (pressed || disabled) && styles.buttonPressed
      ]}
    >
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderBottomColor: colors.primaryDark,
    borderBottomWidth: 4,
    ...shadow.soft
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ translateY: 1 }]
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: typography.body.fontSize,
    fontWeight: "900",
    letterSpacing: typography.body.letterSpacing
  },
  secondaryButtonText: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "800",
    letterSpacing: typography.body.letterSpacing
  }
});
