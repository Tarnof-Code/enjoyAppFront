# Navigation & UI

Cartographie des navigateurs et écrans. Types dans `Navigators/types.ts`.

## Arborescence de navigation

```
App.tsx
└─ BottomTabNavigator (Stack natif, headerShown: false)
   ├─ Login            (FirstScreens/Login)
   ├─ SejourPicker     (FirstScreens/SejourPicker)
   └─ BottomTab        (Bottom tabs)
      ├─ Home          (FirstScreens/Home)
      ├─ Listes        → TopTabLists
      ├─ Plannings     → TopTabPlannings
      ├─ Activités     → TopTabActivities
      ├─ Sanitaire     → TopTabHealth
      └─ Infos utiles  → TopTabInfos
```

- **Bootstrap** (`BottomTabNavigator`) : restaure le profil et le dernier séjour visité, puis choisit la route initiale (`Login` si non connecté, `SejourPicker` si connecté sans séjour mémorisé, `BottomTab` si séjour restauré).
- **Session expirée** : `setOnSessionExpired` réinitialise le store et fait `navigationRef.reset` vers `Login`.

## Onglets et écrans (top tabs)

| Onglet | Navigateur | Écrans (`screens/`) |
|--------|------------|---------------------|
| Listes | `TopTabLists` | `General`, `Crabs`, `Sharks`, `Octopuses`, `Animators`, `Bedrooms` (+ `FetchLists`) |
| Plannings | `TopTabPlannings` | `WakeUp`, `MealTime`, `Surveillance`, `Laundry`, `Holidays` |
| Activités | `TopTabActivities` | `DaytimeActivities`, `EveningActivities`, `Trips` |
| Sanitaire | `TopTabHealth` | `GeneralHealth`, `EatingHealth`, `MedicalTreatments`, `WhatToDoIf` |
| Infos utiles | `TopTabInfos` | `UsefulNumbers`, `Regulations`, `Weather` |

## Écrans d’entrée (`FirstScreens/`)

- **`Login`** : connexion email + mot de passe (API `POST /auth/connexion`).
- **`SejourPicker`** : sélection du séjour de l’animateur ; mémorise le dernier séjour (`helpers/dernierSejour.ts`).
- **`Home`** : accueil — bienvenue (prénom + photo), date, et **compte rendu de la réunion de la veille**.

## Composants partagés (`Components/`)

`Header`, `CheckList`, `BirthdayOverlay`, et dropdowns de filtres : `DropdownGroup`, `DropdownAllGroup`, `DropdownAnim`, `DropdownAnimDirection`, `DropdownBedroom`, `DropdownDates`, `DropdownMeal`, `DropdownNumbers`, `DropdownTreatment`.

## Notes UX

- Thème via RNEUI (`createTheme` dans `App.tsx`).
- États de chargement : `ActivityIndicator` (écran de bootstrap, fetchs).
- Source de données en cours de bascule de Google Sheets vers l’API (voir [roadmap.md](roadmap.md)).
