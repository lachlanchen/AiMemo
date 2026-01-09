import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme/colors";
import { fontFamily, fontSizes } from "../theme/typography";

const insights = [
  {
    id: "insight-1",
    title: "Inbox load decreased by 18%",
    detail: "AI triaged 42 messages and proposed 9 calendar slots in the last 24 hours.",
    icon: "trending-down" as const,
    accent: "#10B981",
  },
  {
    id: "insight-2",
    title: "Follow-up reminders",
    detail: "3 conversations need confirmation replies before tomorrow at noon.",
    icon: "alert-circle" as const,
    accent: "#F59E0B",
  },
  {
    id: "insight-3",
    title: "Scheduling efficiency",
    detail: "Average time-to-schedule is down to 2.4 hours with automated assistant replies.",
    icon: "clock" as const,
    accent: "#6366F1",
  },
];

export const InsightsScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>
        Real-time summaries and assistant highlights across your inbox and calendar.
      </Text>
      {insights.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={[styles.iconBadge, { backgroundColor: `${item.accent}15` }]}>
            <Feather name={item.icon} size={24} color={item.accent} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDetail}>{item.detail}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDetail: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
