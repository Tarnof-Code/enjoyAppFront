# Contexte actif — phase courante & journal

> Journal factuel et daté. Garder les entrées courtes ; le détail technique va dans [decisions-architecturales.md](decisions-architecturales.md) et [etat-projet.md](etat-projet.md).

## Phase courante

Migration de l’application mobile des données **Google Sheets** vers l’**API Enjoy** (`enjoyApi`), en s’alignant sur l’architecture du front web (`enjoyWebApp`). Voir le plan détaillé : [`.cursor/plans/migration-api-mobile.plan.md`](../../.cursor/plans/migration-api-mobile.plan.md).

Réalisé à ce jour :
- Migration du JavaScript vers **TypeScript** (navigateurs, écrans, services).
- Couche **auth API** : `httpClient.ts` (intercepteurs, refresh single-flight, refresh proactif ~60 s avant `exp`), `account.service.ts`, stockage access token via `expo-secure-store`.
- **Bootstrap session** dans `BottomTabNavigator` : restauration profil + dernier séjour visité → route initiale (`Login` / `SejourPicker` / `BottomTab`).
- Types `types/api.d.ts` alignés sur le contrat de l’API.

En cours / à venir : migration progressive des écrans Listes, Plannings, Activités, Sanitaire depuis Sheets vers l’API (cf. roadmap).

## Journal

### 2026-06-20
- Mise en place de la **Memory Bank** mobile (calquée sur `enjoyWebApp`) : `AI_MEMORY.md`, fiches `docs/ai/`, règles `.cursor/rules/00-global.mdc` et `10-memory-bank.mdc`, commande `/maj`, `.cursorignore`, `.cursorindexignore`, `.vscode/settings.json`.
- **Accueil** : séjour courant + dates affichés à côté du titre, avec **menu déroulant** (modal) pour changer de séjour quand plusieurs sont disponibles (`Home` charge `sejoursDisponibles` via `sejourService`, mémorise le choix via `helpers/dernierSejour.ts`).
- Helper **`helpers/sejourPeriode.ts`** (DRY) : formatage des périodes (`formatPeriodeSejourCourte`, `formatPeriodeSejour`), factorisé depuis `Home` et `SejourPicker`.
- Nouvelle règle **`.cursor/rules/20-simplicite-code.mdc`** : principes KISS/DRY/YAGNI + SRP, séparation des préoccupations, composition, fail fast — pas de sur-ingénierie.
