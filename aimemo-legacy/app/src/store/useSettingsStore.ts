import { create } from "zustand";

import { API_BASE_URL } from "../config/env";

type SettingsState = {
  apiUrl: string;
  setApiUrl: (url: string) => void;
};

const defaultApiUrl = API_BASE_URL;

export const useSettingsStore = create<SettingsState>((set) => ({
  apiUrl: defaultApiUrl,
  setApiUrl: (url: string) => set({ apiUrl: url }),
}));
