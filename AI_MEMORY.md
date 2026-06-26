# AI Memory Bank — Enjoy Mobile

Index court : ne pas lire toute la Memory Bank par défaut. Pour une question ciblée, ouvrir directement le fichier source ou la fiche concernée.

Fiches utiles :
- `docs/ai/contexte-global-stack.md` : stack Expo/RN, tooling npm, structure.
- `docs/ai/contexte-actif.md` : journal récent et phase courante.
- `docs/ai/decisions-architecturales.md` : navigation, auth, services, hooks, store, composants partagés.
- `docs/ai/etat-projet.md` : contrat API, services, glossaire.
- `docs/ai/documentation-ui-routing.md` : navigateurs, écrans, onglets, UX listes.
- `docs/ai/roadmap.md` : suivi des tâches.

Rappels essentiels : réponses en français ; `npm` + `legacy-peer-deps` ; secrets interdits ; types dans `types/api.d.ts` (alignés web) ; **`tokenId`** jamais id SQL ; client **`services/httpClient.ts`** ; auth SecureStore + refresh single-flight. **Navigation** : Stack `Login` → `SejourPicker` → **6 onglets** + **`Profil`** ; top-tabs **`creerTopTab`** (Listes, Activités, **Sanitaire**). **Profil** : édition infos/mot de passe/photo ; **`auth.photoProfilUri`** + **`rafraichirPhotoProfil`** (Header, Home, pull-to-refresh). **Sanitaire** : **`TopTabSanitaire`** — **Cahier d'infirmerie** (CRUD, accordéons **`ListeAccordion`**, filtre jour, auteur affiché) + **Dossiers sanitaires** (lecture, **MultiSelect** groupes + **`Dropdown`** filtres contenu/moment). **Dates API** : **`parseDateDepuisValeurApi`** / **`dayjsDepuisValeurApi`** (epoch s ou ms). **Orga / Menus / Activités** : grilles calendrier 1/3/5 j., **`useFenetreJoursPlanning`**, paysage tableau ; **Sorties** : accordéons + **`PUT …/enfants`**. **Listes** : **`FichePersonneModal`**, **`ListeAccordion`**, tri **`triListesSejour`**.

Mise à jour mémoire : commande **`/maj`**. Dernière MAJ : **2026-06-27** (datetimepicker SDK 54, Mon profil).

Rappels récents (détail dans `docs/ai/`) : **`datetimepicker` 8.4.4** (`expo install`, SDK 54) ; **`Profil`** (Stack) — édition alignée web, **`ChangePasswordModal`**, modales photo **`PhotoProfilRecadrageModal`** / **`PhotoProfilZoomModal`** ; avatar API **`Header`** / **`Home`** ; onglets actifs / header en **`colors.primary`** ; **Activités** → sous-onglet **Planning** (icône seule `calendar-blank`).
