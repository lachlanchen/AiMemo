import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://ai-backend.lazying.art";

  return {
    ...config,
    name: "AISecretary",
    slug: "aisecretary",
    version: "0.1.0",
    orientation: "portrait",
    scheme: "aisecretary",
    userInterfaceStyle: "automatic",
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lachlanchen.aisecretary",
    },
    android: {
      package: "com.lachlanchen.aisecretary",
    },
    web: {
      bundler: "metro",
    },
    plugins: ["expo-secure-store"],
    extra: {
      ...config.extra,
      apiUrl,
    },
  };
};
