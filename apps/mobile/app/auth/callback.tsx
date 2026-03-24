import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { consumeOneTimeToken } from "../../src/lib/auth";
import { NativeLoadingScreen } from "../../src/components/native-loading-screen";
import { useAppStore } from "../../src/store/app-store";
import { colors, spacing, typography } from "../../src/theme";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    error?: string;
    oneTimeToken?: string;
    token?: string;
  }>();
  const config = useAppStore((state) => state.config);
  const upsertSession = useAppStore((state) => state.upsertSession);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (params.error) {
        setError("Erro ao autenticar com Google.");
        return;
      }

      const token = params.oneTimeToken || params.token;
      if (!token) {
        setError("O callback nao retornou token.");
        return;
      }

      try {
        const authResult = await consumeOneTimeToken(config.apiUrl, token);
        await upsertSession(authResult);
        router.replace(
          authResult.user.role === "PENDING"
            ? "/student/onboarding"
            : authResult.user.role === "STUDENT" ||
                authResult.user.role === "ADMIN"
              ? "/student"
              : "/web"
        );
      } catch (callbackError) {
        setError(
          callbackError instanceof Error
            ? callbackError.message
            : "Nao foi possivel concluir o login."
        );
      }
    };

    void run();
  }, [config.apiUrl, params.error, params.oneTimeToken, params.token, router, upsertSession]);

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
    padding: spacing.lg
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading.fontSize,
    fontWeight: "900",
    textAlign: "center"
  },
  description: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    textAlign: "center"
  }
});
