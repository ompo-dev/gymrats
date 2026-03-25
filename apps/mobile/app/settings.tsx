import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton, SecondaryButton } from "../src/components/buttons";
import { DuoCard } from "../src/components/duo-card";
import { refreshAuthSession } from "../src/lib/auth";
import { ScreenBackground } from "../src/components/screen-background";
import { useAppStore } from "../src/store/app-store";
import { colors, radius, spacing, typography } from "../src/theme";
import { normalizeUrl } from "../src/utils/url";

export default function SettingsScreen() {
  const router = useRouter();
  const config = useAppStore((state) => state.config);
  const updateConfig = useAppStore((state) => state.updateConfig);
  const upsertSession = useAppStore((state) => state.upsertSession);
  const clearSession = useAppStore((state) => state.clearSession);
  const session = useAppStore((state) => state.session);
  const [webUrl, setWebUrl] = useState(config.webUrl);
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [manualToken, setManualToken] = useState(session.token ?? "");
  const [isImportingToken, setIsImportingToken] = useState(false);
  const [error, setError] = useState("");

  const resolvedHosts = useMemo(
    () => ({
      web: normalizeUrl(webUrl),
      api: normalizeUrl(apiUrl)
    }),
    [apiUrl, webUrl]
  );

  const handleSave = async () => {
    setError("");

    if (!resolvedHosts.web || !resolvedHosts.api) {
      setError("Informe URLs validas para web e API.");
      return;
    }

    setIsSaving(true);

    try {
      await updateConfig({
        webUrl: resolvedHosts.web,
        apiUrl: resolvedHosts.api
      });
      router.replace("/web");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel salvar a configuracao."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resolvePostAuthRoute = (role?: string | null) => {
    if (role === "PENDING") {
      return "/student/onboarding";
    }

    if (role === "STUDENT" || role === "ADMIN") {
      return "/student";
    }

    return "/web";
  };

  const handleManualTokenLogin = async () => {
    setError("");

    const normalizedApiUrl = normalizeUrl(apiUrl);
    const trimmedToken = manualToken.trim();

    if (!normalizedApiUrl) {
      setError("Informe uma URL valida para a API antes de usar o token.");
      return;
    }

    if (!trimmedToken) {
      setError("Cole um token valido para entrar manualmente.");
      return;
    }

    setIsImportingToken(true);

    try {
      if (
        resolvedHosts.web &&
        resolvedHosts.api &&
        (resolvedHosts.web !== config.webUrl || resolvedHosts.api !== config.apiUrl)
      ) {
        await updateConfig({
          webUrl: resolvedHosts.web,
          apiUrl: resolvedHosts.api
        });
      }

      const payload = await refreshAuthSession(normalizedApiUrl, trimmedToken);
      await upsertSession(payload);
      router.replace(resolvePostAuthRoute(payload.user.role));
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Nao foi possivel validar o token informado."
      );
    } finally {
      setIsImportingToken(false);
    }
  };

  const handleClearManualSession = async () => {
    setError("");
    setManualToken("");
    await clearSession();
  };

  return (
    <ScreenBackground>
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        style={styles.safeArea}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Pressable hitSlop={12} onPress={() => router.back()}>
                <Text style={styles.backText}>Voltar</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Ambiente Mobile</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Conectar a plataforma web</Text>
              <Text style={styles.heroDescription}>
                Configure qual ambiente web e qual API o app mobile deve usar.
                Para iPhone em rede local, use o IP LAN da sua maquina em vez de
                localhost.
              </Text>
            </View>

            <DuoCard>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>URL da aplicacao web</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onChangeText={setWebUrl}
                  placeholder="https://gym-rats-testes.vercel.app"
                  placeholderTextColor={colors.foregroundMuted}
                  style={styles.input}
                  value={webUrl}
                />
                <Text style={styles.fieldHint}>
                  Exemplo local: http://192.168.0.10:3000
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>URL da API</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onChangeText={setApiUrl}
                  placeholder="https://gymrats-production.up.railway.app"
                  placeholderTextColor={colors.foregroundMuted}
                  style={styles.input}
                  value={apiUrl}
                />
                <Text style={styles.fieldHint}>
                  Exemplo local: http://192.168.0.10:4000
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Entrar com token manual</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  onChangeText={setManualToken}
                  placeholder="Cole aqui o auth_token do web"
                  placeholderTextColor={colors.foregroundMuted}
                  style={[styles.input, styles.tokenInput]}
                  textAlignVertical="top"
                  value={manualToken}
                />
                <Text style={styles.fieldHint}>
                  Use este bypass enquanto o Google no mobile nao fecha o
                  callback. O token e validado em /api/auth/session.
                </Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <PrimaryButton
                disabled={isSaving}
                onPress={() => {
                  void handleSave();
                }}
                title={isSaving ? "Salvando..." : "Salvar e abrir app"}
              />

              <PrimaryButton
                disabled={isImportingToken}
                onPress={() => {
                  void handleManualTokenLogin();
                }}
                title={
                  isImportingToken ? "Validando token..." : "Entrar com token"
                }
              />

              <SecondaryButton
                onPress={() => {
                  void handleClearManualSession();
                }}
                title="Limpar sessao"
              />

              <SecondaryButton
                onPress={() => router.replace("/web")}
                title="Voltar ao app"
              />

              {isSaving || isImportingToken ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={styles.savingIndicator}
                />
              ) : null}
            </DuoCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "800",
    letterSpacing: typography.body.letterSpacing
  },
  headerSpacer: {
    width: 48
  },
  backText: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontWeight: "700"
  },
  hero: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs
  },
  heroTitle: {
    color: colors.foreground,
    fontSize: typography.heading.fontSize,
    fontWeight: "900",
    letterSpacing: typography.heading.letterSpacing
  },
  heroDescription: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22
  },
  fieldGroup: {
    gap: spacing.xs
  },
  fieldLabel: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "800"
  },
  fieldHint: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: 18
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  tokenInput: {
    minHeight: 132
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    lineHeight: 18
  },
  savingIndicator: {
    marginTop: spacing.sm
  }
});
