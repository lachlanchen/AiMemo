import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";

import { apiClient, AuthSuccess } from "../api/client";

type User = {
  id: string;
  email: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = "aisecretary.auth.token";
const USER_KEY = "aisecretary.auth.user";

let secureStoreAvailable: boolean | null = null;

async function isSecureStoreAvailable(): Promise<boolean> {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn("SecureStore availability check failed", error);
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

const useWebStorage = () => typeof window !== "undefined" && Platform.OS === "web";

async function storageSet(key: string, value: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  if (useWebStorage()) {
    window.localStorage.setItem(key, value);
  }
}

async function storageGet(key: string): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  if (useWebStorage()) {
    return window.localStorage.getItem(key);
  }
  return null;
}

async function storageDelete(key: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  if (useWebStorage()) {
    window.localStorage.removeItem(key);
  }
}

async function persistSession(token: string, user: User): Promise<void> {
  await storageSet(TOKEN_KEY, token);
  await storageSet(USER_KEY, JSON.stringify(user));
}

async function clearSession(): Promise<void> {
  await storageDelete(TOKEN_KEY);
  await storageDelete(USER_KEY);
}

function assertSuccess(result: { data: AuthSuccess | null; error: Error | null }): AuthSuccess {
  if (result.data) {
    return result.data;
  }
  throw result.error ?? new Error("Unexpected authentication error");
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([storageGet(TOKEN_KEY), storageGet(USER_KEY)]);

      if (token && userJson) {
        const parsedUser = JSON.parse(userJson) as User;
        set({ token, user: parsedUser, isAuthenticated: true });
      }
    } catch (error) {
      console.warn("Failed to hydrate auth store", error);
      await clearSession();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
  login: async (email: string, password: string) => {
    const result = await apiClient.login({ email, password });
    const payload = assertSuccess(result);
    await persistSession(payload.token, payload.user);
    set({ user: payload.user, token: payload.token, isAuthenticated: true });
  },
  register: async (email: string, password: string) => {
    const result = await apiClient.register({ email, password });
    const payload = assertSuccess(result);
    await persistSession(payload.token, payload.user);
    set({ user: payload.user, token: payload.token, isAuthenticated: true });
  },
  forgotPassword: async (email: string) => {
    const response = await apiClient.forgotPassword(email);
    if (response.error) {
      throw response.error;
    }
    return response.data?.message ?? "If an account exists, a reset link will be sent.";
  },
  logout: async () => {
    await clearSession();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
