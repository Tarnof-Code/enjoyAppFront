# AI Memory Bank — Enjoy Mobile

Index court : ne pas lire toute la Memory Bank par défaut. Pour une question ciblée, ouvrir directement le fichier source ou la fiche concernée.

Fiches utiles :
- `docs/ai/contexte-global-stack.md` : stack Expo/RN, tooling npm, structure.
- `docs/ai/contexte-actif.md` : journal récent et phase courante.
- `docs/ai/decisions-architecturales.md` : navigation, auth, services, hooks, store, composants partagés.
- `docs/ai/etat-projet.md` : contrat API, services, glossaire.
- `docs/ai/documentation-ui-routing.md` : navigateurs, écrans, onglets, UX listes.
- `docs/ai/roadmap.md` : suivi des tâches.

Rappels essentiels : réponses en français ; `npm` + `legacy-peer-deps` ; secrets interdits ; types dans `types/api.d.ts` (alignés web) ; **`tokenId`** jamais id SQL ; client **`services/httpClient.ts`** ; auth SecureStore + refresh single-flight. **Navigation** : Stack `Login` → `SejourPicker` → **6 onglets** ; top-tabs **`creerTopTab`**. **Orga / Menus / Activités** : grilles calendrier 1/3/5 j., **`useFenetreJoursPlanning`**, paysage tableau (**`ConteneurGrillePaysage`**). **Activités** : fusion sorties + CRUD modales + conflits directeur ; helpers **`activiteUtils`**, **`activitePrestataireCalendrier`**, **`construireArbreMoments`**. **Sorties (liste)** : accordéons + **`PUT …/enfants`** + **`SortieEnfantsParticipantsModal`**. **Plannings orga** : édition cellules **`PlanningCelluleModal`**, droits **par ligne**. **Listes** : **`FichePersonneModal`**, **`ListeAccordion`**, tri **`triListesSejour`**.

Mise à jour mémoire : commande **`/maj`**. Dernière MAJ : **2026-06-26** (Sorties : accordéons, enfants participants, filtres).
