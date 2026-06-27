# Contexte global — stack & structure

## Application

Application **mobile** Enjoy (Expo / React Native) destinée aux **animateurs** sur le terrain : consultation des séjours, listes d’enfants, plannings, activités, infos sanitaires et infos utiles.

**Stack :** Expo SDK **54**, React Native **0.81**, React **19**, TypeScript, Redux Toolkit, React Navigation 7, RNEUI (`@rneui/themed`), `axios`, `dayjs`, `@react-native-community/datetimepicker` **8.4.4**, **`expo-blur`** **~15.0.8** (panneaux givre **`GlassPanel`**).

**Gestion des paquets :** **npm** avec `legacy-peer-deps=true` (`.npmrc`) — ne pas utiliser `pnpm`/`yarn`.

**Backend :** API REST Java Spring (dépôt **enjoyApi**), base `/api/v1`, JWT Bearer. Référence web associée : **enjoyWebApp**. Pour l’architecture backend / DTOs, voir [`../../../enjoyApi/AI_MEMORY.md`](../../../enjoyApi/AI_MEMORY.md) et le front web [`../../../enjoyWebApp/AI_MEMORY.md`](../../../enjoyWebApp/AI_MEMORY.md).

## Structure des dossiers (rappel)

- `App.tsx` : racine (Redux `Provider`, `GestureHandlerRootView`, `SafeAreaProvider`, `ThemeProvider` RNEUI) montant `BottomTabNavigator`.
- **`Navigators/`** : `BottomTabNavigator.tsx` (Stack `Login` → `BottomTab` + bootstrap session ; onglets conditionnels), `navigationRef.ts`, `TopTab*`, `types.ts`.
- **`screens/`** : `FirstScreens/` (`Login`, `Home`), `Lists/`, `Plannings/`, `Activities/`, `Health/`, `Infos/`.
- **`services/`** : `httpClient.ts` (axios + intercepteurs auth), `account.service.ts`, `accountStorage.ts`, `tokenStorage.ts`, `sejour.service.ts`, `sejour-reunion.service.ts`, `utilisateur.service.ts`.
- **`store/`** : Redux Toolkit — `authSlice`, `sejourSlice`, `animNameSlice`, `overlaySlice`, `hooks.ts`, `index.ts`.
- **`config/`** : `env.ts` (`API_BASE_URL`, `EXPO_PUBLIC_API_URL`), `api.ts` (Google Sheets — en cours de retrait).
- **`helpers/`** : `axiosError.ts`, `dernierSejour.ts`, `photoProfil.ts`, `reunionVeille.ts`, `reunionTipTapTexte.ts`.
- **`types/`** : `api.d.ts` (DTOs alignés sur le web), `sheets.ts` (modèle tableur legacy).
- **`Components/`** : composants partagés (`Header`, dropdowns, `CheckList`, `BirthdayOverlay`…).

Les règles obligatoires courtes (langue, lint, périmètre, commits) restent dans [`.cursor/rules/`](../../.cursor/rules/).

## Glossaire métier (très court)

- **Animateur (`BASIC_USER`)** : cas principal mobile, lecture des données du séjour dont il est membre d’équipe (privilège `ACCES_SEJOUR`).
- **Direction (`DIRECTION`)** : accès élargi — hors scope v1 mobile.
- **Séjour** : entité centrale (équipe, enfants, groupes, chambres, activités, plannings) ; toutes les données métier sont scoped `sejourId`.
- **`tokenId`** : identifiant public d’un utilisateur dans l’API (jamais l’id SQL).

Le détail des termes est dans [etat-projet.md](etat-projet.md) (section glossaire).
