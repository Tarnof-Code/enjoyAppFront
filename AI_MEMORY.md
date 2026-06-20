# AI Memory Bank — Enjoy Mobile

Index court : ne pas lire toute la Memory Bank par défaut. Pour une question ciblée, ouvrir directement le fichier source ou la fiche concernée.

Fiches utiles :
- `docs/ai/contexte-global-stack.md` : stack Expo/RN, tooling npm, structure.
- `docs/ai/contexte-actif.md` : journal récent et phase courante.
- `docs/ai/decisions-architecturales.md` : navigation, auth/refresh, services, store.
- `docs/ai/etat-projet.md` : contrat API, services, glossaire.
- `docs/ai/documentation-ui-routing.md` : navigateurs, écrans, onglets.
- `docs/ai/roadmap.md` : suivi des tâches (migration Sheets → API).

Rappels essentiels : réponses en français ; paquets avec `npm` + `legacy-peer-deps` ; secrets / `.env*` / keystores interdits ; types partagés dans `types/api.d.ts` (alignés sur le web). **Référence utilisateur** : `tokenId` (jamais id SQL). **Client HTTP** : `services/httpClient.ts` (intercepteur, refresh single-flight, `X-Skip-Token-Refresh`, `X-Client-Type: mobile`). **Auth** : access token en `expo-secure-store` ; 401 → refresh puis rejeu, sinon reset vers `Login`. **Navigation** : Stack (`Login` → `SejourPicker` → `BottomTab`) + 6 onglets bas, top-tabs par zone (`Navigators/`). **Données** : migration en cours de **Google Sheets** vers l'**API Enjoy** (plan `.cursor/plans/migration-api-mobile.plan.md`).

Mise à jour mémoire : commande **`/maj`** ; détail dans `docs/ai/` ; garder ce fichier entre 10 et 20 lignes. Dernière MAJ : **2026-06-20** (menu déroulant de séjour sur l'accueil, helper `sejourPeriode`, règle de simplicité du code).
