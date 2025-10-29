const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      let message = text || `Request failed (${response.status})`;
      try {
        const parsed = JSON.parse(text);
        message = parsed.error ?? message;
      } catch {
        // ignore JSON parse errors
      }
      throw new ApiError(message, response.status);
    }

    const isNoContent = response.status === 204 || response.headers.get("Content-Length") === "0";
    const data = isNoContent ? (null as T | null) : ((await response.json()) as T);

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

type AuthPayload = {
  email: string;
  password: string;
};

export type AuthSuccess = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};

export type ForgotPasswordResponse = {
  message: string;
};

export const apiClient = {
  health: () => request<{ status: string; app: string }>("/health"),
  register: (payload: AuthPayload) =>
    request<AuthSuccess>("/auth/register", { method: "POST", body: payload }),
  login: (payload: AuthPayload) =>
    request<AuthSuccess>("/auth/login", { method: "POST", body: payload }),
  forgotPassword: (email: string) =>
    request<ForgotPasswordResponse>("/auth/forgot-password", { method: "POST", body: { email } }),
};
