# Décisions architecturales

Patterns et choix techniques de l’app mobile. Garder ce fichier comme référence ; le journal daté va dans [contexte-actif.md](contexte-actif.md).

## Tooling & langage

- **Expo SDK 54 / RN 0.81 / React 19 / TypeScript** ; `tsc --noEmit` via `npm run typecheck`.
- Paquets : **npm** + `legacy-peer-deps=true` (`.npmrc`). Ne pas introduire `pnpm`/`yarn`.
- **React 19 Compiler** : éviter `useMemo` / `useCallback` manuels sauf nécessité mesurée.

## Navigation (React Navigation 7)

- Racine `App.tsx` : `Provider` Redux + `GestureHandlerRootView` + `SafeAreaProvider` + `ThemeProvider` (RNEUI).
- **Stack natif** (`BottomTabNavigator.tsx`) : `Login` → `SejourPicker` → `BottomTab`, `headerShown: false`. `navigationRef` exposé pour les resets hors composant (ex. session expirée).
- **Bottom tabs** : `Home`, `Listes`, `Plannings`, `Activités`, `Sanitaire`, `Infos utiles` (icônes FontAwesome5).
- **Top tabs** par zone (`TopTabLists`, `TopTabPlannings`, `TopTabActivities`, `TopTabHealth`, `TopTabInfos`).
- **Types de navigation** centralisés dans `Navigators/types.ts` (`RootStackParamList`, `BottomTabParamList`, etc.) + augmentation `ReactNavigation.RootParamList`.

## Authentification & client HTTP

- **Client unique** : `services/httpClient.ts` (`axios.create({ baseURL: API_BASE_URL, withCredentials: true })`).
- **Access token** : stocké via `expo-secure-store` (jamais en clair ni `AsyncStorage`). Lecture/écriture encapsulées dans `accountStorage.ts` / `tokenStorage.ts`.
- **Refresh token** : sur natif, le cookie HttpOnly n’étant pas exploitable, le backend lit le refresh token envoyé dans le corps en fallback (header `X-Client-Type: mobile`).
- **Intercepteur requête** : refresh **proactif** si le JWT expire dans moins de `REFRESH_MARGIN_MS` (60 s), puis ajout du header `Authorization: Bearer`.
- **Intercepteur réponse** : `401` (hors `X-Skip-Token-Refresh`) → `refreshAccessTokenSingleFlight()` puis rejeu de la requête (`_retry`) ; échec → `triggerSessionExpired()` (purge session + callback de reset vers `Login`).
- **Single-flight** : une seule requête `/auth/refresh-token` simultanée via `refreshPromise`.
- **`X-Skip-Token-Refresh`** : header posé sur `login` / `refresh` pour éviter les boucles.
- **Référence web à porter** : `caller.service.ts` + `account.service.ts` du web.

## Services

- Pattern : un service par domaine exposant un objet (`accountService`, `sejourService`, …), appels via le client `Axios` partagé, erreurs formatées par `helpers/axiosError.ts` (`getApiErrorMessage`).
- Utilisateur référencé par **`tokenId`** (extrait du JWT `sub`), jamais l’id SQL.

## State (Redux Toolkit)

- Store (`store/index.ts`) : `overlay`, `animName`, `auth`, `sejour`.
- `authSlice` : profil courant + `bootstrapDone`. `sejourSlice` : séjour sélectionné. `animNameSlice` : prénom animateur (affichage). `overlaySlice` : overlays UI (ex. anniversaire).
- Hooks typés dans `store/hooks.ts` ; `RootState` / `AppDispatch` exportés depuis `store/index.ts`.

## Données / API vs Sheets

- Cible : **API Enjoy** (`/api/v1`), types dans `types/api.d.ts` alignés sur `enjoyWebApp/src/types/api.d.ts`.
- Legacy en retrait : **Google Sheets** (`config/api.ts`, `types/sheets.ts`) — conservé temporairement pour `UsefulNumbers`.
- Config runtime : `config/env.ts` (`API_BASE_URL`, surcharge `EXPO_PUBLIC_API_URL`, valeurs `app.config.js` → `expoConfig.extra`).

## Sécurité

- Jamais lire/exposer `.env*`, clés, keystores (`*.jks`, `*.keystore`, `*.p8`, `*.p12`), `google-services.json`, `GoogleService-Info.plist`, dumps SQL. Cf. `.cursorignore`.
