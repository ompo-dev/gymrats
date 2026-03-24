import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, spacing } from "../../theme";

type StudentMoreScreenProps = {
  isAdmin: boolean;
  onNavigate: (
    tab:
      | "home"
      | "gyms"
      | "personals"
      | "payments"
      | "profile"
      | "education",
    extraParams?: Record<string, string>,
  ) => void;
};

type MenuItem = {
  id:
    | "home"
    | "gyms"
    | "personals"
    | "payments"
    | "profile"
    | "education"
    | "subscription";
  title: string;
  description: string;
  accent: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: "gyms",
    title: "Academias",
    description: "Encontre academias parceiras",
    accent: colors.blue,
    icon: <Ionicons color={colors.blue} name="location-outline" size={22} />,
  },
  {
    id: "personals",
    title: "Personais",
    description: "Encontre personais proximos ou remotos",
    accent: "#8b5cf6",
    icon: <Ionicons color="#8b5cf6" name="people-outline" size={22} />,
  },
  {
    id: "payments",
    title: "Pagamentos",
    description: "Assinaturas e historico",
    accent: colors.warning,
    icon: <Ionicons color={colors.warning} name="wallet-outline" size={22} />,
  },
  {
    id: "subscription",
    title: "Assinatura Premium",
    description: "Gerencie sua assinatura",
    accent: "#f59e0b",
    icon: <MaterialIcons color="#f59e0b" name="workspace-premium" size={22} />,
  },
  {
    id: "home",
    title: "Estatisticas",
    description: "Resumo e evolucao",
    accent: colors.blue,
    icon: <Ionicons color={colors.blue} name="stats-chart-outline" size={22} />,
    adminOnly: true,
  },
  {
    id: "profile",
    title: "Configuracoes",
    description: "Perfil e preferencias",
    accent: colors.primary,
    icon: <Ionicons color={colors.primary} name="settings-outline" size={22} />,
    adminOnly: true,
  },
  {
    id: "education",
    title: "Aprender",
    description: "Anatomia, licoes e quizzes",
    accent: "#8b5cf6",
    icon: <Ionicons color="#8b5cf6" name="book-outline" size={22} />,
    adminOnly: true,
  },
];

export function StudentMoreScreen({
  isAdmin,
  onNavigate,
}: StudentMoreScreenProps) {
  const visibleItems = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>Mais</Text>
        <Text style={styles.subtitle}>Acesse todas as funcionalidades</Text>
      </View>

      <View style={styles.grid}>
        {visibleItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (item.id === "subscription") {
                onNavigate("payments", { subTab: "subscription" });
                return;
              }

              onNavigate(item.id);
            }}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: `${item.accent}1A`,
                },
              ]}
            >
              {item.icon}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Ionicons
              color={colors.foregroundMuted}
              name="chevron-forward"
              size={18}
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  hero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: 14,
    textAlign: "center",
  },
  grid: {
    gap: spacing.sm,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    ...shadow.soft,
  },
  cardPressed: {
    opacity: 0.78,
    transform: [{ translateY: 1 }],
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
  },
  cardDescription: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
