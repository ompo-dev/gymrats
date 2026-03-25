import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton, SecondaryButton } from "../src/components/buttons";
import { DuoCard } from "../src/components/duo-card";
import { getNativeCapabilities } from "../src/lib/device-capabilities";
import { refreshAuthSession } from "../src/lib/auth";
import {
  disablePushNotifications,
  enablePushNotifications,
  getDebugPushMetadata,
  getPushStateSnapshot,
  getShortPushToken,
  openPushSystemSettings,
  sendPushTest,
  unlinkPushInstallationForLogout,
} from "../src/lib/push";
import { signOutRemoteSession } from "../src/lib/native-api";
import { isDebugToolsEnabled } from "../src/lib/runtime";
import {
  clearWidgetSnapshot,
  configureWidgetPreset,
  getWidgetStateSnapshot,
  refreshWidgetSnapshot,
} from "../src/lib/widget";
import { ScreenBackground } from "../src/components/screen-background";
import { useAppStore } from "../src/store/app-store";
import type {
  StoredPushState,
  StoredWidgetState,
  WidgetPreset,
} from "../src/store/types";
import { colors, radius, spacing, typography } from "../src/theme";
import { normalizeUrl } from "../src/utils/url";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Nunca";
  }

  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

function getPermissionLabel(status: StoredPushState["permissionStatus"]) {
  switch (status) {
    case "granted":
      return "Concedida";
    case "provisional":
      return "Provisional";
    case "denied":
      return "Negada";
    case "unsupported":
      return "Indisponivel";
    default:
      return "Nao solicitada";
  }
}

function getRegistrationLabel(status: StoredPushState["registrationStatus"]) {
  switch (status) {
    case "registered":
      return "Registrado";
    case "registering":
      return "Registrando";
    case "error":
      return "Erro";
    default:
      return "Nao registrado";
  }
}

function getWidgetStatusLabel(state: StoredWidgetState) {
  if (state.lastSnapshotStatus === "updated") {
    return "Atualizado";
  }

  if (state.lastSnapshotStatus === "error") {
    return "Erro";
  }

  return "Nunca sincronizado";
}

function getRoleLabel(role?: string | null) {
  if (!role) {
    return "Sem sessao";
  }

  return role;
}

