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
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { ScreenBackground } from "../../components/screen-background";
import type { WidgetPreset } from "../../store/types";
import { colors, radius, spacing, typography } from "../../theme";

interface NativeSettingsInfoRowProps {
  label: string;
  value: string;
  testID?: string;
}

interface NativeSettingsPushSectionProps {
  appVersion: string;
  canShowQaControls: boolean;
  canToggle: boolean;
  capabilityReason: string;
  installationId: string | null;
  isUpdating: boolean;
  lastSyncAtLabel: string;
  permissionLabel: string;
  platform: string;
  pushEnabled: boolean;
  pushLastError: string | null;
  pushToken: string;
  registrationLabel: string;
  showOpenSystemSettings: boolean;
  showReRegister: boolean;
  onOpenSystemSettings: () => void;
  onReRegister: () => void;
  onSendTest: () => void;
  onToggle: (value: boolean) => void;
}

interface NativeSettingsWidgetSectionProps {
  isUpdating: boolean;
  lastUpdatedLabel: string;
  preset: WidgetPreset;
  snapshot: {
    preset: string;
    route: string;
    summary: string;
  } | null;
  statusLabel: string;
  supportLabel: string;
  supportReason: string | null;
  onClearSnapshot: () => void;
  onPresetChange: (preset: WidgetPreset) => void;
  onRefreshSnapshot: () => void;
}

interface NativeSettingsEnvironmentSectionProps {
  apiUrl: string;
  isImportingToken: boolean;
  isSavingEnvironment: boolean;
  manualToken: string;
  webUrl: string;
  onApiUrlChange: (value: string) => void;
  onManualTokenChange: (value: string) => void;
  onSaveEnvironment: () => void;
  onTokenLogin: () => void;
  onWebUrlChange: (value: string) => void;
}

export interface NativeSettingsScreenProps {
  canShowQaControls: boolean;
  debugToolsEnabled: boolean;
  environmentSection: NativeSettingsEnvironmentSectionProps;
  error: string;
  isBusy: boolean;
  isSigningOut: boolean;
  notice: string;
  pushSection: NativeSettingsPushSectionProps;
  sessionEmail: string;
  sessionName: string;
  sessionRoleLabel: string;
  sessionStatusLabel: string;
  widgetSection: NativeSettingsWidgetSectionProps;
  onBack: () => void;
  onSignOut: () => void;
}

const widgetPresetOptions: Array<{ label: string; value: WidgetPreset }> = [
  { label: "Home", value: "home" },
  { label: "Workout", value: "workout" },
  { label: "Nutrition", value: "nutrition" },
];

