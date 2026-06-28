# Navigation & UI

Cartographie des navigateurs et écrans. Types dans `Navigators/types.ts`.

## Arborescence de navigation

```
App.tsx
└─ BottomTabNavigator (Stack natif, headerShown: false)
   ├─ Login            (FirstScreens/Login) — dégradé + orbes, formulaire blanc
   ├─ Profil           (screens/Profil/Profil) — plein écran, retour goBack
   └─ BottomTab        (onglets conditionnels selon sejourCourant)
      ├─ Home          (FirstScreens/Home) — toujours visible
      ├─ Listes        → TopTabLists (creerTopTab)     — si séjour choisi
      ├─ Orga            → OrganisationNavigator (Stack)
      ├─ Menus         (screens/Menus/Menus)
      ├─ Activités     → TopTabActivities (creerTopTab)
      └─ Sanitaire     → TopTabSanitaire (creerTopTab)
         ├─ CahierInfirmerie  (screens/Health/CahierInfirmerie)
         └─ DossierSanitaire  (screens/Health/DossierSanitaire)
```

- **Bootstrap** : session valide → **`BottomTab`** ; restauration profil + **optionnel** dernier séjour mémorisé ; sinon **`Login`**.
- **Connexion** : `clearSejour` → **`BottomTab` / Home** sans séjour (onglet Home seul, pas de carte réunion).
- **Session expirée / déconnexion** : reset store + `navigationRef` (`Navigators/navigationRef.ts`) → `Login`.

## Onglets Listes (`TopTabLists`)

| Sous-onglet | Écran | Titre header | Source données |
|-------------|-------|--------------|----------------|
| Animators | `screens/Lists/Animators` | Équipe | **`ListeEcranLayout`** (fond **`background`**, filtres fixes) ; Redux `sejourCourant` ; groupes/chambres/profil directeur ; recherche, chips rôle, MultiSelect groupes ; cartes avatar + ombre ; modal `FichePersonneModal` |
| Children | `screens/Lists/Children` | Enfants | **`ListeEcranLayout`** ; `GET /enfants` + groupes/chambres/dossiers ; recherche, MultiSelect groupes, chips genre ; cartes + modal `FichePersonneModal` |
| Groups | `screens/Lists/Groups` | Groupes | **`ListeEcranLayout`** ; accordéons **`ListeAccordion`** ; chips filtre type |
| Bedrooms | `screens/Lists/Bedrooms` | Chambres | **`EcranListeFond`** + **`ListeAvecFiltresFixes`** (FAB) ; accordéons ; modales chambre/affectation (feuille **`background`**) ; filtres Type/Genre/Groupe + chip Places dispo |

## Onglets Activités (`TopTabActivities`)

| Sous-onglet | Écran | Titre header | Source |
|-------------|-------|--------------|--------|
| Activites | `screens/Activities/Activites` | **Planning** | Grille calendrier animateur×jours (colonne animateurs **76 px**, en-tête dates **`EnteteJoursGrille` `compact`**, 1/3/5 j., paysage, filtres animateurs/groupes) ; `GET /activites` + `GET /activites-prestataires` + moments/lieux/types/groupes ; CRUD modales ; fusion sorties ; conflits directeur ; libellés **`libelleMembreDansCelluleEquipe`** ; jour initial = aujourd'hui (si séjour) ou 1er jour |
| Sorties | `screens/Activities/Sorties` | Sorties | `GET /activites-prestataires` + groupes/activites/moments (modale) ; accordéons **`ListeAccordion`** (nom, date, moment → détail) ; filtres date/groupes (existants uniquement) ; **`PUT …/enfants`** via **`SortieEnfantsParticipantsModal`** |

Barre top-tabs **compacte** (`creerTopTab` **`barreOngletsCompacte: true`**) : hauteur **50 px**, libellés **10 px**, icônes **20 px** — Listes (Équipe/Enfants/Groupes/Chambres), Activités (Planning/Sorties), Sanitaire (Cahier/Dossiers).

## Orga (`OrganisationNavigator`)

Onglet bottom tab : route **`Orga`**, libellé **Orga**. Titre header liste : « Organisation ».

| Écran | Composant | Navigation |
|-------|-----------|------------|
| GrillesList | `screens/Organisation/Organisation` | **`ListeEcranLayout`** — liste plannings tri alpha ; bandeau recherche blanc fixe (bordure basse, ombre) + champ fond gris ; bouton ✕ ; tap → détail |
| GrilleDetail | `screens/Organisation/GrilleDetail` | **`EcranListeFond`** ; section haute blanche (consigne + toolbar) ; matrice 1/3/5 j. ; en-tête dates fixe ; `PlanningCelluleModal` |

