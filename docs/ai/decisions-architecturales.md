# Décisions architecturales

Patterns et choix techniques de l'app mobile. Garder ce fichier comme référence ; le journal daté va dans [contexte-actif.md](contexte-actif.md).

## Tooling & langage

- **Expo SDK 54 / RN 0.81 / React 19 / TypeScript** ; `tsc --noEmit` via `npm run typecheck`.
- Paquets : **npm** + `legacy-peer-deps=true` (`.npmrc`). Ne pas introduire `pnpm`/`yarn`.
- **Variables d'environnement** : dossier **`.env/`** — seul **`.env/.env.example`** versionné ; copier vers **`.env.local`** (API locale) et **`.env.prod`** (API prod). **`config/loadEnv.cjs`** parse et injecte dans `process.env` (local puis prod si mode prod). **`scripts/expo-env.cjs`** lance Expo avec **`ENJOY_ENV=local|prod`** ; scripts **`npm run start`** (= local), **`start:prod`**, **`start:clear`**, **`start:prod:clear`**. Clé principale : **`EXPO_PUBLIC_API_URL`** (ex. `http://10.0.2.2:8080/api/v1` émulateur Android, IP LAN pour appareil physique).
- **Modules natifs Expo** : installer avec **`npx expo install <pkg>`** pour coller au SDK ; **`@react-native-community/datetimepicker`** **8.4.4** (SDK 54 — pas 9.x) ; **`expo-blur`** **~15.0.8** (SDK 54, panneaux givre **`GlassPanel`**).
- **React 19 Compiler** : éviter `useMemo` / `useCallback` manuels sauf nécessité mesurée.
- **Principes de code** (`.cursor/rules/20-simplicite-code.mdc`) : KISS/DRY/YAGNI + SRP, séparation des préoccupations (`screens/` UI, `services/` API, `helpers/` logique pure), composition, fail fast.

## Thème & styles

- **Tokens centralisés** : `config/theme.ts` (`colors`, `gradients`, `fonts`, `spacing`, `radius`, `fontSizes`).
- **Source de vérité = app web** : palette mirroir de `enjoyWebApp/src/_variables.scss`.
- **Accent navigation** : onglet bottom actif, top-tabs et **`Header`** (icône + titre script blancs sur dégradé bleu) ; inactifs **`colors.disabled`**. **`Header`** : dégradé **`primary` → `primaryDark` → `#2a2d8a`** ; compact — avatar **44 px**, anneau glass **`hairlineWidth`**, titre **28 px**, minHeight contenu **52 px** (alignement haut sous safe area).

## Fond listes & modales formulaire

- **`EcranListeFond`** : conteneur plein écran fond **`colors.background`** (`#f1f2f6`) — pas de dégradé ni orbe (uniformité filtres / liste).
- **`ListeEcranLayout`** : **`EcranListeFond`** + **`ListeAvecFiltresFixes`** — filtres en overlay fixe (`backgroundColor: colors.background`), **`FlatList`** avec `paddingTop` dynamique (`onLayout`), pull-to-refresh `progressViewOffset` aligné ; export **`styleCarteListe`** et **`ESPACE_FILTRES_LISTE`** (12 px).
- **Cartes listes** : fond blanc + bordure + ombre légère (`styleCarteListe` ou **`ListeAccordion`**).
- **Modales bottom sheet chambres / cahier** : feuille **`colors.background`** ; champs, dropdowns et pills inactifs **`colors.surface`** — **`ChambreFormulaireModal`**, **`CahierInfirmerieFormModal`**, **`AffecterOccupantsModal`** (pied actions aussi **`background`**).
- **Exception orga détail** : **`GrilleDetail`** — section haute (consigne + toolbar) **`colors.surface`** ; reste sur **`EcranListeFond`**. **Liste orga** (`Organisation.tsx`) : bandeau recherche fixe **`surface`** + ombre/bordure basse ; champ recherche fond **`background`** (distinct des cartes blanches).

## Navigation (React Navigation 7)

