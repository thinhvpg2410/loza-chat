import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "@/constants/env";
import { createCorrelationId, CORRELATION_HEADER } from "@/services/telemetry/correlation";
import { trackClientError } from "@/services/telemetry/telemetry";
import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

function getAuthorizationHeader(
  headers: InternalAxiosRequestConfig["headers"],
): string | undefined {
  if (!headers) return undefined;
  const h = headers as Record<string, string | undefined>;
  return h.Authorization ?? h.authorization;
}

let refreshInFlight: Promise<string> | null = null;

function getSharedRefreshPromise(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        throw new Error("Missing refresh token");
      }
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        },
      );
      await useAuthStore.getState().applyTokenRefresh({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data.accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const headers = config.headers as Record<string, string | undefined>;
  if (!headers[CORRELATION_HEADER]) {
    headers[CORRELATION_HEADER] = createCorrelationId("http");
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isAxiosError(error)) {
      trackClientError("chat", "http_response_error", error, {
        status: error.response?.status ?? null,
        url: error.config?.url ?? "",
      });
    }
    if (!isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const original = error.config as RequestConfigWithRetry | undefined;
    if (!original) {
      return Promise.reject(error);
    }

    const url = original.url ?? "";
    if (url.includes("/auth/refresh") || url.includes("/auth/login")) {
      return Promise.reject(error);
    }

    const authHeader = getAuthorizationHeader(original.headers);
    const hadBearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ");
    if (!hadBearer || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const accessToken = await getSharedRefreshPromise();
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient.request(original);
    } catch {
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }
  },
);
