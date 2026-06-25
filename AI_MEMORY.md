# AI Memory Bank — Enjoy Mobile

Index court : ne pas lire toute la Memory Bank par défaut. Pour une question ciblée, ouvrir directement le fichier source ou la fiche concernée.

Fiches utiles :
- `docs/ai/contexte-global-stack.md` : stack Expo/RN, tooling npm, structure.
- `docs/ai/contexte-actif.md` : journal récent et phase courante.
- `docs/ai/decisions-architecturales.md` : navigation, auth, services, hooks, store, composants partagés.
- `docs/ai/etat-projet.md` : contrat API, services, glossaire.
- `docs/ai/documentation-ui-routing.md` : navigateurs, écrans, onglets, UX listes.
- `docs/ai/roadmap.md` : suivi des tâches.

Rappels essentiels : réponses en français ; `npm` + `legacy-peer-deps` ; secrets interdits ; types dans `types/api.d.ts` (alignés web) ; **`tokenId`** jamais id SQL ; client **`services/httpClient.ts`** ; auth SecureStore + refresh single-flight. **Navigation** : Stack `Login` → `SejourPicker` → **6 onglets** ; top-tabs **`creerTopTab`**. **Données** : API Enjoy uniquement ; **`useChargementRafraichissable`** + pull-to-refresh. **Listes** : modal **`FichePersonneModal`** (Équipe, Enfants) ; accordéons **`ListeAccordion`** (Groupes, Chambres).

Mise à jour mémoire : commande **`/maj`**. Dernière MAJ : **2026-06-25** (Chambres : accordéons, filtres ; `ListeAccordion` partagé Groupes/Chambres).