- Racine `App.tsx` : `Provider` Redux + `GestureHandlerRootView` + `SafeAreaProvider` + `ThemeProvider` (RNEUI).
- **Stack natif** (`BottomTabNavigator.tsx`) : `Login` → **`BottomTab`** → **`Profil`** (plein écran, retour `goBack`), `headerShown: false`. Écran **`SejourPicker`** retiré.
- **`navigationRef`** (`Navigators/navigationRef.ts`) : ref de navigation root, importée hors navigateur (`Home` déconnexion, `BottomTabNavigator` session expirée) pour éviter les cycles d'import avec les écrans.
- **Bottom tabs** : `Home` toujours visible ; **`Listes`**, **`Orga`**, `Menus`, `Activités`, `Sanitaire` rendus **uniquement si `sejourCourant`** (`useAppSelector` dans `BottomTab`). Icônes FontAwesome5.
- **Séjour courant** : choix sur **`Home`** (modal **`GlassPanel`**, liste `sejoursDisponibles`) ; connexion sans séjour (`Login` → `clearSejour`) ; bootstrap peut restaurer le dernier séjour mémorisé ; persistance `enregistrerDernierSejourVisite` au changement sur accueil. **Admin** : non rattaché à un séjour en base, mais **`GET /sejours/utilisateur/{tokenId}`** renvoie **tous** les séjours (API) ; l’app impose quand même un **choix explicite** sur **`Home`** (même UX qu’un animateur sans séjour mémorisé).
- **Top tabs** (`creerTopTab`) : `TopTabLists`, `TopTabActivities`, `TopTabSanitaire`. Titre du `Header` suit l'onglet actif. Option **`afficherLibelle`** (défaut true). Option **`barreOngletsCompacte`** (activée sur les trois navigateurs) : hauteur **50 px**, libellés **10 px** ; icônes configurées à **20 px** par onglet. Option **`afficherLibelle: false`** disponible (non utilisée sur Activités depuis 2026-06-28).
- **Stack Organisation** (`OrganisationNavigator`) : `GrillesList` → `GrilleDetail` (params `grilleId`, `titre`).
- **Écrans pleine page** (header propre) : `Menus`, `Home`. **Sanitaire** : header via `creerTopTab` (titre Cahier d'infirmerie / Dossiers sanitaires).
- Types centralisés : `Navigators/types.ts`.

## Authentification & client HTTP

- **Client unique** : `services/httpClient.ts` (axios, `withCredentials: true`).
- **Access token** : `expo-secure-store` via `accountStorage.ts` / `tokenStorage.ts`.
- **Refresh** : corps fallback + `X-Client-Type: mobile` ; refresh proactif ~60 s ; single-flight ; 401 → rejeu ou reset `Login`.
- **`X-Skip-Token-Refresh`** sur login/refresh, envoyé comme chaîne `'true'` pour rester compatible avec le typage Axios ; `hasSkipTokenRefreshHeader` accepte aussi l'ancien booléen.

## Services & chargement des écrans

- Un service par domaine dans `services/`, appels via client partagé, erreurs via `helpers/axiosError.ts`.
- **`useChargementRafraichissable`** (`hooks/useChargementRafraichissable.ts`) : pattern standard pour écrans API — `loading` (1er chargement), `refreshing` (pull-to-refresh), `error`, `refresh`. L'écran fournit un `executer` async **stable** (deps primitives : `sejourId`, dates… — pas l'objet `sejour` Redux entier). Au **refresh** uniquement : **`rafraichirPhotoProfil()`** + **`rafraichirSejourCourant()`** (`helpers/rafraichirSejourCourant.ts`) pour photo header/accueil et critères tri listes (`triListesEnfants` / `triListesEquipe`).
- **`usePhotoProfilLoader`** (`hooks/usePhotoProfilLoader.ts`) : charge la photo profil dans Redux au montage du **`BottomTab`** et au focus ; délègue à **`chargerPhotoProfilDansStore`** (`helpers/rafraichirPhotoProfil.ts`).
- **`rafraichirSejourCourant`** (`helpers/rafraichirSejourCourant.ts`) : recharge `sejourCourant` via `getSejourById` + `setSejourCourant` (store impératif). **`useRafraichirSejourCourant`** (`hooks/`) : wrapper hook pour refresh manuels hors `useChargementRafraichissable` (ex. **`Animators.onRefresh`**).
- **Effets React** : éviter `?? []` inline en dépendance d'`useEffect` (tableau recréé à chaque render — ex. **`Animators`** → constante module **`EQUIPE_VIDE`** + `useMemo` sur `sejour?.equipe`).
- **Tri des listes de personnes** (`helpers/triListesSejour.ts`, `helpers/trierUtilisateurs.ts`) : critères lus sur `SejourDTO.triListesEnfants` / `triListesEquipe` (API `NOM` | `PRENOM`, lecture seule mobile). Tri locale `fr` ; libellé affiché avec le champ de tri en premier (`libelleEnfantDuSejour` / `libelleEquipeDuSejour`, option `nomEnMajuscules` sur cartes listes).
- **Cas particuliers** : `Animators` lit le store Redux (`sejourCourant`) ; charge en parallèle groupes, chambres et profil directeur (tél./e-mail, **`photoProfilUrl`**) ; photos équipe via **`usePhotosProfilEquipe`** + **`AvatarProfil`** sur cartes et modale ; tri équipe + modal détail via **`FichePersonneModal`** (`photoUri`, zoom) ; pull-to-refresh dédié recharge séjour + photo (`getSejourById`, **`rafraichirPhotoProfil`**). `Children` : chargement parallèle enfants/groupes/chambres/dossiers ; dates séjour pour anniversaire. `Bedrooms` : chambres + groupes + enfants en parallèle ; filtres locaux ; **CRUD chambres et occupants** (modales dédiées, mise à jour liste locale via `fusionnerChambreRetourneeDansListe`). **`Home`** : sans `sejourCourant` — pas de chargement réunion, invite choix séjour, onglets restreints ; avec séjour — refresh réunions (dernière réunion) + **`rafraichirPhotoProfil`** + liste séjours ; CR TipTap + modale plein écran ; modales fermées si écran non focus.
- Utilisateur référencé par **`tokenId`**, jamais id SQL.

