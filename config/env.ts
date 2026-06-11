import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

/** Base URL API Enjoy (`/api/v1`). Surcharge : `EXPO_PUBLIC_API_URL`. */
export const API_BASE_URL: string =
  extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:8080/api/v1';

export const REFRESH_COOKIE_NAME = 'refresh-jwt-cookie';
