# AI Memory Bank — Enjoy Mobile

Index court : ne pas lire toute la Memory Bank par défaut. Pour une question ciblée, ouvrir directement le fichier source ou la fiche concernée.

Fiches utiles :
- `docs/ai/contexte-global-stack.md` : stack Expo/RN, tooling npm, structure.
- `docs/ai/contexte-actif.md` : journal récent et phase courante.
- `docs/ai/decisions-architecturales.md` : navigation, auth, services, hooks, store, composants partagés.
- `docs/ai/etat-projet.md` : contrat API, services, glossaire.
- `docs/ai/documentation-ui-routing.md` : navigateurs, écrans, onglets, UX listes.
- `docs/ai/roadmap.md` : suivi des tâches.

Rappels essentiels : réponses en français ; `npm` + `legacy-peer-deps` ; secrets interdits ; types dans `types/api.d.ts` ; **`tokenId`** jamais id SQL ; **`httpClient.ts`** ; auth SecureStore + refresh single-flight. **Navigation** : Stack `Login` → **`BottomTab`** (+ **`Profil`**) ; onglets conditionnels (seul **Home** sans séjour) ; sélection séjour sur **`Home`**. **Listes / orga / sanitaire** : fond **`EcranListeFond`** + **`ListeEcranLayout`** ; top-tabs compactes (**50 px**) ; **Header** compact (avatar **44 px**). **Dossier sanitaire** : tap carte → **`DossierEnfantModal`** (consultation + édition par section si directeur/adjoint/AS). **Profil** — voir fiches `docs/ai/`.

Mise à jour mémoire : commande **`/maj`**. Dernière MAJ : **2026-06-28** (dossiers sanitaires : recherche enfant au lieu du filtre groupes).