## State (Redux Toolkit)

- Store : `animName`, `auth`, `sejour` (plus de slice `overlay`).
- `authSlice` : identité connectée + **`photoProfilUri`**, **`photoProfilRevision`** (`setPhotoProfilUri`, `bumpPhotoProfilRevision`).
- `sejourSlice` : `sejourCourant`, `sejoursDisponibles`.

## Données / API

- **Source unique** : API Enjoy (`/api/v1`). Google Sheets retiré (`config/api.ts`, `types/sheets.ts` supprimés).
- Types DTO dans `types/api.d.ts`, alignés sur `enjoyWebApp/src/types/api.d.ts`.
- Dates API : **`helpers/dateApi.ts`** — `parseDateDepuisValeurApi` / `dayjsDepuisValeurApi` (ISO, chaîne numérique, epoch **secondes** si &lt; 10¹⁰ sinon ms, aligné web) ; `jourISOdepuisValeurApi` pour jour `YYYY-MM-DD` et tableaux Jackson.
- Config runtime : **`app.config.js`** (charge **`.env`** via **`loadEnjoyEnv`**, expose **`extra.apiUrl`** + **`extra.enjoyEnv`**) → **`config/env.ts`** (`API_BASE_URL`, fallback localhost).

## Composants UI réutilisables

