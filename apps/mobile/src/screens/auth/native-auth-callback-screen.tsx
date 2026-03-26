import { StyleSheet, Text, View } from "react-native";
import { NativeLoadingScreen } from "../../components/native-loading-screen";
import { colors, spacing, typography } from "../../theme";

interface NativeAuthCallbackScreenProps {
  error: string;
}

export function NativeAuthCallbackScreen({
  error,
}: NativeAuthCallbackScreenProps) {
  if (!error) {
    return <NativeLoadingScreen message="Finalizando autenticacao..." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Erro no login</Text>
      <Text style={styles.description}>{error}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.lg,
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
});
