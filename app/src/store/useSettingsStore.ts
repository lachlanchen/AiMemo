import { create } from "zustand";

type SettingsState = {
  apiUrl: string;
  setApiUrl: (url: string) => void;
};

const defaultApiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://ai-backend.lazying.art";

export const useSettingsStore = create<SettingsState>((set) => ({
  apiUrl: defaultApiUrl,
  setApiUrl: (url: string) => set({ apiUrl: url }),
}));
