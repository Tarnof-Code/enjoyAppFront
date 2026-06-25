# Navigation & UI

Cartographie des navigateurs et écrans. Types dans `Navigators/types.ts`.

## Arborescence de navigation

```
App.tsx
└─ BottomTabNavigator (Stack natif, headerShown: false)
   ├─ Login            (FirstScreens/Login)
   ├─ SejourPicker     (FirstScreens/SejourPicker)
   └─ BottomTab        (6 onglets)
      ├─ Home          (FirstScreens/Home) — pas de Header commun
      ├─ Listes        → TopTabLists (creerTopTab)
      ├─ Organisation  → OrganisationNavigator (Stack)
      ├─ Menus         (screens/Menus/Menus) — Header propre
      ├─ Activités     → TopTabActivities (creerTopTab)
      └─ Sanitaire     (screens/Health/Sanitaire) — Header propre
```

- **Bootstrap** : restaure profil + dernier séjour → `Login` / `SejourPicker` / `BottomTab`.
- **Session expirée / déconnexion** : reset store + `navigationRef` (`Navigators/navigationRef.ts`) → `Login`.

## Onglets Listes (`TopTabLists`)

| Sous-onglet | Écran | Titre header | Source données |
|-------------|-------|--------------|----------------|
| Animators | `screens/Lists/Animators` | Équipe | Redux `sejourCourant` (+ refresh séjour) ; groupes/chambres/profil directeur en parallèle — recherche, chips rôle séjour (chip **Direction**), MultiSelect groupes ; cartes nom+rôle, modal `FichePersonneModal` (contact, groupes, chambre) |
| Children | `screens/Lists/Children` | Enfants | `GET /enfants` + groupes/chambres/dossiers en parallèle ; dates séjour (Redux) pour anniversaire — recherche, MultiSelect groupes, chips genre ; cartes nom (+ icône gâteau si anniversaire) + badge groupes ; modal `FichePersonneModal` (âge, niveau, groupes, chambre, contacts parents) |
| Groups | `screens/Lists/Groups` | Groupes | `GET /groupes` |
| Bedrooms | `screens/Lists/Bedrooms` | Chambres | `GET /chambres` |

## Onglets Activités (`TopTabActivities`)

| Sous-onglet | Écran | Titre header | Source |
|-------------|-------|--------------|--------|
| Activites | `screens/Activities/Activites` | Activités | `GET /activites` |
| Sorties | `screens/Activities/Sorties` | Sorties | `GET /activites-prestataires` |

## Organisation (`OrganisationNavigator`)

| Écran | Composant | Navigation |
|-------|-----------|------------|
| GrillesList | `screens/Organisation/Organisation` | Liste des grilles → tap → détail |
| GrilleDetail | `screens/Organisation/GrilleDetail` | Vue jour par jour, libellés résolus |

## Écrans autonomes

- **`Menus`** : menus repas groupés par jour (`SectionList`).
- **`Sanitaire`** : fiches sanitaires agrégées, filtres Tout / Traitements / Régime / Médical.
- **`Home`** : titre Enjoy, sélecteur séjour (modal), bienvenue, date, encart CR veille.

## Composants partagés

- **`Header`** : icône FontAwesome5 + titre (script) + avatar animateur (mapping prénom → photo locale, legacy).
- **`FichePersonneModal`** : modal fiche personne + `LigneInfoFiche` (Équipe, Enfants).
- **`DropdownAnim.tsx`** : orphelin (plus référencé).

## UX transverse

- **Pull-to-refresh** sur tous les écrans de données (hook `useChargementRafraichissable` ou logique dédiée).
- **Recherche + filtre liste** (modèle `Animators` / `Children`) : barre compacte (`TextInput` + normalisation casse/accents) + **MultiSelect** groupes (`react-native-element-dropdown`, cases à cocher) + chips (rôle séjour sur Équipe ; genre sur Enfants). **Carte** : nom + badge droite (rôle ou groupes) ; **modal** `FichePersonneModal` au tap. Filtres par chips aussi sur `Sanitaire` (Tout/Traitements/Régime/Médical).
- **Anniversaire pendant séjour** (`Children`) : icône gâteau avant le nom ; modale « Anniversaire : {jour date} » (`helpers/anniversaireSejour.ts`).
- Thème RNEUI + tokens `config/theme.ts`.
- États : `ActivityIndicator` au 1er chargement ; indicateur natif au refresh.

## Supprimé (migration)

Onglets **Plannings**, **Infos utiles** ; sous-onglets Sheets (General/Crabs/Sharks/Octopuses, Daytime/Evening/Trips, GeneralHealth/EatingHealth/MedicalTreatments/WhatToDoIf) ; dropdowns Sheets associés.
