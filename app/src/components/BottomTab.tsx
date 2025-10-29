import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme/colors";
import { fontFamily, fontSizes } from "../theme/typography";

export type TabKey = "agenda" | "insights" | "assistant" | "settings";

type TabConfig = {
  key: TabKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const tabs: TabConfig[] = [
  { key: "agenda", label: "Agenda", icon: "calendar" },
  { key: "insights", label: "Insights", icon: "bar-chart-2" },
  { key: "assistant", label: "Assistant", icon: "message-circle" },
  { key: "settings", label: "Settings", icon: "settings" },
];

type Props = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
};

export const TAB_BAR_HEIGHT = 76;

export const BottomTab = ({ activeTab, onTabChange }: Props) => {
  return (
    <View style={styles.wrapper}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tabButton,
              isActive ? styles.tabActive : null,
              pressed ? styles.tabPressed : null,
            ]}
            onPress={() => onTabChange(tab.key)}
          >
            <Feather
              name={tab.icon}
              size={22}
              color={isActive ? "#FFFFFF" : colors.textMuted}
            />
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "rgba(15, 23, 42, 0.15)",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabPressed: {
    opacity: 0.9,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
});