## Onglets Sanitaire (`TopTabSanitaire`)

| Sous-onglet | Écran | Titre header | Source |
|-------------|-------|--------------|--------|
| CahierInfirmerie | `screens/Health/CahierInfirmerie` | Cahier d'infirmerie | **`ListeEcranLayout`** ; accordéons ; recherche + filtre jour ; **`CahierInfirmerieFormModal`** (feuille **`background`**) |
| DossierSanitaire | `screens/Health/DossierSanitaire` | Dossiers sanitaires | **`ListeEcranLayout`** ; recherche enfant + Dropdown filtre contenu ; cartes pressables → **`DossierEnfantModal`** (consultation seule) |

## Écrans autonomes

- **`Menus`** : grille calendrier repas × jours (`screens/Menus/Menus.tsx`) — fenêtre 1/3/5 j., swipe + flèches (bonds = taille vue), **Aujourd'hui**, bouton **paysage tableau** ; ouverture centrée sur aujourd'hui (si dans le séjour) ou 1er jour ; pull-to-refresh ; lecture seule.
- **`Home`** : fond dégradé + orbes ; titre Enjoy ; **sélecteur séjour** — sans séjour : « Veuillez choisir votre séjour » + modal liste ; avec séjour : nom + période (modal si plusieurs) ; avatar **`AvatarProfil`** + prénom → **`Profil`** ; badge date ; **carte réunion** **`GlassPanel`** uniquement si séjour choisi — titre centré « Réunion du … », ordre du jour, **`ReunionContenuTipTap`** (`compact`), expand → **`CompteRenduPleinEcranModal`** ; pull-to-refresh dans la carte ; déconnexion coin haut droit ; modales fermées si écran non focus.
- **`Profil`** : écran Mon profil (Stack, hors onglets) — sections infos / contact / compte ; édition champ par champ ; badge rôle ; photo (choix, recadrage cercle, zoom, suppression) ; **`ChangePasswordModal`**.

## Composants partagés

- **`Header`** : dégradé bleu marque ; icône **24** + titre script **28 px** ; avatar profil **44 px** (anneau glass fin) → **`Profil`** ; hauteur compacte (**52 px** contenu + safe area).
- **`EcranListeFond`** / **`ListeEcranLayout`** : fond listes **`colors.background`** ; **`ListeAvecFiltresFixes`** (filtres fixes, liste derrière) ; export **`styleCarteListe`**.
- **`GlassPanel`** : panneau givré réutilisable (`expo-blur` / overlay) — accueil, modal séjour.
- **`ReunionContenuTipTap`** : rendu TipTap réunion (accueil compact + modale plein écran).
- **`CompteRenduPleinEcranModal`** : lecture CR veille plein écran depuis **`Home`**.
- **`FichePersonneModal`** : modal fiche personne + `LigneInfoFiche` (Équipe avec **`photoUri`** + zoom, Enfants sans photo).
- **`AvatarProfil`** : avatar circulaire photo ou initiales (cartes/modale Équipe).
- **`ListeAccordion`** : coque accordéon (ombre légère) + `listeAccordionStyles` ; `Groups`, `Bedrooms`, `Sorties`, **`CahierInfirmerie`**.
- **`ChambreFormulaireModal`** / **`AffecterOccupantsModal`** : bottom sheets feuille **`background`**, champs blancs.
- **`PlanningCelluleModal`** : édition cellule planning (bottom sheet) ; directeur/adjoint = contenu complet ; animateur = ma présence (contenu `MEMBRE_EQUIPE`) ou édition complète **sur sa ligne** (libellé `MEMBRE_EQUIPE`).
- **`EnteteJoursGrille`** : en-tête jours/dates fixe des grilles **`GrilleDetail`** et **`Activites`** (corps scrollable en dessous) ; variante **`compact`** sur **`Activites`**.
- **`BoutonModePaysageGrille`** / **`ConteneurGrillePaysage`** : paysage visuel du tableau sur **`Menus`**, **`GrilleDetail`** et **`Activites`** (rotation 90°, appareil en portrait) ; bouton rotation aligné **à droite** de la toolbar.
- **`ActiviteFormulaireModal`** / **`ActiviteEnfantsParticipantsModal`** / **`ActiviteConflitSortieModal`** : CRUD activité, enfants participants activité interne, résolution conflit sortie (directeur).
- **`SortieEnfantsParticipantsModal`** : enfants participants sortie (`PUT …/enfants`, tout membre séjour) ; défaut groupes prévus, édition sur tous les enfants inscrits.
- **`CahierInfirmerieFormModal`** : entrée cahier d'infirmerie ; feuille **`background`** ; date/heure séparées (`datetimepicker`).
- **`DossierEnfantModal`** : dossier sanitaire enfant (bottom sheet, consultation seule) ; 4 sections ; tél./e-mail cliquables ; réutilise **`LigneInfoFiche`**.
- **`ChangePasswordModal`** : modification mot de passe (depuis **`Profil`**).
- **`PhotoProfilRecadrageModal`** : recadrage photo profil (masque circulaire, pinch/pan Reanimated, Valider/Annuler).
- **`PhotoProfilZoomModal`** : agrandissement photo profil (pinch / double-tap / pan ; fermeture fond ou croix).
- **`DropdownAnim.tsx`** : orphelin (plus référencé).

