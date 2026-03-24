import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "../../theme";
import type { StudentBottomTab } from "./types";

export function StudentHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerLogo}>GymRats</Text>
      <Pressable
        hitSlop={12}
        onPress={() => router.push("/settings")}
        style={styles.headerAction}
      >
        <Ionicons color={colors.foreground} name="settings-outline" size={18} />
      </Pressable>
    </View>
  );
}

export function StudentStatsRibbon({
  streak,
  xp,
}: {
  streak: number;
  xp: number;
}) {
  return (
    <View style={styles.statsRibbon}>
      <View style={styles.statsPill}>
        <Ionicons color={colors.warning} name="flame" size={18} />
        <Text style={styles.statsPillText}>{streak}</Text>
      </View>
      <View style={styles.statsPill}>
        <Ionicons color={colors.blue} name="flash" size={18} />
        <Text style={styles.statsPillText}>{xp} XP</Text>
      </View>
    </View>
  );
}

export function StudentBottomNav({
  activeTab,
  onChange,
}: {
  activeTab: StudentBottomTab;
  onChange: (tab: StudentBottomTab) => void;
}) {
  const items: Array<{
    id: StudentBottomTab;
    icon: ReactNode;
    label: string;
  }> = [
    {
      id: "home",
      icon: (
        <Ionicons
          color={activeTab === "home" ? colors.blue : colors.foregroundMuted}
          name="home-outline"
          size={20}
        />
      ),
      label: "Inicio",
    },
    {
      id: "learn",
      icon: (
        <Ionicons
          color={activeTab === "learn" ? colors.blue : colors.foregroundMuted}
          name="barbell-outline"
          size={20}
        />
      ),
      label: "Treino",
    },
    {
      id: "diet",
      icon: (
        <Ionicons
          color={activeTab === "diet" ? colors.blue : colors.foregroundMuted}
          name="restaurant-outline"
          size={20}
        />
      ),
      label: "Dieta",
    },
    {
      id: "profile",
      icon: (
        <Ionicons
          color={activeTab === "profile" ? colors.blue : colors.foregroundMuted}
          name="person-outline"
          size={20}
        />
      ),
      label: "Perfil",
    },
    {
      id: "more",
      icon: (
        <MaterialIcons
          color={activeTab === "more" ? colors.blue : colors.foregroundMuted}
          name="more-horiz"
          size={20}
        />
      ),
      label: "Mais",
    },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]}
          >
            {item.icon}
            {isActive ? <Text style={styles.bottomNavLabel}>{item.label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 70,
    paddingHorizontal: spacing.md,
  },
  headerLogo: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  headerAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 2,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  statsRibbon: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  statsPill: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statsPillText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "900",
  },
  bottomNav: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 2,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: spacing.xs,
    paddingTop: 6,
  },
  bottomNavItem: {
    alignItems: "center",
    borderRadius: 12,
    gap: 2,
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bottomNavItemActive: {
    backgroundColor: colors.blueSoft,
  },
  bottomNavLabel: {
    color: colors.blue,
    fontSize: 9,
    fontWeight: "900",
  },
});
