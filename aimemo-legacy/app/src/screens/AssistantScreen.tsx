import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  FlatList,
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
import { TAB_BAR_HEIGHT } from "../components/BottomTab";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const seedMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Morning summary ready. 2 meetings rescheduled, 1 draft reply awaiting your approval.",
    timestamp: "08:01",
  },
  {
    id: "2",
    role: "user",
    content: "Schedule a 30-min catch-up with Mira next week.",
    timestamp: "08:03",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "I suggested Tuesday and Thursday afternoons based on Mira's availability. Waiting for confirmation.",
    timestamp: "08:04",
  },
];

export const AssistantScreen = () => {
  const [messages, setMessages] = useState(seedMessages);
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    if (!draft.trim()) {
      return;
    }

    const outgoing: Message = {
      id: String(Date.now()),
      role: "user",
      content: draft.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, outgoing]);
    setDraft("");

    // Placeholder assistant echo response.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content:
            "Acknowledged. I'll analyze your inbox and prepare a suggested reply once AI workflows are connected.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 0, default: 0 })}
    >
      <FlatList
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUser = item.role === "user";
          return (
            <View
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  !isUser ? styles.assistantText : undefined,
                ]}
              >
                {item.content}
              </Text>
              <Text
                style={[
                  styles.messageTimestamp,
                  !isUser ? styles.assistantTimestamp : undefined,
                ]}
              >
                {item.timestamp}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask your assistant…"
          placeholderTextColor={`${colors.textMuted}B3`}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            pressed ? styles.sendButtonPressed : undefined,
            !draft.trim() ? styles.sendDisabled : undefined,
          ]}
          onPress={handleSend}
          disabled={!draft.trim()}
        >
          <Feather name="send" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_HEIGHT + spacing.xl * 2,
    gap: spacing.sm,
  },
  messageBubble: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  assistantText: {
    color: colors.text,
  },
  messageTimestamp: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.xs,
    color: "#E2E8F0",
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  assistantTimestamp: {
    color: colors.textMuted,
  },
  composer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TAB_BAR_HEIGHT + spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: fontSizes.md,
    backgroundColor: colors.background,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  sendDisabled: {
    backgroundColor: `${colors.primary}55`,
  },
});
