# AI Memory Bank — Enjoy Mobile

Index court : ne pas lire toute la Memory Bank par défaut. Pour une question ciblée, ouvrir directement le fichier source ou la fiche concernée.

Fiches utiles :
- `docs/ai/contexte-global-stack.md` : stack Expo/RN, tooling npm, structure.
- `docs/ai/contexte-actif.md` : journal récent et phase courante.
- `docs/ai/decisions-architecturales.md` : navigation, auth, services, hooks, store.
- `docs/ai/etat-projet.md` : contrat API, services, glossaire.
- `docs/ai/documentation-ui-routing.md` : navigateurs, écrans, onglets.
- `docs/ai/roadmap.md` : suivi des tâches.

Rappels essentiels : réponses en français ; `npm` + `legacy-peer-deps` ; secrets interdits ; types dans `types/api.d.ts` (alignés web) ; **`tokenId`** jamais id SQL ; client **`services/httpClient.ts`** ; auth SecureStore + refresh single-flight. **Navigation** : Stack `Login` → `SejourPicker` → **6 onglets** (`Home`, `Listes`, `Organisation`, `Menus`, `Activités`, `Sanitaire`) ; top-tabs via **`creerTopTab`** ; stack Organisation (grilles + détail). **Données** : **API Enjoy uniquement** (Google Sheets retiré) ; chargement écrans via **`useChargementRafraichissable`** + pull-to-refresh. App web = source de vérité (règle `30-app-web.mdc`).

Mise à jour mémoire : commande **`/maj`**. Dernière MAJ : **2026-06-21** (migration API terminée, pull-to-refresh, navigation refactorisée).