- **`FichePersonneModal`** (`Components/FichePersonneModal.tsx`) : modal fiche personne (overlay, en-tête photo optionnelle **`photoUri`** + initiales via **`AvatarProfil`**, tap photo → **`PhotoProfilZoomModal`**, nom/rôle, scroll, bouton Fermer) + **`LigneInfoFiche`** (libellé/valeur, lien optionnel tél./e-mail). Consommé par `Animators` (`DetailMembre`, avec photo) et `Children` (`DetailEnfant`, sans photo).
- **`AvatarProfil`** (`Components/AvatarProfil.tsx`) : cercle photo ou initiales (taille paramétrable) — cartes **`Animators`**, en-tête **`FichePersonneModal`**.
- **`PhotoProfilZoomModal`** : pinch / pan / double-tap ; fermeture croix ou **tap fond**.
- **`GlassPanel`** (`Components/GlassPanel.tsx`) : conteneur givré réutilisable — **`BlurView`** (`expo-blur`) sur iOS, overlay blanc semi-opaque sur Android ; props `intensity`, `overlayOpacity`, `borderRadius`.
- **`EcranListeFond`** / **`ListeEcranLayout`** (`Components/ListeEcranLayout.tsx`) : fond listes orga/sanitaire — uni **`colors.background`** ; filtres fixes même teinte ; **`ListeAvecFiltresFixes`** exporté pour cas sans wrapper complet (**`Bedrooms`** FAB, **`GrilleDetail`**).
- **`ReunionContenuTipTap`** (`Components/ReunionContenuTipTap.tsx`) : rendu natif du JSON TipTap réunion (`ReunionContenuTipTapJson`) — blocs doc/paragraph/heading/list/blockquote/code/hr + marques inline ; prop **`compact?`** pour la carte accueil.
- **`CompteRenduPleinEcranModal`** : modal slide plein écran (titre, ordre du jour, **`ReunionContenuTipTap`**) ; ouverte depuis **`Home`** (icône expand).
- **`ListeAccordion`** (`Components/ListeAccordion.tsx`) : coque accordéon réutilisable (chevron MaterialIcons, carte bordée + ombre légère, slot en-tête/corps) ; styles partagés exportés (`listeAccordionStyles`). Consommé par `Groups`, `Bedrooms`, `Sorties` et **`CahierInfirmerie`** — contenu métier reste dans chaque écran.
- **`ChambreFormulaireModal`** / **`AffecterOccupantsModal`** : bottom sheets (zone sombre cliquable au-dessus, feuille **`colors.background`**) ; scroll via **`ScrollView` de `react-native-gesture-handler`** ; formulaire chambre sans `Dropdown` dans le scroll (pills + liste groupe dépliable) ; champs blancs ; feuille affectation ~92 % hauteur écran, liste en `flex: 1`.
- **`PlanningCelluleModal`** : bottom sheet édition cellule planning (~92 % écran) ; cases à cocher horaires/moments/groupes/lieux/membres ou texte libre selon `sourceContenuCellules` ; scroll gesture-handler ; retour `ResultatEnregistrementCellule` (`cellules` → PUT, `ma-presence` → PATCH).
- **`EnteteJoursGrille`** : ligne en-tête jours (nom + date) pour grilles calendrier ; fixe au-dessus du corps scrollable ; consommé par **`GrilleDetail`** et **`Activites`** (pas **`Menus`**, en-tête encore dans le scroll) ; prop **`compact?`** (en-tête plus bas, **`Activites`**).
- **`BoutonModePaysageGrille`** + **`ConteneurGrillePaysage`** : bascule paysage **visuelle** (rotation 90° du scroll grille) sur **`Menus`**, **`GrilleDetail`** et **`Activites`** ; hook **`useModePaysageGrille`** ; l'appareil reste en portrait (`app.json`) ; bouton rotation **`marginLeft: 'auto'`** dans la toolbar (chips 1/3/5 j. à gauche).

## Plannings organisation

- **Liste** (`Organisation.tsx`) : tri alpha titre (`localeCompare` `fr`) ; filtre `TextInput` + normalisation NFD ; bouton ✕ cross-platform pour vider la recherche.
- **Détail matrice** (`GrilleDetail.tsx`) : lignes triées + bandeaux regroupement ; fenêtre 1/3/5 jours sur tous les jours du séjour (`enumererJoursSejour`) ; hook **`useFenetreJoursPlanning`** (navigation par bonds = taille vue ; `decalage`/`definirDebutFenetre` en `useCallback`) ; navigation ‹ › swipe + **Aujourd'hui** ; toolbar **‹ Retour** + chips 1j/3j/5j compacts + **paysage tableau** (hors `Header`) ; en-tête dates via **`EnteteJoursGrille`** (fixe, corps seul scrollable) ; grille pleine largeur sans marge autour.
- **Logique métier** : **`helpers/planningGrilleUtils.ts`** (libellés lignes/cellules, validation payload, permissions **par ligne**, fenêtre jours, résumé cellule, membres équipe) ; **`helpers/peutGererMembresEquipeSejour.ts`** (directeur ou adjoint = édition structure) ; **`helpers/enumererJoursSejour.ts`** (plage séjour).
- **Permissions cellules** : **`peutModifierCellulePlanning(detail, ligne, peutGererStructure, tokenId)`** — directeur/adjoint → toutes les lignes ; contenu cellule **`MEMBRE_EQUIPE`** → animateur sur toute ligne (PATCH **ma-presence**, case connectée seule) ; libellé ligne **`MEMBRE_EQUIPE`** → animateur **PUT** uniquement sur la ligne où `libelleUtilisateurTokenId` = connecté.
- **Écriture API** : directeur/adjoint → `PUT …/lignes/{ligneId}/cellules` ; animateur contenu équipe → `PATCH …/ma-presence` ; animateur libellé membre (autre contenu) → `PUT` sur sa ligne (`ACCES_SEJOUR` + vérif. serveur).
- **Cas particulier** : `GrilleDetail` charge grille + référentiels (moments, lieux, horaires, groupes) ; libellés membres selon `triListesEquipe` (refresh séjour au pull-to-refresh).

