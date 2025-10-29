import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radii, spacing } from "../theme/colors";
import { fontFamily, fontSizes } from "../theme/typography";
import { useAuthStore } from "../store/useAuthStore";

type AuthMode = "login" | "register" | "forgot";

export const LoginScreen = () => {
  const { login, register, forgotPassword } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("lachlan.chen@icloud.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setInfo(null);
    setLoading(false);
    if (mode !== "register") {
      setConfirmPassword("");
    }
    if (mode === "forgot") {
      setPassword("");
    }
  }, [mode]);

  const submitLabel = (() => {
    if (loading) {
      return mode === "forgot" ? "Sending…" : mode === "register" ? "Creating…" : "Signing in…";
    }
    if (mode === "forgot") return "Send reset link";
    if (mode === "register") return "Create account";
    return "Continue";
  })();

  const title =
    mode === "register"
      ? "Create an account"
      : mode === "forgot"
        ? "Reset password"
        : "Sign in";

  const subtitle =
    mode === "register"
      ? "Spin up your AI assistant in minutes."
      : mode === "forgot"
        ? "We’ll send reset instructions if your email exists in our system."
        : "Log into your assistant to manage mail and scheduling.";

  const handleSubmit = async () => {
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (mode !== "forgot" && !password) {
      setError("Password is required.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim().toLowerCase(), password);
      } else if (mode === "register") {
        await register(email.trim().toLowerCase(), password);
      } else {
        const message = await forgotPassword(email.trim().toLowerCase());
        setInfo(message);
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordFields = mode !== "forgot";

  return (
    <LinearGradient
      colors={["#667EEA", "#764BA2"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Feather name="zap" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.brandName}>AISecretary</Text>
              <Text style={styles.brandTagline}>Inbox intelligence · Calendar precision</Text>
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@icloud.com"
              placeholderTextColor={`${colors.textMuted}B3`}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {renderPasswordFields ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={`${colors.textMuted}B3`}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              {mode === "register" ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat your password"
                    placeholderTextColor={`${colors.textMuted}B3`}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              loading ? styles.primaryButtonDisabled : null,
              pressed && !loading ? styles.primaryButtonPressed : null,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryLabel}>{submitLabel}</Text>
          </Pressable>

          <View style={styles.actionRow}>
            {mode !== "register" ? (
              <Pressable style={styles.secondaryAction} onPress={() => setMode("register")}>
                <Text style={styles.secondaryLabel}>Create account</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryAction} onPress={() => setMode("login")}>
                <Text style={styles.secondaryLabel}>Have an account? Sign in</Text>
              </Pressable>
            )}
            {mode !== "forgot" ? (
              <Pressable style={styles.secondaryAction} onPress={() => setMode("forgot")}>
                <Text style={styles.secondaryLabel}>Forgot password</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryAction} onPress={() => setMode("login")}>
                <Text style={styles.secondaryLabel}>Back to sign in</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "100%",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radii.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    shadowColor: "rgba(15, 23, 42, 0.35)",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  brandTagline: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  title: {
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
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  info: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.pill,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 6,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    backgroundColor: `${colors.primary}80`,
  },
  primaryLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.md,
    color: "#fff",
    letterSpacing: 0.3,
  },
  actionRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondaryAction: {
    paddingVertical: spacing.xs,
  },
  secondaryLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
});
