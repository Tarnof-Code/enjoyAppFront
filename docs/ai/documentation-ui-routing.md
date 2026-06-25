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
      ├─ Orga            → OrganisationNavigator (Stack) — libellé onglet « Orga »
      ├─ Menus         (screens/Menus/Menus) — Header propre
      ├─ Activités     → TopTabActivities (creerTopTab)
      └─ Sanitaire     (screens/Health/Sanitaire) — Header propre
```

- **Bootstrap** : restaure profil + dernier séjour → `Login` / `SejourPicker` / `BottomTab`.
- **Session expirée / déconnexion** : reset store + `navigationRef` (`Navigators/navigationRef.ts`) → `Login`.

## Onglets Listes (`TopTabLists`)

| Sous-onglet | Écran | Titre header | Source données |
|-------------|-------|--------------|----------------|
| Animators | `screens/Lists/Animators` | Équipe | Redux `sejourCourant` (+ `useRafraichirSejourCourant`) ; groupes/chambres/profil directeur en parallèle — tri/libellé équipe selon `triListesEquipe` ; recherche, chips rôle séjour (chip **Direction**), MultiSelect groupes ; cartes nom+rôle, modal `FichePersonneModal` (contact, groupes, chambre) |
| Children | `screens/Lists/Children` | Enfants | `GET /enfants` + groupes/chambres/dossiers + refresh séjour en parallèle ; tri/libellé selon `triListesEnfants` ; dates séjour pour anniversaire — recherche, MultiSelect groupes, chips genre ; cartes nom (+ icône gâteau si anniversaire) + badge groupes ; modal `FichePersonneModal` (âge, niveau, groupes, chambre, contacts parents) |
| Groups | `screens/Lists/Groups` | Groupes | `GET /groupes` + refresh séjour — accordéons par groupe ; enfants triés/libellés selon `triListesEnfants` ; chips filtre **type** ; groupes thématiques : à droite du nom, groupes par âge/niveau de l'enfant |
| Bedrooms | `screens/Lists/Bedrooms` | Chambres | `GET /chambres` + groupes + enfants + refresh séjour — accordéons (`ListeAccordion`) ; **FAB +** création ; déplié → **Affecter** (`AffecterOccupantsModal`, ~92 % écran), **Modifier** (`ChambreFormulaireModal`), **Supprimer**, retrait occupant ; occupants triés/libellés ; filtres Type / Genre / Groupe + chip **Places dispo** |

## Onglets Activités (`TopTabActivities`)

| Sous-onglet | Écran | Titre header | Source |
|-------------|-------|--------------|--------|
| Activites | `screens/Activities/Activites` | Activités | `GET /activites` + refresh séjour ; libellés animateurs selon `triListesEquipe` |
| Sorties | `screens/Activities/Sorties` | Sorties | `GET /activites-prestataires` |

## Orga (`OrganisationNavigator`)

Onglet bottom tab : route **`Orga`**, libellé **Orga**. Titre header liste : « Organisation ».

| Écran | Composant | Navigation |
|-------|-----------|------------|
| GrillesList | `screens/Organisation/Organisation` | Liste plannings tri alpha ; recherche titre (normalisation casse/accents, bouton ✕) ; tap → détail |
| GrilleDetail | `screens/Organisation/GrilleDetail` | Matrice multi-jours (1/3/5) : colonnes jours, lignes libellés, sections regroupement ; toolbar **‹ Retour** + chips 1j/3j/5j ; swipe + flèches + **Aujourd'hui** ; tap cellule → `PlanningCelluleModal` si droits ; refresh séjour au pull-to-refresh |

## Écrans autonomes

- **`Menus`** : grille calendrier repas × jours (`screens/Menus/Menus.tsx`) — fenêtre 1/3/5 j., swipe + flèches (bonds = taille vue), **Aujourd'hui**, bouton **paysage tableau** ; ouverture centrée sur aujourd'hui (si dans le séjour) ou 1er jour ; pull-to-refresh ; lecture seule.
- **`Sanitaire`** : fiches sanitaires agrégées, tri/libellé enfants selon `triListesEnfants`, refresh séjour au pull-to-refresh ; filtres Tout / Traitements / Régime / Médical.
- **`Home`** : titre Enjoy, sélecteur séjour (modal), bienvenue, date, encart CR veille.

## Composants partagés

- **`Header`** : icône FontAwesome5 + titre (script) + avatar animateur (mapping prénom → photo locale, legacy).
- **`FichePersonneModal`** : modal fiche personne + `LigneInfoFiche` (Équipe, Enfants).
- **`ListeAccordion`** : coque accordéon liste (chevron, carte, en-tête/corps) + styles `listeAccordionStyles` ; contenu métier dans l'écran (`Groups`, `Bedrooms`).
- **`ChambreFormulaireModal`** : création/édition chambre (bottom sheet, scroll gesture-handler).
- **`AffecterOccupantsModal`** : sélection multi occupants (enfants ou équipe) pour une chambre.
- **`PlanningCelluleModal`** : édition cellule planning (bottom sheet) ; directeur/adjoint = contenu complet ; animateur = ma présence sur grille équipe.
- **`BoutonModePaysageGrille`** / **`ConteneurGrillePaysage`** : paysage visuel du tableau sur **`Menus`** et **`GrilleDetail`** (rotation 90°, appareil en portrait).
- **`DropdownAnim.tsx`** : orphelin (plus référencé).

## UX transverse

- **Pull-to-refresh** sur tous les écrans de données (hook `useChargementRafraichissable` ou logique dédiée). Écrans avec personnes : inclure **`useRafraichirSejourCourant`** dans le `executer` pour synchroniser le tri listes (`triListesEnfants` / `triListesEquipe`).
- **Tri et libellés personnes** (`helpers/triListesSejour.ts`) : ordre et affichage « Nom Prénom » ou « Prénom Nom » selon réglage séjour (lecture seule, aligné web).
- **Recherche + filtre liste** (modèle `Animators` / `Children`) : barre compacte (`TextInput` + normalisation casse/accents) + **MultiSelect** groupes (`react-native-element-dropdown`, cases à cocher) + chips (rôle séjour sur Équipe ; genre sur Enfants). **Carte** : nom + badge droite (rôle ou groupes) ; **modal** `FichePersonneModal` au tap. Filtres par chips sur **`Groups`** (type de groupe), **`Bedrooms`** (chip Places dispo) et `Sanitaire` (Tout/Traitements/Régime/Médical). **`Bedrooms`** : menus déroulants Type / Genre / Groupe sur une ligne (`Dropdown` single-select). **Orga** (liste plannings, écran `Organisation.tsx`) : recherche titre seule + bouton ✕ pour vider (cross-platform).
- **Planning matrice** (`GrilleDetail`, **`Menus`**) : colonne libellés fixe (108 px) ; colonnes jours en `flex: 1` ; en-tête jour = nom + date ; fenêtre 1/3/5 j. via **`useFenetreJoursPlanning`** (flèches/swipe par bonds = taille vue) ; chips 1j/3j/5j compacts + **`BoutonModePaysageGrille`** (rotation 90° du scroll grille via **`ConteneurGrillePaysage`**, header/toolbar en portrait) ; **`GrilleDetail`** : **‹ Retour** sous le header ; **`Menus`** : écran racine onglet.
- **Accordéons listes** (`Groups`, `Bedrooms` via **`ListeAccordion`**) : plusieurs items ouverts possibles (`Set` d'ids). **`Bedrooms`** : actions CRUD et affectation occupants dans modales dédiées (confirmations `Alert` pour suppression/retrait).
- **Bottom sheets formulaire** : éviter `react-native-element-dropdown` dans un `ScrollView` (conflits gestes) ; préférer pills / liste dépliable + `ScrollView` de `react-native-gesture-handler`.
- **Anniversaire pendant séjour** (`Children`) : icône gâteau avant le nom ; modale « Anniversaire : {jour date} » (`helpers/anniversaireSejour.ts`).
- Thème RNEUI + tokens `config/theme.ts`.
- États : `ActivityIndicator` au 1er chargement ; indicateur natif au refresh.

## Supprimé (migration)

Onglets **Plannings**, **Infos utiles** ; sous-onglets Sheets (General/Crabs/Sharks/Octopuses, Daytime/Evening/Trips, GeneralHealth/EatingHealth/MedicalTreatments/WhatToDoIf) ; dropdowns Sheets associés.
