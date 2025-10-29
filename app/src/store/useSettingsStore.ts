import { create } from "zustand";

type SettingsState = {
  apiUrl: string;
  setApiUrl: (url: string) => void;
};

const defaultApiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

export const useSettingsStore = create<SettingsState>((set) => ({
  apiUrl: defaultApiUrl,
  setApiUrl: (url: string) => set({ apiUrl: url }),
}));
