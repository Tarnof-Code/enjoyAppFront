# AI Memory Bank — Enjoy Mobile

Index court : ne pas lire toute la Memory Bank par défaut. Pour une question ciblée, ouvrir directement le fichier source ou la fiche concernée.

Fiches utiles :
- `docs/ai/contexte-global-stack.md` : stack Expo/RN, tooling npm, structure.
- `docs/ai/contexte-actif.md` : journal récent et phase courante.
- `docs/ai/decisions-architecturales.md` : navigation, auth, services, hooks, store, composants partagés.
- `docs/ai/etat-projet.md` : contrat API, services, glossaire.
- `docs/ai/documentation-ui-routing.md` : navigateurs, écrans, onglets, UX listes.
- `docs/ai/roadmap.md` : suivi des tâches.

Rappels essentiels : réponses en français ; `npm` + `legacy-peer-deps` ; secrets interdits ; types dans `types/api.d.ts` (alignés web) ; **`tokenId`** jamais id SQL ; client **`services/httpClient.ts`** ; auth SecureStore + refresh single-flight. **Navigation** : Stack `Login` → `SejourPicker` → **6 onglets** ; top-tabs **`creerTopTab`** (Listes, Activités, **Sanitaire**). **Sanitaire** : **`TopTabSanitaire`** — **Cahier d'infirmerie** (CRUD, accordéons **`ListeAccordion`**, filtre jour, auteur affiché) + **Dossiers sanitaires** (lecture, **MultiSelect** groupes + **`Dropdown`** filtres contenu/moment). **Dates API** : **`parseDateDepuisValeurApi`** / **`dayjsDepuisValeurApi`** (epoch s ou ms). **Orga / Menus / Activités** : grilles calendrier 1/3/5 j., **`useFenetreJoursPlanning`**, paysage tableau ; **Sorties** : accordéons + **`PUT …/enfants`**. **Listes** : **`FichePersonneModal`**, **`ListeAccordion`**, tri **`triListesSejour`**.

Mise à jour mémoire : commande **`/maj`**. Dernière MAJ : **2026-06-26** (chromie navigation + UX grilles planning activités).

Rappels récents (détail dans `docs/ai/`) : onglets actifs / header en **`colors.primary`** ; **Activités** → sous-onglet **Planning** (icône seule `calendar-blank`, header « Planning ») ; grilles **`BoutonModePaysageGrille`** à droite, toolbar alignée 36 px ; **`EnteteJoursGrille`** prop **`compact`** sur **`Activites`** ; colonne animateurs **76 px** ; cartes activité : **`couleurFondCalendrierPourTypeActivite`** (`activiteUtils.ts`).
