import { Pressable, StyleSheet, Text } from "react-native";
import {
  colors,
  radius,
  shadow,
  typography,
  withNunitoStyles,
} from "../theme";

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
        disabled && styles.buttonDisabled,
        pressed && styles.primaryButtonPressed
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
        disabled && styles.buttonDisabled,
        pressed && styles.secondaryButtonPressed
      ]}
    >
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create(withNunitoStyles({
  buttonBase: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 24,
    paddingVertical: 10
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderBottomColor: colors.primaryDark,
    borderBottomWidth: 4,
    ...shadow.soft
  },
  primaryButtonPressed: {
    borderBottomWidth: 2,
    opacity: 0.92,
    transform: [{ translateY: 2 }]
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 2
  },
  secondaryButtonPressed: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.blue,
    opacity: 0.92,
    transform: [{ scale: 0.985 }]
  },
  buttonDisabled: {
    opacity: 0.5
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: typography.body.fontSize,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  secondaryButtonText: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  }
}));