## UX transverse

- **Pull-to-refresh** sur tous les écrans de données (hook `useChargementRafraichissable` ou logique dédiée). Inclut **`rafraichirPhotoProfil`** (avatar **`Header`** / **`Home`**). Écrans avec personnes : inclure **`useRafraichirSejourCourant`** dans le `executer` pour synchroniser le tri listes (`triListesEnfants` / `triListesEquipe`).
- **Tri et libellés personnes** (`helpers/triListesSejour.ts`) : ordre et affichage « Nom Prénom » ou « Prénom Nom » selon réglage séjour (lecture seule, aligné web).
- **Fond listes** (**`EcranListeFond`**, **`ListeEcranLayout`**) : **`colors.background`** uniforme (filtres + zone liste) ; cartes blanches + ombre ; accordéons idem. **Accueil / Login** : dégradé + orbes (hors pattern listes).
- **Recherche + filtre liste** (modèle `Animators` / `Children`) : barre dans bande filtres fixe (`ListeAvecFiltresFixes`) ; `TextInput` + normalisation + **MultiSelect** groupes + chips. **`DossierSanitaire`** : recherche enfant + Dropdown (ligne 1) ; moment Traitements (ligne 2). **`CahierInfirmerie`** : recherche + filtre jour. **`Bedrooms`** : Dropdowns + chip Places dispo ; **`ListeAvecFiltresFixes`** (FAB sibling). **Orga liste** : bandeau blanc fixe au-dessus de la liste (recherche titre, champ gris encastré, séparateur visuel).
- **Planning matrice** (`GrilleDetail`, **`Menus`**, **`Activites`**) : colonne libellés fixe (**108 px** orga/menus ; **76 px** animateurs sur **`Activites`**) ; colonnes jours en `flex: 1` ; en-tête jour = nom + date ; fenêtre 1/3/5 j. via **`useFenetreJoursPlanning`** (flèches/swipe par bonds = taille vue) ; chips 1j/3j/5j compacts + **`BoutonModePaysageGrille`** (à droite, rotation 90° du scroll grille via **`ConteneurGrillePaysage`**, header/toolbar en portrait) ; toolbar `minHeight: 36`, alignement vertical centré ; **`GrilleDetail`** / **`Activites`** : en-tête dates fixe (**`EnteteJoursGrille`**, corps seul scrollable), grille bord à bord ; **`GrilleDetail`** : **‹ Retour** sous le header ; **`Menus`** / **`Activites`** : écran racine onglet.
- **Accordéons listes** (`Groups`, `Bedrooms`, `Sorties`, **`CahierInfirmerie`** via **`ListeAccordion`**) : plusieurs items ouverts possibles (`Set` d'ids). **`Bedrooms`** : actions CRUD et affectation occupants dans modales dédiées (confirmations `Alert` pour suppression/retrait). **`CahierInfirmerie`** : édition/suppression dans le corps déplié (icônes, droits **`droitsCahierInfirmerie`**).
- **Bottom sheets formulaire** : feuille **`colors.background`**, champs **`surface`** (chambres, cahier, affectation occupants) ; éviter `Dropdown` dans `ScrollView` gesture-handler — pills / liste dépliable.
- **Anniversaire pendant séjour** (`Children`) : icône gâteau avant le nom ; modale « Anniversaire : {jour date} » (`helpers/anniversaireSejour.ts`).
- Thème RNEUI + tokens `config/theme.ts` ; accent navigation **`colors.primary`** (bottom tabs, top-tabs, **`Header`**).
- États : `ActivityIndicator` au 1er chargement ; indicateur natif au refresh.

## Supprimé (migration)

Onglets **Plannings**, **Infos utiles** ; sous-onglets Sheets (General/Crabs/Sharks/Octopuses, Daytime/Evening/Trips, GeneralHealth/EatingHealth/MedicalTreatments/WhatToDoIf) ; dropdowns Sheets associés.
