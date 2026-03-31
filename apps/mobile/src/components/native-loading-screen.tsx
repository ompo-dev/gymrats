import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";
import { ScreenBackground } from "./screen-background";

type NativeLoadingScreenProps = {
  message: string;
};

export function NativeLoadingScreen({ message }: NativeLoadingScreenProps) {
  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.spinnerWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  spinnerWrap: {
    backgroundColor: "rgba(88, 194, 125, 0.12)",
    borderRadius: 48,
    padding: spacing.lg,
  },
  message: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
});
