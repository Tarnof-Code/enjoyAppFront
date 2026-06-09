import Constants from 'expo-constants';

export const GOOGLE_API_KEY =
  Constants.expoConfig?.extra?.googleApiKey ?? '';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets/';

export function sheetsUrl(pathAndQuery) {
  const separator = pathAndQuery.includes('?') ? '&' : '?';
  return `${SHEETS_BASE}${pathAndQuery}${separator}key=${GOOGLE_API_KEY}`;
}
