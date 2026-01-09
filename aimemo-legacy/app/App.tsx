import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useBootstrap } from "./src/hooks/useBootstrap";
import { LoginScreen } from "./src/screens/LoginScreen";
import { AgendaScreen } from "./src/screens/AgendaScreen";
import { InsightsScreen } from "./src/screens/InsightsScreen";
import { AssistantScreen } from "./src/screens/AssistantScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { BottomTab, TAB_BAR_HEIGHT, TabKey } from "./src/components/BottomTab";
import { useAuthStore } from "./src/store/useAuthStore";
import { colors } from "./src/theme/colors";

const queryClient = new QueryClient();

const MainShell = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>("agenda");

  const screen = useMemo(() => {
    switch (activeTab) {
      case "agenda":
        return <AgendaScreen />;
      case "insights":
        return <InsightsScreen />;
      case "assistant":
        return <AssistantScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <View style={styles.shell}>
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, TAB_BAR_HEIGHT / 2),
          },
        ]}
      >
        {screen}
      </SafeAreaView>
      <BottomTab activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

export default function App() {
  const { isReady } = useBootstrap();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {isAuthenticated ? <MainShell /> : <LoginScreen />}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
});