const widgetPresetOptions: Array<{ label: string; value: WidgetPreset }> = [
  { label: "Home", value: "home" },
  { label: "Workout", value: "workout" },
  { label: "Nutrition", value: "nutrition" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const config = useAppStore((state) => state.config);
  const updateConfig = useAppStore((state) => state.updateConfig);
  const upsertSession = useAppStore((state) => state.upsertSession);
  const clearSession = useAppStore((state) => state.clearSession);
  const session = useAppStore((state) => state.session);

  const [webUrl, setWebUrl] = useState(config.webUrl);
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [manualToken, setManualToken] = useState(session.token ?? "");
  const [pushState, setPushState] = useState<StoredPushState>({
    enabled: false,
    installationId: null,
    expoPushToken: null,
    permissionStatus: "undetermined",
    registrationStatus: "unregistered",
    lastError: null,
    lastSyncAt: null,
  });
  const [widgetState, setWidgetState] = useState<StoredWidgetState>({
    preset: "home",
    supportStatus: "unavailable",
    supportReason: "Carregando estado do widget...",
    lastSnapshotAt: null,
    lastSnapshotStatus: "never",
    lastError: null,
    snapshot: null,
  });
  const [isLoadingNativeState, setIsLoadingNativeState] = useState(true);
  const [isSavingEnvironment, setIsSavingEnvironment] = useState(false);
  const [isImportingToken, setIsImportingToken] = useState(false);
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const [isUpdatingWidget, setIsUpdatingWidget] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const resolvedHosts = useMemo(
    () => ({
      web: normalizeUrl(webUrl),
      api: normalizeUrl(apiUrl),
    }),
    [apiUrl, webUrl],
  );

  const nativeCapabilities = useMemo(() => getNativeCapabilities(), []);
  const debugToolsEnabled = isDebugToolsEnabled();
  const canShowQaControls =
    debugToolsEnabled || session.user?.role === "ADMIN";
  const pushDebugMetadata = useMemo(() => getDebugPushMetadata(), []);

  const loadNativeState = async () => {
    setIsLoadingNativeState(true);

    try {
      const [nextPushState, nextWidgetState] = await Promise.all([
        getPushStateSnapshot(),
        getWidgetStateSnapshot(),
      ]);
      setPushState(nextPushState);
      setWidgetState(nextWidgetState);
    } finally {
      setIsLoadingNativeState(false);
    }
  };

  useEffect(() => {
    void loadNativeState();
  }, []);

  const handleSaveEnvironment = async () => {
    setError("");
    setNotice("");

    if (!resolvedHosts.web || !resolvedHosts.api) {
      setError("Informe URLs validas para web e API.");
      return;
    }

    setIsSavingEnvironment(true);

    try {
      await updateConfig({
        webUrl: resolvedHosts.web,
        apiUrl: resolvedHosts.api,
      });
      setNotice("Ambiente mobile atualizado.");
      router.replace("/web");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel salvar a configuracao.",
      );
    } finally {
      setIsSavingEnvironment(false);
    }
  };

  const handleManualTokenLogin = async () => {
    setError("");
    setNotice("");

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
          apiUrl: resolvedHosts.api,
        });
      }

      const payload = await refreshAuthSession(normalizedApiUrl, trimmedToken);
      await upsertSession(payload);
      setNotice("Sessao importada com sucesso.");
      router.replace("/web");
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Nao foi possivel validar o token informado.",
      );
    } finally {
      setIsImportingToken(false);
    }
  };

  const handlePushToggle = async (nextValue: boolean) => {
    setError("");
    setNotice("");

    if (nextValue && !session.token) {
      setError("Entre na sua conta para controlar push neste dispositivo.");
      return;
    }

    const sessionToken = session.token;
    setIsUpdatingPush(true);

    try {
      const nextState = nextValue
        ? await enablePushNotifications({
            apiUrl: config.apiUrl,
            sessionToken: sessionToken!,
            capabilities: nativeCapabilities,
          })
        : await disablePushNotifications({
            apiUrl: config.apiUrl,
            sessionToken,
          });

      setPushState(nextState);
      setNotice(
        nextValue
          ? "Notificacoes ativadas neste dispositivo."
          : "Notificacoes desativadas neste dispositivo.",
      );
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : "Nao foi possivel atualizar push.",
      );
      setPushState(await getPushStateSnapshot());
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleReRegisterPush = async () => {
    if (!session.token) {
      setError("Entre na sua conta para registrar push.");
      return;
    }

    setIsUpdatingPush(true);
    setError("");
    setNotice("");

    try {
      const nextState = await enablePushNotifications({
        apiUrl: config.apiUrl,
        sessionToken: session.token,
        capabilities: nativeCapabilities,
      });
      setPushState(nextState);
      setNotice("Registro de push atualizado.");
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : "Nao foi possivel reativar o registro.",
      );
      setPushState(await getPushStateSnapshot());
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleSendPushTest = async () => {
    if (!session.token) {
      setError("Entre na sua conta para enviar o push de teste.");
      return;
    }

    setIsUpdatingPush(true);
    setError("");
    setNotice("");

    try {
      await sendPushTest({
        apiUrl: config.apiUrl,
        sessionToken: session.token,
        route:
          session.user?.role === "GYM"
            ? "/gym"
            : session.user?.role === "PERSONAL"
              ? "/personal"
              : "/student",
      });
      setNotice("Push de teste enviado para este dispositivo.");
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : "Nao foi possivel enviar o push de teste.",
      );
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleWidgetPresetChange = async (preset: WidgetPreset) => {
    setIsUpdatingWidget(true);
    setError("");
    setNotice("");

    try {
      const nextState = await configureWidgetPreset(preset);
      setWidgetState(nextState);
      setNotice("Preset padrao do widget atualizado.");
    } catch (widgetError) {
      setError(
        widgetError instanceof Error
          ? widgetError.message
          : "Nao foi possivel atualizar o preset do widget.",
      );
    } finally {
      setIsUpdatingWidget(false);
    }
  };

  const handleRefreshWidgetSnapshot = async () => {
    setIsUpdatingWidget(true);
    setError("");
    setNotice("");

    try {
      const nextState = await refreshWidgetSnapshot(session.user ?? null);
      setWidgetState(nextState);
      setNotice("Snapshot local do widget atualizado.");
    } catch (widgetError) {
      setError(
        widgetError instanceof Error
          ? widgetError.message
          : "Nao foi possivel atualizar o widget.",
      );
    } finally {
      setIsUpdatingWidget(false);
    }
  };

  const handleClearWidgetSnapshot = async () => {
    setIsUpdatingWidget(true);
    setError("");
    setNotice("");

    try {
      const nextState = await clearWidgetSnapshot();
      setWidgetState(nextState);
      setNotice("Dados locais do widget removidos.");
    } catch (widgetError) {
      setError(
        widgetError instanceof Error
          ? widgetError.message
          : "Nao foi possivel limpar os dados do widget.",
      );
    } finally {
      setIsUpdatingWidget(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");
    setNotice("");

    try {
      if (session.token) {
        await unlinkPushInstallationForLogout({
          apiUrl: config.apiUrl,
          sessionToken: session.token,
        });

        try {
          await signOutRemoteSession(config.apiUrl, session.token);
        } catch {
          // Mantem o fluxo local mesmo se o backend falhar.
        }
      }

      await clearSession();
      setManualToken("");
      setPushState(await getPushStateSnapshot());
      setNotice("Sessao encerrada neste dispositivo.");
      router.replace("/web");
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Nao foi possivel encerrar a sessao.",
      );
    } finally {
      setIsSigningOut(false);
    }
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
              <Pressable hitSlop={12} onPress={() => router.replace("/web")}>
                <Text style={styles.backText}>Voltar</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Central do dispositivo</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Ajustes nativos do GymRats</Text>
              <Text style={styles.heroDescription}>
                Controle sessao, notificacoes push, estado local de widgets e,
                quando habilitado pelo build, ferramentas de ambiente.
              </Text>
            </View>

            <DuoCard>
              <Text style={styles.sectionTitle}>Conta e sessao</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Usuario</Text>
                <Text style={styles.infoValue}>
                  {session.user ? session.user.name : "Nao autenticado"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {session.user?.email || "Sem sessao"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>
                  {getRoleLabel(session.user?.role)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sessao local</Text>
                <Text style={styles.infoValue}>
                  {session.token ? "Sincronizada" : "Nao autenticada"}
                </Text>
              </View>

              <SecondaryButton
                onPress={() => {
                  void handleSignOut();
                }}
                title={isSigningOut ? "Encerrando..." : "Encerrar sessao"}
              />

              <SecondaryButton
                onPress={() => router.replace("/web")}
                title="Voltar ao app"
              />
            </DuoCard>

            <DuoCard>
              <Text style={styles.sectionTitle}>Notificacoes</Text>
              <Text style={styles.sectionDescription}>
                Ative push neste dispositivo e acompanhe o estado real da
                permissao e do registro remoto.
              </Text>

              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.fieldLabel}>
                    Receber notificacoes neste dispositivo
                  </Text>
                  <Text style={styles.fieldHint}>
                    {nativeCapabilities.push.reason ||
                      "O app vai registrar este aparelho no backend para alertas e navegacao por push."}
                  </Text>
                </View>
                <Switch
                  disabled={
                    isUpdatingPush || nativeCapabilities.push.status !== "supported"
                  }
                  onValueChange={(value) => {
                    void handlePushToggle(value);
                  }}
                  trackColor={{
                    false: colors.border,
                    true: colors.primaryLight,
                  }}
                  value={pushState.enabled}
                />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Permissao</Text>
                <Text style={styles.infoValue}>
                  {getPermissionLabel(pushState.permissionStatus)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registro</Text>
                <Text style={styles.infoValue}>
                  {getRegistrationLabel(pushState.registrationStatus)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ultima sincronizacao</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(pushState.lastSyncAt)}
                </Text>
              </View>

              {pushState.lastError ? (
                <Text style={styles.errorText}>{pushState.lastError}</Text>
              ) : null}

              {pushState.permissionStatus === "denied" ? (
                <SecondaryButton
                  onPress={() => {
                    void openPushSystemSettings();
                  }}
                  title="Abrir ajustes do sistema"
                />
              ) : null}

              {pushState.enabled &&
              pushState.registrationStatus !== "registered" ? (
                <SecondaryButton
                  onPress={() => {
                    void handleReRegisterPush();
                  }}
                  title="Reativar registro"
                />
              ) : null}

              {canShowQaControls ? (
                <SecondaryButton
                  onPress={() => {
                    void handleSendPushTest();
                  }}
                  title="Enviar push de teste"
                />
              ) : null}

              {canShowQaControls ? (
                <View style={styles.debugBlock}>
                  <Text style={styles.debugLine}>
                    Installation ID: {pushState.installationId || "nao gerado"}
                  </Text>
                  <Text style={styles.debugLine}>
                    Token: {getShortPushToken(pushState.expoPushToken)}
                  </Text>
                  <Text style={styles.debugLine}>
                    Plataforma: {pushDebugMetadata.platform}
                  </Text>
                  <Text style={styles.debugLine}>
                    App version: {pushDebugMetadata.appVersion}
                  </Text>
                </View>
              ) : null}
            </DuoCard>

            <DuoCard>
              <Text style={styles.sectionTitle}>Widgets</Text>
              <Text style={styles.sectionDescription}>
                Controle o preset local e o snapshot que um widget futuro deste
                build vai consumir.
              </Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Suporte no build</Text>
                <Text style={styles.infoValue}>
                  {widgetState.supportStatus === "supported"
                    ? "Suportado"
                    : widgetState.supportStatus === "not-supported"
                      ? "Nao suportado"
                      : "Indisponivel neste build"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Snapshot</Text>
                <Text style={styles.infoValue}>
                  {getWidgetStatusLabel(widgetState)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ultima atualizacao</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(widgetState.lastSnapshotAt)}
                </Text>
              </View>

              {widgetState.supportReason ? (
                <Text style={styles.fieldHint}>{widgetState.supportReason}</Text>
              ) : null}

              <View style={styles.presetRow}>
                {widgetPresetOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      void handleWidgetPresetChange(option.value);
                    }}
                    style={[
                      styles.presetButton,
                      widgetState.preset === option.value &&
                        styles.presetButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        widgetState.preset === option.value &&
                          styles.presetButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <PrimaryButton
                disabled={isUpdatingWidget}
                onPress={() => {
                  void handleRefreshWidgetSnapshot();
                }}
                title={
                  isUpdatingWidget
                    ? "Atualizando..."
                    : "Atualizar dados do widget agora"
                }
              />

              <SecondaryButton
                onPress={() => {
                  void handleClearWidgetSnapshot();
                }}
                title="Limpar dados do widget"
              />

              {widgetState.snapshot ? (
                <View style={styles.debugBlock}>
                  <Text style={styles.debugLine}>
                    Preset: {widgetState.snapshot.preset}
                  </Text>
                  <Text style={styles.debugLine}>
                    Route: {widgetState.snapshot.route}
                  </Text>
                  <Text style={styles.debugLine}>
                    Summary: {widgetState.snapshot.summary}
                  </Text>
                </View>
              ) : null}
            </DuoCard>

            {debugToolsEnabled ? (
              <DuoCard variant="blue">
                <Text style={styles.sectionTitle}>Ambiente</Text>
                <Text style={styles.sectionDescription}>
                  Ferramentas de debug liberadas por build para webUrl, apiUrl e
                  importacao manual de sessao.
                </Text>

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
                    O token e validado em /api/auth/session e o shell volta para
                    /web apos a importacao.
                  </Text>
                </View>

                <PrimaryButton
                  disabled={isSavingEnvironment}
                  onPress={() => {
                    void handleSaveEnvironment();
                  }}
                  title={
                    isSavingEnvironment
                      ? "Salvando..."
                      : "Salvar ambiente e abrir app"
                  }
                />

                <SecondaryButton
                  onPress={() => {
                    void handleManualTokenLogin();
                  }}
                  title={
                    isImportingToken
                      ? "Validando token..."
                      : "Entrar com token"
                  }
                />
              </DuoCard>
            ) : null}

            {(isLoadingNativeState ||
              isSavingEnvironment ||
              isImportingToken ||
              isUpdatingPush ||
              isUpdatingWidget ||
              isSigningOut) && (
              <ActivityIndicator
                color={colors.primary}
                style={styles.loadingIndicator}
              />
            )}

            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "800",
    letterSpacing: typography.body.letterSpacing,
  },
  headerSpacer: {
    width: 48,
  },
  backText: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
  hero: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  heroTitle: {
    color: colors.foreground,
    fontSize: typography.heading.fontSize,
    fontWeight: "900",
    letterSpacing: typography.heading.letterSpacing,
  },
  heroDescription: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "900",
  },
  sectionDescription: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  infoLabel: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  infoValue: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    textAlign: "right",
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "800",
  },
  fieldHint: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
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
    paddingVertical: spacing.sm,
  },
  tokenInput: {
    minHeight: 132,
  },
  presetRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  presetButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  presetButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  presetButtonText: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  presetButtonTextActive: {
    color: colors.foreground,
  },
  debugBlock: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  debugLine: {
    color: colors.foreground,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  loadingIndicator: {
    marginBottom: spacing.md,
  },
  noticeText: {
    color: colors.primaryDark,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
});
