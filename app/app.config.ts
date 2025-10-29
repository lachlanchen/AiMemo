import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

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
      bundleIdentifier: "com.lachlanchen.aisecondary",
    },
    android: {
      package: "com.lachlanchen.aisecondary",
    },
    web: {
      bundler: "metro",
    },
    extra: {
      ...config.extra,
      apiUrl,
    },
  };
};
