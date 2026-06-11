import { jwtDecode } from 'jwt-decode';

import * as tokenStorage from './tokenStorage';

export interface EnjoyJwtPayload {
  sub?: string;
  exp?: number;
  role?: string;
  [key: string]: unknown;
}

export interface Credentials {
  email: string;
  password: string;
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  await tokenStorage.saveAccessToken(accessToken);
}

export async function getToken(): Promise<string | null> {
  return tokenStorage.getAccessToken();
}

export async function isLogged(): Promise<boolean> {
  return tokenStorage.hasAccessToken();
}

export async function getTokenInfo(): Promise<{ payload: EnjoyJwtPayload } | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const payload = jwtDecode<EnjoyJwtPayload>(token);
    return { payload };
  } catch {
    return null;
  }
}

export function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = jwtDecode<EnjoyJwtPayload>(token);
    if (typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export async function clearLocalSession(): Promise<void> {
  await tokenStorage.clearAccessToken();
}
