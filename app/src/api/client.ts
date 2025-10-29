const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Request failed (${response.status}): ${message}`);
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

export const apiClient = {
  health: () => request<{ status: string; app: string }>("/health"),
};
