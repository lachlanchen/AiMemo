import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radii, spacing } from "../theme/colors";
import { fontFamily, fontSizes } from "../theme/typography";
import { useSettingsStore } from "../store/useSettingsStore";
import { useAuthStore } from "../store/useAuthStore";

export const SettingsScreen = () => {
  const { apiUrl, setApiUrl } = useSettingsStore();
  const { user, logout } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailAddress, setEmailAddress] = useState(user?.email ?? "");
  const [imapServer, setImapServer] = useState("imap.mail.me.com");
  const [smtpServer, setSmtpServer] = useState("smtp.mail.me.com");
  const [appPassword, setAppPassword] = useState("");

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing information", "Please fill out every field.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Confirm that both new passwords are identical.");
      return;
    }

    Alert.alert(
      "Coming soon",
      "Password updates will be routed to the backend once authentication endpoints are available."
    );
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleEmailSave = () => {
    if (!emailAddress || !appPassword) {
      Alert.alert("Missing information", "Email address and app password are required.");
      return;
    }

    Alert.alert(
      "Saved locally",
      "Email credentials are stored temporarily. Replace this with a secure vault integration before production."
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.subtitle}>Manage your account, assistant preferences, and mailboxes.</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="user" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutPressed : null]}
            onPress={logout}
          >
            <Feather name="log-out" size={16} color="#fff" />
            <Text style={styles.logoutLabel}>Sign out</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? "—"}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Feather name="lock" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Change Password</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            placeholder="Enter current password"
            secureTextEntry
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>New password</Text>
          <TextInput
            placeholder="Create a strong password"
            secureTextEntry
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            placeholder="Re-enter new password"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
        <Pressable style={styles.primaryButton} onPress={handlePasswordChange}>
          <Text style={styles.primaryButtonLabel}>Update password</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Feather name="mail" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Email Integration</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Configure the mailbox that the assistant should monitor. iCloud works with IMAP/SMTP and
          app-specific passwords.
        </Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            placeholder="you@icloud.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={emailAddress}
            onChangeText={setEmailAddress}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>IMAP server</Text>
          <TextInput
            placeholder="imap.mail.me.com"
            autoCapitalize="none"
            style={styles.input}
            value={imapServer}
            onChangeText={setImapServer}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>SMTP server</Text>
          <TextInput
            placeholder="smtp.mail.me.com"
            autoCapitalize="none"
            style={styles.input}
            value={smtpServer}
            onChangeText={setSmtpServer}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>App password</Text>
          <TextInput
            placeholder="xxxx-xxxx-xxxx-xxxx"
            autoCapitalize="none"
            secureTextEntry
            style={styles.input}
            value={appPassword}
            onChangeText={setAppPassword}
          />
        </View>
        <Pressable style={styles.primaryButton} onPress={handleEmailSave}>
          <Text style={styles.primaryButtonLabel}>Save mailbox</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Feather name="settings" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>API Target</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Point the client at your backend instance. Use your LAN IP when testing on devices or
          emulators.
        </Text>
        <TextInput
          placeholder="http://localhost:8787"
          autoCapitalize="none"
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
        />
        <Text style={styles.helperText}>
          Changes apply instantly across Agenda, Insights, and Assistant features.
        </Text>
      </View>
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
  header: {
    fontFamily: fontFamily.bold,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  sectionDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  helperText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  primaryButtonLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.sm,
    color: "#fff",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.xs,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