## Menus repas

- **Écran unique** (`Menus.tsx`) : pas de stack interne ; accès direct depuis l'onglet bottom tab **Menus**.
- **Grille calendrier** : colonnes = jours du séjour (fenêtre 1/3/5 via **`useFenetreJoursPlanning`**) ; lignes = types repas (`ORDRE_REPAS`) ; cellules = résumé composition + méta allergènes/régimes ; fond coloré par type (`COULEUR_FOND_CARTE_MENU`, aligné web).
- **Jour initial** : **`jourFocusDefautMenus`** — aujourd'hui si inclus dans la plage séjour, sinon premier jour ; recentrage au changement de séjour ou de mode 1/3/5 j.
- **Navigation** : chips 1j/3j/5j compacts + flèches + swipe + **paysage tableau** ; chaque pas = une page entière (ex. +3 jours en vue 3 j.) ; bouton **Aujourd'hui** si le jour courant est hors fenêtre.
- **Logique métier** : **`helpers/menuRepas.ts`** (indexation jour×type, résumé cellule, libellés) ; jours via **`enumererJoursSejour`** ; données **`menu.service.getMenusBySejour`** (plage `dateDebut`/`dateFin` séjour). Lecture seule mobile (pas d'édition repas).

## Activités calendrier

- **Écran** (`Activites.tsx`, sous-onglet route `Activites`, header **Planning**) : matrice **lignes = animateurs**, **colonnes = jours** ; même shell navigation que **`Menus`** / **`GrilleDetail`** (`useFenetreJoursPlanning`, paysage tableau, colonne animateurs fixe **76 px**) ; en-tête dates **`EnteteJoursGrille`** **`compact`**, coin haut-gauche (`colonneGauche`), colonnes hors séjour atténuées ; grille bord à bord.
- **Couleurs cartes cellule** : activités → **`couleurFondCalendrierPourTypeActivite(typeActivite.id)`** (`activiteUtils.ts`, HSL hashé sur 36 teintes, aligné web) ; sorties → **`COULEUR_FOND_CARTE_SORTIE`** ; conflits → **`colors.warningSoft`**.
- **Données** : `GET /activites` + `GET /activites-prestataires` + référentiels (`groupes`, `lieux`, `moments`, types via **`typeActivite.service`**) ; refresh séjour via **`useChargementRafraichissable`** (pull-to-refresh).
- **Fusion cellules** : **`helpers/activitePrestataireCalendrier.ts`** — sorties sur lignes référents, cartes conflit (même moment exact, résolution inline directeur), détection hiérarchique à l'enregistrement (`idsEnConflit` dans **`construireArbreMoments.ts`**).
- **Modales** : **`ActiviteFormulaireModal`** (création/édition/consultation) ; **`ActiviteEnfantsParticipantsModal`** ; **`ActiviteConflitSortieModal`** (choix sortie vs activité par animateur, PUT prestataire `nonParticipations` puis POST/PUT activité).
- **Droits** : **`peutGererActivitesComplet`** (= directeur/adjoint via **`peutGererMembresEquipeSejour`**) ; animateur restreint à **`ligneCalendrierActiviteEditable`** / **`peutModifierActivite`** (membre de l'activité).
- **Filtres** : MultiSelect animateurs (masqué animateur) + groupes âge/niveau (**`groupesFiltreCalendrierActivites`**, référent connecté en tête) ; filtrage lignes + cartes cellule aligné web.
- **Libellés animateurs** : **`libelleMembreDansCelluleEquipe`** (`planningGrilleUtils`) — prénom seul, suffixe nom si homonymes dans le périmètre visible.
- **Jour / date** : fenêtre centrée sur **`jourFocusDefautActivites`** ; nouvelle activité = date de la **cellule** cliquée (`+` ou « + Activité »).
- **Onglet Sorties** (`Sorties.tsx`) : liste accordéons (**`ListeAccordion`**) hors grille calendrier ; en-tête replié = nom + date + moment ; corps = horaires, groupes, infos, tél., **Gérer les participants** ; filtres date (Dropdown) et groupes (MultiSelect) **limités aux valeurs présentes** dans les sorties chargées.
- **`SortieEnfantsParticipantsModal`** : bottom sheet sélection enfants participants sortie (`PUT …/enfants`, tout membre séjour) ; défaut groupes prévus, édition sur tous les enfants inscrits.
- **`CahierInfirmerieFormModal`** : bottom sheet création/édition entrée cahier d'infirmerie ; feuille **`colors.background`** ; champs date et heure **séparés** ; **`@react-native-community/datetimepicker`** (iOS `display="compact"` ; Android **`DateTimePickerAndroid.open`**, évite crash dans Modal) ; Dropdown enfant (recherche) et soigneur ; cases à cocher soins/appels.

## Cahier d'infirmerie & dossier sanitaire

- **Navigation** : onglet bottom **Sanitaire** → **`TopTabSanitaire`** — **CahierInfirmerie** (icône book-medical) + **DossierSanitaire** (icône clipboard).
- **Cahier** (`CahierInfirmerie.tsx`) : `GET/POST/PUT/DELETE …/cahier-infirmerie` ; **`ListeEcranLayout`** (fond **`background`**, filtres fixes) ; accordéons **`ListeAccordion`** ; recherche + filtre jour ; FAB « + » ; **`CahierInfirmerieFormModal`** (feuille grise) ; droits **`droitsCahierInfirmerie`**.
- **Dossier sanitaire** (`DossierSanitaire.tsx`) : liste `GET …/dossiers-enfants` ; **`ListeEcranLayout`** ; **`TextInput`** recherche enfant + **`Dropdown`** filtre contenu ; sous-filtre moment Traitements ; cartes **`styleCarteListe`** pressables → **`DossierEnfantModal`** ; tri/libellé enfants selon `triListesEnfants`.
- **`DossierEnfantModal`** : bottom sheet **consultation seule** dossier enfant ; sections Contacts / Médical / Traitements / Autres ; `GET …/enfants/{enfantId}/dossier` ; tél./e-mail cliquables ; réutilise **`LigneInfoFiche`**. Édition réservée à l'app web (pas de `PUT` mobile).
- **Libellés soins/appels** : **`constants/cahierInfirmerieLabels.ts`**. Pas d'historique ni impression mobile.

## Profil utilisateur

- **Écran** (`screens/Profil/Profil.tsx`) : consultation/édition profil connecté (sections repliables par champ) ; PUT **`/utilisateurs`** via **`buildUpdateUserRequest`** ; email modifiable seulement si **`canEditEmail`** ; mot de passe via **`ChangePasswordModal`** (PATCH **`/utilisateurs/mot-de-passe`**).
- **Politique mot de passe** : **`helpers/passwordPolicy.ts`** — **`PASSWORD_REGEX`**, **`PASSWORD_MESSAGE`**, **`isValidPassword`** ; aligné enjoyApi **`PasswordPolicy`** (minuscule + majuscule + symbole/ponctuation, ≥ 4 car. sans espace). Consommé par **`ChangePasswordModal`** ; exposé aussi via **`regexValidation.validatePassword`**.
- **Photo** : choix galerie (**`expo-image-picker`**, sans recadrage natif) → **`PhotoProfilRecadrageModal`** (masque **circulaire**, pinch/pan **Reanimated**, boutons **Valider/Annuler**, export carré JPEG via **`expo-image-manipulator`** + **`helpers/photoProfilRecadrage.ts`**) ; suppression avec confirmation ; zoom **`PhotoProfilZoomModal`**.
- **Affichage photo ailleurs** : **`Header`** et **`Home`** (anneau **`GlassPanel`** + **`AvatarProfil`**, prénom sous l'avatar) lisent **`auth.photoProfilUri`** ; liste **Équipe** — **`usePhotosProfilEquipe`** + **`AvatarProfil`** (cartes + modale) ; tap → **`Profil`** (connecté) ou zoom (autres membres) ; refresh global **`rafraichirPhotoProfil`** au pull-to-refresh.
- **Helpers alignés web** : **`buildUpdateUserRequest`**, **`canEditEmail`**, **`dateToISO`**, **`libelleRoleBadgeProfil`** (`libelleRoleProfil.ts`).

## Sécurité

- Jamais lire/exposer `.env*`, clés, keystores, `google-services.json`, dumps SQL. Cf. `.cursorignore`.
