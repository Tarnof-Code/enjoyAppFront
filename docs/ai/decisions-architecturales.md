# Décisions architecturales

Patterns et choix techniques de l'app mobile. Garder ce fichier comme référence ; le journal daté va dans [contexte-actif.md](contexte-actif.md).

## Tooling & langage

- **Expo SDK 54 / RN 0.81 / React 19 / TypeScript** ; `tsc --noEmit` via `npm run typecheck`.
- Paquets : **npm** + `legacy-peer-deps=true` (`.npmrc`). Ne pas introduire `pnpm`/`yarn`.
- **React 19 Compiler** : éviter `useMemo` / `useCallback` manuels sauf nécessité mesurée.
- **Principes de code** (`.cursor/rules/20-simplicite-code.mdc`) : KISS/DRY/YAGNI + SRP, séparation des préoccupations (`screens/` UI, `services/` API, `helpers/` logique pure), composition, fail fast.

## Thème & styles

- **Tokens centralisés** : `config/theme.ts` (`colors`, `gradients`, `fonts`, `spacing`, `radius`, `fontSizes`).
- **Source de vérité = app web** : palette mirroir de `enjoyWebApp/src/_variables.scss`.

## Navigation (React Navigation 7)

- Racine `App.tsx` : `Provider` Redux + `GestureHandlerRootView` + `SafeAreaProvider` + `ThemeProvider` (RNEUI).
- **Stack natif** (`BottomTabNavigator.tsx`) : `Login` → `SejourPicker` → `BottomTab`, `headerShown: false`.
- **`navigationRef`** (`Navigators/navigationRef.ts`) : ref de navigation root, importée hors navigateur (`Home` déconnexion, `BottomTabNavigator` session expirée) pour éviter les cycles d'import avec les écrans.
- **Bottom tabs (6)** : `Home`, `Listes`, **`Orga`**, `Menus`, `Activités`, `Sanitaire` (icônes FontAwesome5). L'onglet plannings s'affiche « Orga » ; route `Orga` dans `BottomTabParamList`.
- **Top tabs** (`creerTopTab`) : `TopTabLists` (Animators, Children, Groups, Bedrooms), `TopTabActivities` (Activites, Sorties), **`TopTabSanitaire`** (CahierInfirmerie, DossierSanitaire). Titre du `Header` suit l'onglet actif.
- **Stack Organisation** (`OrganisationNavigator`) : `GrillesList` → `GrilleDetail` (params `grilleId`, `titre`).
- **Écrans pleine page** (header propre) : `Menus`, `Home`. **Sanitaire** : header via `creerTopTab` (titre Cahier d'infirmerie / Dossier sanitaire).
- Types centralisés : `Navigators/types.ts`.

## Authentification & client HTTP

- **Client unique** : `services/httpClient.ts` (axios, `withCredentials: true`).
- **Access token** : `expo-secure-store` via `accountStorage.ts` / `tokenStorage.ts`.
- **Refresh** : corps fallback + `X-Client-Type: mobile` ; refresh proactif ~60 s ; single-flight ; 401 → rejeu ou reset `Login`.
- **`X-Skip-Token-Refresh`** sur login/refresh, envoyé comme chaîne `'true'` pour rester compatible avec le typage Axios ; `hasSkipTokenRefreshHeader` accepte aussi l'ancien booléen.

## Services & chargement des écrans

- Un service par domaine dans `services/`, appels via client partagé, erreurs via `helpers/axiosError.ts`.
- **`useChargementRafraichissable`** (`hooks/useChargementRafraichissable.ts`) : pattern standard pour écrans API — `loading` (1er chargement), `refreshing` (pull-to-refresh), `error`, `refresh`. L'écran fournit un `executer` async.
- **`useRafraichirSejourCourant`** (`hooks/useRafraichirSejourCourant.ts`) : callback async qui recharge `sejourCourant` via `sejourService.getSejourById` et `setSejourCourant`. À inclure dans le `executer` (souvent en parallèle `Promise.all`) des écrans affichant des personnes, pour que le pull-to-refresh reflète les réglages séjour (tri listes) modifiés côté web.
- **Tri des listes de personnes** (`helpers/triListesSejour.ts`, `helpers/trierUtilisateurs.ts`) : critères lus sur `SejourDTO.triListesEnfants` / `triListesEquipe` (API `NOM` | `PRENOM`, lecture seule mobile). Tri locale `fr` ; libellé affiché avec le champ de tri en premier (`libelleEnfantDuSejour` / `libelleEquipeDuSejour`, option `nomEnMajuscules` sur cartes listes).
- **Cas particuliers** : `Animators` lit le store Redux (`sejourCourant`) ; charge en parallèle groupes, chambres et profil directeur (tél./e-mail) ; tri équipe + modal détail via **`FichePersonneModal`**. `Children` : chargement parallèle enfants/groupes/chambres/dossiers + refresh séjour ; dates séjour pour anniversaire. `Bedrooms` : chambres + groupes + enfants en parallèle ; filtres locaux ; **CRUD chambres et occupants** (modales dédiées, mise à jour liste locale via `fusionnerChambreRetourneeDansListe`). `Home` gère son propre refresh (CR veille + photo + liste séjours).
- Utilisateur référencé par **`tokenId`**, jamais id SQL.

## State (Redux Toolkit)

- Store : `animName`, `auth`, `sejour` (plus de slice `overlay`).
- `sejourSlice` : `sejourCourant`, `sejoursDisponibles`.

## Données / API

- **Source unique** : API Enjoy (`/api/v1`). Google Sheets retiré (`config/api.ts`, `types/sheets.ts` supprimés).
- Types DTO dans `types/api.d.ts`, alignés sur `enjoyWebApp/src/types/api.d.ts`.
- Dates API : **`helpers/dateApi.ts`** — `parseDateDepuisValeurApi` / `dayjsDepuisValeurApi` (ISO, chaîne numérique, epoch **secondes** si &lt; 10¹⁰ sinon ms, aligné web) ; `jourISOdepuisValeurApi` pour jour `YYYY-MM-DD` et tableaux Jackson.
- Config runtime : `config/env.ts` / `app.config.js` (`EXPO_PUBLIC_API_URL`).

## Composants UI réutilisables

- **`FichePersonneModal`** (`Components/FichePersonneModal.tsx`) : modal fiche personne (overlay, titre prénom/nom, sous-titre, scroll, bouton Fermer) + **`LigneInfoFiche`** (libellé/valeur, lien optionnel tél./e-mail). Consommé par `Animators` (`DetailMembre`) et `Children` (`DetailEnfant`).
- **`ListeAccordion`** (`Components/ListeAccordion.tsx`) : coque accordéon réutilisable (chevron MaterialIcons, carte bordée, slot en-tête/corps) ; styles partagés exportés (`listeAccordionStyles`). Consommé par `Groups` et `Bedrooms` — contenu métier reste dans chaque écran.
- **`ChambreFormulaireModal`** / **`AffecterOccupantsModal`** : bottom sheets (zone sombre cliquable au-dessus, feuille en bas) ; scroll via **`ScrollView` de `react-native-gesture-handler`** ; formulaire chambre sans `Dropdown` dans le scroll (pills + liste groupe dépliable) pour éviter conflits de gestes ; feuille affectation ~92 % hauteur écran, liste en `flex: 1`.
- **`PlanningCelluleModal`** : bottom sheet édition cellule planning (~92 % écran) ; cases à cocher horaires/moments/groupes/lieux/membres ou texte libre selon `sourceContenuCellules` ; scroll gesture-handler ; retour `ResultatEnregistrementCellule` (`cellules` → PUT, `ma-presence` → PATCH).
- **`EnteteJoursGrille`** : ligne en-tête jours (nom + date) pour grilles calendrier ; fixe au-dessus du corps scrollable ; consommé par **`GrilleDetail`** et **`Activites`** (pas **`Menus`**, en-tête encore dans le scroll).
- **`BoutonModePaysageGrille`** + **`ConteneurGrillePaysage`** : bascule paysage **visuelle** (rotation 90° du scroll grille) sur **`Menus`**, **`GrilleDetail`** et **`Activites`** ; hook **`useModePaysageGrille`** ; l'appareil reste en portrait (`app.json`).

## Plannings organisation

- **Liste** (`Organisation.tsx`) : tri alpha titre (`localeCompare` `fr`) ; filtre `TextInput` + normalisation NFD ; bouton ✕ cross-platform pour vider la recherche.
- **Détail matrice** (`GrilleDetail.tsx`) : lignes triées + bandeaux regroupement ; fenêtre 1/3/5 jours sur tous les jours du séjour (`enumererJoursSejour`) ; hook **`useFenetreJoursPlanning`** (navigation par bonds = taille vue ; `decalage`/`definirDebutFenetre` en `useCallback`) ; navigation ‹ › swipe + **Aujourd'hui** ; toolbar **‹ Retour** + chips 1j/3j/5j compacts + **paysage tableau** (hors `Header`) ; en-tête dates via **`EnteteJoursGrille`** (fixe, corps seul scrollable) ; grille pleine largeur sans marge autour.
- **Logique métier** : **`helpers/planningGrilleUtils.ts`** (libellés lignes/cellules, validation payload, permissions **par ligne**, fenêtre jours, résumé cellule, membres équipe) ; **`helpers/peutGererMembresEquipeSejour.ts`** (directeur ou adjoint = édition structure) ; **`helpers/enumererJoursSejour.ts`** (plage séjour).
- **Permissions cellules** : **`peutModifierCellulePlanning(detail, ligne, peutGererStructure, tokenId)`** — directeur/adjoint → toutes les lignes ; contenu cellule **`MEMBRE_EQUIPE`** → animateur sur toute ligne (PATCH **ma-presence**, case connectée seule) ; libellé ligne **`MEMBRE_EQUIPE`** → animateur **PUT** uniquement sur la ligne où `libelleUtilisateurTokenId` = connecté.
- **Écriture API** : directeur/adjoint → `PUT …/lignes/{ligneId}/cellules` ; animateur contenu équipe → `PATCH …/ma-presence` ; animateur libellé membre (autre contenu) → `PUT` sur sa ligne (`ACCES_SEJOUR` + vérif. serveur).
- **Cas particulier** : `GrilleDetail` charge grille + référentiels (moments, lieux, horaires, groupes) + refresh séjour ; libellés membres selon `triListesEquipe`.

## Menus repas

- **Écran unique** (`Menus.tsx`) : pas de stack interne ; accès direct depuis l'onglet bottom tab **Menus**.
- **Grille calendrier** : colonnes = jours du séjour (fenêtre 1/3/5 via **`useFenetreJoursPlanning`**) ; lignes = types repas (`ORDRE_REPAS`) ; cellules = résumé composition + méta allergènes/régimes ; fond coloré par type (`COULEUR_FOND_CARTE_MENU`, aligné web).
- **Jour initial** : **`jourFocusDefautMenus`** — aujourd'hui si inclus dans la plage séjour, sinon premier jour ; recentrage au changement de séjour ou de mode 1/3/5 j.
- **Navigation** : chips 1j/3j/5j compacts + flèches + swipe + **paysage tableau** ; chaque pas = une page entière (ex. +3 jours en vue 3 j.) ; bouton **Aujourd'hui** si le jour courant est hors fenêtre.
- **Logique métier** : **`helpers/menuRepas.ts`** (indexation jour×type, résumé cellule, libellés) ; jours via **`enumererJoursSejour`** ; données **`menu.service.getMenusBySejour`** (plage `dateDebut`/`dateFin` séjour). Lecture seule mobile (pas d'édition repas).

## Activités calendrier

- **Écran** (`Activites.tsx`, sous-onglet Activités) : matrice **lignes = animateurs**, **colonnes = jours** ; même shell navigation que **`Menus`** / **`GrilleDetail`** (`useFenetreJoursPlanning`, paysage tableau, colonne fixe 108 px) ; en-tête dates **`EnteteJoursGrille`** (fixe, colonnes hors séjour atténuées) ; grille bord à bord.
- **Données** : `GET /activites` + `GET /activites-prestataires` + référentiels (`groupes`, `lieux`, `moments`, types via **`typeActivite.service`**) ; refresh séjour au pull-to-refresh.
- **Fusion cellules** : **`helpers/activitePrestataireCalendrier.ts`** — sorties sur lignes référents, cartes conflit (même moment exact, résolution inline directeur), détection hiérarchique à l'enregistrement (`idsEnConflit` dans **`construireArbreMoments.ts`**).
- **Modales** : **`ActiviteFormulaireModal`** (création/édition/consultation) ; **`ActiviteEnfantsParticipantsModal`** ; **`ActiviteConflitSortieModal`** (choix sortie vs activité par animateur, PUT prestataire `nonParticipations` puis POST/PUT activité).
- **Droits** : **`peutGererActivitesComplet`** (= directeur/adjoint via **`peutGererMembresEquipeSejour`**) ; animateur restreint à **`ligneCalendrierActiviteEditable`** / **`peutModifierActivite`** (membre de l'activité).
- **Filtres** : MultiSelect animateurs (masqué animateur) + groupes âge/niveau (**`groupesFiltreCalendrierActivites`**, référent connecté en tête) ; filtrage lignes + cartes cellule aligné web.
- **Libellés animateurs** : **`libelleMembreDansCelluleEquipe`** (`planningGrilleUtils`) — prénom seul, suffixe nom si homonymes dans le périmètre visible.
- **Jour / date** : fenêtre centrée sur **`jourFocusDefautActivites`** ; nouvelle activité = date de la **cellule** cliquée (`+` ou « + Activité »).
- **Onglet Sorties** (`Sorties.tsx`) : liste accordéons (**`ListeAccordion`**) hors grille calendrier ; en-tête replié = nom + date + moment ; corps = horaires, groupes, infos, tél., **Gérer les participants** ; filtres date (Dropdown) et groupes (MultiSelect) **limités aux valeurs présentes** dans les sorties chargées.
- **`SortieEnfantsParticipantsModal`** : bottom sheet sélection enfants participants sortie (`PUT …/enfants`, tout membre séjour) ; défaut groupes prévus, édition sur tous les enfants inscrits.
- **`CahierInfirmerieFormModal`** : bottom sheet création/édition entrée cahier d'infirmerie ; champs date et heure **séparés** ; **`@react-native-community/datetimepicker`** (iOS `display="compact"` ; Android **`DateTimePickerAndroid.open`**, évite crash dans Modal) ; Dropdown enfant (recherche) et soigneur ; cases à cocher soins/appels.

## Cahier d'infirmerie & dossier sanitaire

- **Navigation** : onglet bottom **Sanitaire** → **`TopTabSanitaire`** — **CahierInfirmerie** (icône book-medical) + **DossierSanitaire** (icône clipboard).
- **Cahier** (`CahierInfirmerie.tsx`) : `GET/POST/PUT/DELETE …/cahier-infirmerie` ; liste cartes (date/heure, enfant, description, soins, appels, soigneur) ; recherche texte + filtre jour ; FAB « + » ; édition/suppression selon **`droitsCahierInfirmerie`** ; refresh séjour au pull-to-refresh ; affichage dates via **`dayjsDepuisValeurApi`**.
- **Dossier sanitaire** (`DossierSanitaire.tsx`) : lecture seule `GET …/dossiers-enfants` ; filtres chips Tout / Traitements / Régime / Médical ; tri/libellé enfants selon `triListesEnfants`.
- **Libellés soins/appels** : **`constants/cahierInfirmerieLabels.ts`**. Pas d'historique ni impression mobile.

## Sécurité

- Jamais lire/exposer `.env*`, clés, keystores, `google-services.json`, dumps SQL. Cf. `.cursorignore`.
