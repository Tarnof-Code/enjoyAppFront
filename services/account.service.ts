import type { AuthenticationResponse, ProfilUtilisateurDTO } from '../types/api';
import { getApiErrorMessage } from '../helpers/axiosError';
import Axios, { loginRequest, logoutRequest } from './httpClient';
import * as accountStorage from './accountStorage';
import type { Credentials } from './accountStorage';

export async function login(credentials: Credentials) {
  const response = await loginRequest(credentials.email.trim(), credentials.password);
  const data = response.data as AuthenticationResponse;
  const accessToken = data.access_token;
  if (!accessToken) {
    throw new Error('Réponse de connexion invalide');
  }
  await accountStorage.saveAccessToken(accessToken);
  if (data.refresh_token) {
    await accountStorage.saveRefreshToken(data.refresh_token);
  }
  return response;
}

export async function logout(): Promise<void> {
  await logoutRequest();
  await accountStorage.clearLocalSession();
}

export async function fetchProfil(): Promise<ProfilUtilisateurDTO> {
  const tokenInfo = await accountStorage.getTokenInfo();
  const tokenId = tokenInfo?.payload?.sub;
  if (!tokenId) {
    throw new Error('Session invalide : identifiant utilisateur manquant.');
  }
  const response = await Axios.get<ProfilUtilisateurDTO>(`/utilisateurs/profil?tokenId=${tokenId}`, {
    withCredentials: true,
  });
  return response.data;
}

export async function restoreSession(): Promise<ProfilUtilisateurDTO | null> {
  const logged = await accountStorage.isLogged();
  if (!logged) return null;
  try {
    return await fetchProfil();
  } catch {
    await accountStorage.clearLocalSession();
    return null;
  }
}

export function getApiLoginErrorMessage(error: unknown): string {
  const axiosError = error as { response?: { status?: number; data?: unknown } };
  if (axiosError.response?.status === 401) {
    return 'Email ou mot de passe incorrect';
  }
  if (axiosError.response?.data) {
    const fromBackend = getApiErrorMessage(axiosError.response.data, '');
    if (fromBackend) return fromBackend;
  }
  return 'Une erreur s’est produite lors de la connexion';
}

export const accountService = {
  login,
  logout,
  fetchProfil,
  restoreSession,
  getApiLoginErrorMessage,
  saveAccessToken: accountStorage.saveAccessToken,
  getToken: accountStorage.getToken,
  isLogged: accountStorage.isLogged,
  getTokenInfo: accountStorage.getTokenInfo,
  clearLocalSession: accountStorage.clearLocalSession,
};

export type { Credentials };
