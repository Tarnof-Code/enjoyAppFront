import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import { API_BASE_URL } from '../config/env';
import * as accountStorage from './accountStorage';
import { clearLocalSession } from './accountStorage';

const SKIP_HEADER = 'X-Skip-Token-Refresh';
const REFRESH_MARGIN_MS = 60_000;

let refreshPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback;
}

function hasSkipTokenRefreshHeader(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config?.headers) return false;
  const headers = config.headers;
  if (typeof headers.get === 'function') {
    const value = headers.get(SKIP_HEADER);
    return value === true || value === 'true';
  }
  return (headers as Record<string, unknown>)[SKIP_HEADER] === true;
}

async function refreshAccessTokenSingleFlight(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      await clearLocalSession();
      const response = await Axios.post<{ access_token: string }>(
        '/auth/refresh-token',
        undefined,
        {
          withCredentials: true,
          headers: { [SKIP_HEADER]: true },
        },
      );
      const accessToken = response.data.access_token;
      if (!accessToken) {
        throw new Error('Jeton d’accès absent dans la réponse refresh');
      }
      await accountStorage.saveAccessToken(accessToken);
      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function ensureFreshAccessToken(): Promise<void> {
  const token = await accountStorage.getToken();
  if (!token) return;
  const expiryMs = accountStorage.getTokenExpiryMs(token);
  if (expiryMs === null) return;
  if (Date.now() < expiryMs - REFRESH_MARGIN_MS) return;
  await refreshAccessTokenSingleFlight();
}

function triggerSessionExpired(): void {
  void clearLocalSession();
  onSessionExpired?.();
}

const Axios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

Axios.interceptors.request.use(async (request) => {
  if (!hasSkipTokenRefreshHeader(request)) {
    try {
      await ensureFreshAccessToken();
    } catch {
      /* refresh proactif échoué : laisser la requête partir, 401 gérera */
    }
  }

  const token = await accountStorage.getToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

Axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const skipRefresh = hasSkipTokenRefreshHeader(originalRequest);

    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (!skipRefresh) {
        originalRequest._retry = true;
        try {
          const accessToken = await refreshAccessTokenSingleFlight();
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return Axios(originalRequest);
        } catch (refreshError) {
          console.error('Erreur lors du rafraîchissement du jeton :', refreshError);
        }
      }
      triggerSessionExpired();
    }

    return Promise.reject(error);
  },
);

export default Axios;

export async function loginRequest(email: string, motDePasse: string) {
  return Axios.post(
    '/auth/connexion',
    { email, motDePasse },
    {
      withCredentials: true,
      headers: { [SKIP_HEADER]: true },
    },
  );
}

export async function logoutRequest(): Promise<void> {
  try {
    await Axios.post('/auth/logout', undefined, { withCredentials: true });
  } catch {
    /* ignorer erreur réseau au logout */
  }
}