function NativeSettingsInfoRow({
  label,
  value,
  testID,
}: NativeSettingsInfoRowProps) {
  return (
    <View style={styles.infoRow} testID={testID}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function NativeSettingsPushSection({
  appVersion,
  canShowQaControls,
  canToggle,
  capabilityReason,
  installationId,
  isUpdating,
  lastSyncAtLabel,
  permissionLabel,
  platform,
  pushEnabled,
  pushLastError,
  pushToken,
  registrationLabel,
  showOpenSystemSettings,
  showReRegister,
  onOpenSystemSettings,
  onReRegister,
  onSendTest,
  onToggle,
}: NativeSettingsPushSectionProps) {
  return (
    <View testID="native-settings-screen.push">
      <DuoCard>
      <Text style={styles.sectionTitle}>Notificacoes</Text>
      <Text style={styles.sectionDescription}>
        Ative push neste dispositivo e acompanhe o estado real da permissao e
        do registro remoto.
      </Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.fieldLabel}>
            Receber notificacoes neste dispositivo
          </Text>
          <Text style={styles.fieldHint}>{capabilityReason}</Text>
        </View>
        <Switch
          disabled={isUpdating || !canToggle}
          onValueChange={onToggle}
          testID="native-settings-screen.push.toggle"
          trackColor={{
            false: colors.border,
            true: colors.primaryLight,
          }}
          value={pushEnabled}
        />
      </View>

      <NativeSettingsInfoRow
        label="Permissao"
        testID="native-settings-screen.push.permission"
        value={permissionLabel}
      />
      <NativeSettingsInfoRow
        label="Registro"
        testID="native-settings-screen.push.registration"
        value={registrationLabel}
      />
      <NativeSettingsInfoRow
        label="Ultima sincronizacao"
        testID="native-settings-screen.push.last-sync"
        value={lastSyncAtLabel}
      />

      {pushLastError ? <Text style={styles.errorText}>{pushLastError}</Text> : null}

      {showOpenSystemSettings ? (
        <SecondaryButton
          onPress={onOpenSystemSettings}
          title="Abrir ajustes do sistema"
        />
      ) : null}

      {showReRegister ? (
        <SecondaryButton onPress={onReRegister} title="Reativar registro" />
      ) : null}

      {canShowQaControls ? (
        <SecondaryButton onPress={onSendTest} title="Enviar push de teste" />
      ) : null}

      {canShowQaControls ? (
        <View style={styles.debugBlock} testID="native-settings-screen.push.debug">
          <Text style={styles.debugLine}>
            Installation ID: {installationId || "nao gerado"}
          </Text>
          <Text style={styles.debugLine}>Token: {pushToken}</Text>
          <Text style={styles.debugLine}>Plataforma: {platform}</Text>
          <Text style={styles.debugLine}>App version: {appVersion}</Text>
        </View>
      ) : null}
      </DuoCard>
    </View>
  );
}

function NativeSettingsWidgetSection({
  isUpdating,
  lastUpdatedLabel,
  preset,
  snapshot,
  statusLabel,
  supportLabel,
  supportReason,
  onClearSnapshot,
  onPresetChange,
  onRefreshSnapshot,
}: NativeSettingsWidgetSectionProps) {
  return (
    <View testID="native-settings-screen.widgets">
      <DuoCard>
      <Text style={styles.sectionTitle}>Widgets</Text>
      <Text style={styles.sectionDescription}>
        Controle o preset local e o snapshot que um widget futuro deste build
        vai consumir.
      </Text>

      <NativeSettingsInfoRow
        label="Suporte no build"
        testID="native-settings-screen.widgets.support"
        value={supportLabel}
      />
      <NativeSettingsInfoRow
        label="Snapshot"
        testID="native-settings-screen.widgets.status"
        value={statusLabel}
      />
      <NativeSettingsInfoRow
        label="Ultima atualizacao"
        testID="native-settings-screen.widgets.last-update"
        value={lastUpdatedLabel}
      />

      {supportReason ? <Text style={styles.fieldHint}>{supportReason}</Text> : null}

      <View style={styles.presetRow} testID="native-settings-screen.widgets.presets">
        {widgetPresetOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onPresetChange(option.value)}
            style={[
              styles.presetButton,
              preset === option.value && styles.presetButtonActive,
            ]}
            testID={`native-settings-screen.widgets.preset.${option.value}`}
          >
            <Text
              style={[
                styles.presetButtonText,
                preset === option.value && styles.presetButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton
        disabled={isUpdating}
        onPress={onRefreshSnapshot}
        title={isUpdating ? "Atualizando..." : "Atualizar dados do widget agora"}
      />

      <SecondaryButton
        onPress={onClearSnapshot}
        title="Limpar dados do widget"
      />

      {snapshot ? (
        <View style={styles.debugBlock} testID="native-settings-screen.widgets.snapshot">
          <Text style={styles.debugLine}>Preset: {snapshot.preset}</Text>
          <Text style={styles.debugLine}>Route: {snapshot.route}</Text>
          <Text style={styles.debugLine}>Summary: {snapshot.summary}</Text>
        </View>
      ) : null}
      </DuoCard>
    </View>
  );
}

function NativeSettingsEnvironmentSection({
  apiUrl,
  isImportingToken,
  isSavingEnvironment,
  manualToken,
  webUrl,
  onApiUrlChange,
  onManualTokenChange,
  onSaveEnvironment,
  onTokenLogin,
  onWebUrlChange,
}: NativeSettingsEnvironmentSectionProps) {
  return (
    <View testID="native-settings-screen.environment">
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
          onChangeText={onWebUrlChange}
          placeholder="https://gym-rats-testes.vercel.app"
          placeholderTextColor={colors.foregroundMuted}
          style={styles.input}
          testID="native-settings-screen.environment.web-url"
          value={webUrl}
        />
        <Text style={styles.fieldHint}>Exemplo local: http://192.168.0.10:3000</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>URL da API</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={onApiUrlChange}
          placeholder="https://gymrats-production.up.railway.app"
          placeholderTextColor={colors.foregroundMuted}
          style={styles.input}
          testID="native-settings-screen.environment.api-url"
          value={apiUrl}
        />
        <Text style={styles.fieldHint}>Exemplo local: http://192.168.0.10:4000</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Entrar com token manual</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          onChangeText={onManualTokenChange}
          placeholder="Cole aqui um bearer token valido"
          placeholderTextColor={colors.foregroundMuted}
          style={[styles.input, styles.tokenInput]}
          testID="native-settings-screen.environment.manual-token"
          textAlignVertical="top"
          value={manualToken}
        />
        <Text style={styles.fieldHint}>
          O token e validado em /api/auth/session com cabecalho de cliente
          nativo e o shell volta para /web apos a importacao.
        </Text>
      </View>

      <PrimaryButton
        disabled={isSavingEnvironment}
        onPress={onSaveEnvironment}
        title={
          isSavingEnvironment ? "Salvando..." : "Salvar ambiente e abrir app"
        }
      />

      <SecondaryButton
        onPress={onTokenLogin}
        title={isImportingToken ? "Validando token..." : "Entrar com token"}
      />
      </DuoCard>
    </View>
  );
}

export function NativeSettingsScreen({
  canShowQaControls,
  debugToolsEnabled,
  environmentSection,
  error,
  isBusy,
  isSigningOut,
  notice,
  pushSection,
  sessionEmail,
  sessionName,
  sessionRoleLabel,
  sessionStatusLabel,
  widgetSection,
  onBack,
  onSignOut,
}: NativeSettingsScreenProps) {
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
            testID="native-settings-screen"
          >
            <View style={styles.header}>
              <Pressable hitSlop={12} onPress={onBack}>
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

            <View testID="native-settings-screen.account">
              <DuoCard>
              <Text style={styles.sectionTitle}>Conta e sessao</Text>
              <NativeSettingsInfoRow
                label="Usuario"
                testID="native-settings-screen.account.user"
                value={sessionName}
              />
              <NativeSettingsInfoRow
                label="Email"
                testID="native-settings-screen.account.email"
                value={sessionEmail}
              />
              <NativeSettingsInfoRow
                label="Role"
                testID="native-settings-screen.account.role"
                value={sessionRoleLabel}
              />
              <NativeSettingsInfoRow
                label="Sessao local"
                testID="native-settings-screen.account.status"
                value={sessionStatusLabel}
              />

              <SecondaryButton
                onPress={onSignOut}
                title={isSigningOut ? "Encerrando..." : "Encerrar sessao"}
              />
              <SecondaryButton onPress={onBack} title="Voltar ao app" />
              </DuoCard>
            </View>

            <NativeSettingsPushSection {...pushSection} />
            <NativeSettingsWidgetSection {...widgetSection} />

            {debugToolsEnabled ? (
              <NativeSettingsEnvironmentSection {...environmentSection} />
            ) : null}

            {isBusy ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.loadingIndicator}
              />
            ) : null}

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
    gap: spacing.md,
    justifyContent: "space-between",
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
    justifyContent: "center",
    minHeight: 44,
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
