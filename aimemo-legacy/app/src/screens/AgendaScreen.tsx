import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";

import { apiClient } from "../api/client";
import { colors, radii, spacing } from "../theme/colors";
import { fontFamily, fontSizes } from "../theme/typography";
import { useSettingsStore } from "../store/useSettingsStore";

const mockAgenda = [
  {
    id: "1",
    title: "Sync with Product",
    time: "Today · 10:30 AM",
    location: "Zoom",
    status: "Confirmed",
  },
  {
    id: "2",
    title: "AI Secretary Architecture Review",
    time: "Today · 2:00 PM",
    location: "HQ · Room 12A",
    status: "Pending",
  },
  {
    id: "3",
    title: "Follow-up: Investor Email Thread",
    time: "Tomorrow · 9:00 AM",
    location: "Draft Response Ready",
    status: "Draft",
  },
];

export const AgendaScreen = () => {
  const apiUrl = useSettingsStore((state) => state.apiUrl);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiClient.health(),
    gcTime: 0,
  });

  const status = data?.data?.status ?? "unknown";
  const responseError = data?.error;

  const statusColor = useMemo(() => {
    switch (status) {
      case "ok":
        return colors.success;
      case "degraded":
        return colors.warning;
      default:
        return colors.error;
    }
  }, [status]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroGreeting}>Welcome back 👋</Text>
              <Text style={styles.heroTitle}>Here is your agenda</Text>
            </View>
            <Feather name="calendar" size={32} color={colors.primary} />
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </View>
            <Text style={styles.statusLabel}>Backend health</Text>
          </View>
          <View style={styles.apiRow}>
            <Feather name="cloud" size={18} color={colors.textMuted} />
            <Text style={styles.apiLabel}>{apiUrl}</Text>
          </View>
          {responseError ? (
            <Text style={styles.errorText}>{responseError.message}</Text>
          ) : null}
          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && !isFetching ? styles.refreshPressed : undefined,
            ]}
            onPress={() => refetch()}
            disabled={isFetching}
          >
            <Feather name="refresh-ccw" size={18} color="#fff" />
            <Text style={styles.refreshLabel}>{isFetching ? "Checking..." : "Refresh"}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Pressable style={styles.sectionAction}>
              <Text style={styles.sectionActionLabel}>See all</Text>
              <Feather name="chevron-right" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {mockAgenda.map((item) => (
            <View key={item.id} style={styles.agendaCard}>
              <View style={styles.agendaHeader}>
                <View style={styles.iconPill}>
                  <Feather name="clock" size={18} color={colors.primary} />
                </View>
                <Text style={styles.agendaTitle}>{item.title}</Text>
              </View>
              <View style={styles.agendaRow}>
                <Feather name="calendar" size={16} color={colors.textMuted} />
                <Text style={styles.agendaDetail}>{item.time}</Text>
              </View>
              <View style={styles.agendaRow}>
                <Feather name="map-pin" size={16} color={colors.textMuted} />
                <Text style={styles.agendaDetail}>{item.location}</Text>
              </View>
              <View style={styles.agendaFooter}>
                <View style={styles.tag}>
                  <Text style={styles.tagLabel}>{item.status}</Text>
                </View>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonLabel}>Open</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: spacing.xl,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  heroGreeting: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  heroTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
    letterSpacing: 0.5,
  },
  statusLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  apiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  apiLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  refreshButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  refreshPressed: {
    transform: [{ scale: 0.98 }],
  },
  refreshLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.sm,
    color: "#FFFFFF",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionActionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  agendaCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  agendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  agendaTitle: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  agendaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  agendaDetail: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  agendaFooter: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.primary}10`,
    borderRadius: radii.pill,
  },
  tagLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.xs,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
});
