import { create } from "zustand";

type User = {
  email: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string) => {
    // TODO: replace with real authentication call once backend endpoints exist.
    set({
      user: { email },
      isAuthenticated: true,
    });
  },
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
