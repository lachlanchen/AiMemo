import { ConfigContext, ExpoConfig } from "expo/config";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({
  path: path.resolve(__dirname, "..", ".env"),
  override: false,
});
loadEnv({
  path: path.resolve(__dirname, "../..", ".env"),
  override: false,
});

if (!process.env.EXPO_PUBLIC_API_URL && process.env.BACKEND_PUBLIC_URL) {
  process.env.EXPO_PUBLIC_API_URL = process.env.BACKEND_PUBLIC_URL;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    process.env.BACKEND_PUBLIC_URL ??
    "https://ai-backend.lazying.art";

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
