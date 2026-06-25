# Décisions architecturales

Patterns et choix techniques de l'app mobile. Garder ce fichier comme référence ; le journal daté va dans [contexte-actif.md](contexte-actif.md).

## Tooling & langage

- **Expo SDK 54 / RN 0.81 / React 19 / TypeScript** ; `tsc --noEmit` via `npm run typecheck`.
- Paquets : **npm** + `legacy-peer-deps=true` (`.npmrc`). Ne pas introduire `pnpm`/`yarn`.
- **React 19 Compiler** : éviter `useMemo` / `useCallback` manuels sauf nécessité mesurée.
- **Principes de code** (`.cursor/rules/20-simplicite-code.mdc`) : KISS/DRY/YAGNI + SRP, séparation des préoccupations (`screens/` UI, `services/` API, `helpers/` logique pure), composition, fail fast.

## Thème & styles

- **Tokens centralisés** : `config/theme.ts` (`colors`, `gradients`, `fonts`, `spacing`, `radius`, `fontSizes`).
- **Source de vérité = app web** : palette mirroir de `enjoyWebApp/src/_variables.scss`.

## Navigation (React Navigation 7)

- Racine `App.tsx` : `Provider` Redux + `GestureHandlerRootView` + `SafeAreaProvider` + `ThemeProvider` (RNEUI).
- **Stack natif** (`BottomTabNavigator.tsx`) : `Login` → `SejourPicker` → `BottomTab`, `headerShown: false`.
- **`navigationRef`** (`Navigators/navigationRef.ts`) : ref de navigation root, importée hors navigateur (`Home` déconnexion, `BottomTabNavigator` session expirée) pour éviter les cycles d'import avec les écrans.
- **Bottom tabs (6)** : `Home`, `Listes`, `Organisation`, `Menus`, `Activités`, `Sanitaire` (icônes FontAwesome5).
- **Top tabs** (`creerTopTab`) : `TopTabLists` (Animators, Children, Groups, Bedrooms), `TopTabActivities` (Activites, Sorties). Titre du `Header` suit l'onglet actif.
- **Stack Organisation** (`OrganisationNavigator`) : `GrillesList` → `GrilleDetail` (params `grilleId`, `titre`).
- **Écrans pleine page** (header propre) : `Menus`, `Sanitaire`, `Home`.
- Types centralisés : `Navigators/types.ts`.

## Authentification & client HTTP

- **Client unique** : `services/httpClient.ts` (axios, `withCredentials: true`).
- **Access token** : `expo-secure-store` via `accountStorage.ts` / `tokenStorage.ts`.
- **Refresh** : corps fallback + `X-Client-Type: mobile` ; refresh proactif ~60 s ; single-flight ; 401 → rejeu ou reset `Login`.
- **`X-Skip-Token-Refresh`** sur login/refresh.

## Services & chargement des écrans

- Un service par domaine dans `services/`, appels via client partagé, erreurs via `helpers/axiosError.ts`.
- **`useChargementRafraichissable`** (`hooks/useChargementRafraichissable.ts`) : pattern standard pour écrans API — `loading` (1er chargement), `refreshing` (pull-to-refresh), `error`, `refresh`. L'écran fournit un `executer` async.
- **`useRafraichirSejourCourant`** (`hooks/useRafraichirSejourCourant.ts`) : callback async qui recharge `sejourCourant` via `sejourService.getSejourById` et `setSejourCourant`. À inclure dans le `executer` (souvent en parallèle `Promise.all`) des écrans affichant des personnes, pour que le pull-to-refresh reflète les réglages séjour (tri listes) modifiés côté web.
- **Tri des listes de personnes** (`helpers/triListesSejour.ts`, `helpers/trierUtilisateurs.ts`) : critères lus sur `SejourDTO.triListesEnfants` / `triListesEquipe` (API `NOM` | `PRENOM`, lecture seule mobile). Tri locale `fr` ; libellé affiché avec le champ de tri en premier (`libelleEnfantDuSejour` / `libelleEquipeDuSejour`, option `nomEnMajuscules` sur cartes listes).
- **Cas particuliers** : `Animators` lit le store Redux (`sejourCourant`) ; charge en parallèle groupes, chambres et profil directeur (tél./e-mail) ; tri équipe + modal détail via **`FichePersonneModal`**. `Children` : chargement parallèle enfants/groupes/chambres/dossiers + refresh séjour ; dates séjour pour anniversaire. `Bedrooms` : chambres + groupes en parallèle ; filtres locaux (type, genre, groupe, places dispo). `Home` gère son propre refresh (CR veille + photo + liste séjours).
- Utilisateur référencé par **`tokenId`**, jamais id SQL.

## State (Redux Toolkit)

- Store : `animName`, `auth`, `sejour` (plus de slice `overlay`).
- `sejourSlice` : `sejourCourant`, `sejoursDisponibles`.

## Données / API

- **Source unique** : API Enjoy (`/api/v1`). Google Sheets retiré (`config/api.ts`, `types/sheets.ts` supprimés).
- Types DTO dans `types/api.d.ts`, alignés sur `enjoyWebApp/src/types/api.d.ts`.
- Dates API : helper `helpers/dateApi.ts` (`jourISOdepuisValeurApi`) pour chaînes ISO, timestamps et tableaux Jackson `[année, mois, jour]`.
- Config runtime : `config/env.ts` / `app.config.js` (`EXPO_PUBLIC_API_URL`).

## Composants UI réutilisables

- **`FichePersonneModal`** (`Components/FichePersonneModal.tsx`) : modal fiche personne (overlay, titre prénom/nom, sous-titre, scroll, bouton Fermer) + **`LigneInfoFiche`** (libellé/valeur, lien optionnel tél./e-mail). Consommé par `Animators` (`DetailMembre`) et `Children` (`DetailEnfant`).
- **`ListeAccordion`** (`Components/ListeAccordion.tsx`) : coque accordéon réutilisable (chevron MaterialIcons, carte bordée, slot en-tête/corps) ; styles partagés exportés (`listeAccordionStyles`). Consommé par `Groups` et `Bedrooms` — contenu métier reste dans chaque écran.

## Sécurité

- Jamais lire/exposer `.env*`, clés, keystores, `google-services.json`, dumps SQL. Cf. `.cursorignore`.
