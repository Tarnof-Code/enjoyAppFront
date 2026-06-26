# Contexte actif — phase courante & journal

> Journal factuel et daté. Garder les entrées courtes ; le détail technique va dans [decisions-architecturales.md](decisions-architecturales.md) et [etat-projet.md](etat-projet.md).

## Phase courante

**Migration Sheets → API largement terminée** (phases A/B/C du plan `.cursor/plans/migration-api-mobile.plan.md`). L'app mobile reflète la structure du web : 6 onglets bas, données via l'API Enjoy, plus de Google Sheets.

**Activités (onglet calendrier)** : refonte livrée — grille animateur × jours, fusion sorties, CRUD modales, filtres, conflits directeur/adjoint.

**Sorties (onglet liste)** : accordéons avec gestion enfants participants (`PUT …/enfants`), filtres date/groupes (valeurs présentes uniquement).

**Sanitaire** : top-tabs **Cahier d'infirmerie** (CRUD) + **Dossier sanitaire** (lecture).

Reste mineur : photos animateurs codées en dur dans `Header.tsx`, composant orphelin `DropdownAnim.tsx`, assets `LogosGroupes/` non référencés, spike refresh token en prod (HTTPS).

## Journal

### 2026-06-26 (Sanitaire — top-tabs + cahier d'infirmerie CRUD)
- **Navigation** : onglet **Sanitaire** → **`TopTabSanitaire`** (`creerTopTab`) — sous-onglets **Cahier d'infirmerie** (`CahierInfirmerie`) et **Dossier sanitaire** (`DossierSanitaire`, ex-`Sanitaire.tsx`).
- **Cahier d'infirmerie** : service **`cahierInfirmerie.service`** (GET/POST/PUT/DELETE `/sejours/{id}/cahier-infirmerie`) ; liste avec recherche + filtre jour du séjour ; création/édition via **`CahierInfirmerieFormModal`** (soins, appels, température, soigneur) ; suppression avec confirmation ; droits **`droitsCahierInfirmerie`** (directeur/adjoint/admin, auteur, soigneur).
- **Dates** : **`parseDateDepuisValeurApi`** / **`dayjsDepuisValeurApi`** dans **`dateApi.ts`** — epoch **secondes** ou ms (aligné web `parseDate`) ; formulaire date/heure **séparés** via **`@react-native-community/datetimepicker`** (iOS compact ; Android **`DateTimePickerAndroid.open`**).
- **Constantes** : **`constants/cahierInfirmerieLabels.ts`** (libellés/ordre soins et appels). Pas d'historique des modifications sur mobile.

### 2026-06-26 (Correction typecheck — modal Sorties + httpClient)
- **TypeScript** : `npm run typecheck` repasse au vert après correction du style `introStrong` dans **`SortieEnfantsParticipantsModal`** et du typage Axios dans **`services/httpClient.ts`**.
- **Auth HTTP** : les headers techniques (`X-Skip-Token-Refresh`, `X-Client-Type`) sont typés comme chaînes côté login/refresh ; la réponse refresh est typée explicitement en `AxiosResponse<RefreshTokenResponse>`.

### 2026-06-26 (Grilles Orga / Activités — en-tête dates fixe)
- **Composant** : **`EnteteJoursGrille`** — ligne jours/dates partagée ; coin haut-gauche optionnel (`colonneGauche`) ; colonnes hors séjour atténuées si `joursSejour` (activités).
- **UX** (`GrilleDetail.tsx`, **`Activites.tsx`**) : en-tête dates **hors** `ScrollView` (fixe sous la barre d’outils) ; corps lignes seul scrollable ; grille **bord à bord** (sans marge haut/côtés, sans `borderRadius`) ; `paddingBottom` conservé dans le scroll pour la dernière ligne.

### 2026-06-26 (Sorties — enfants participants + accordéons)
- **API / types** : `ActivitePrestataireDto.enfants`, `SaveActivitePrestataireRequest.enfantIds?`, `UpdateActivitePrestataireEnfantsRequest` ; service **`activitePrestataire.service`** — `getActivitePrestataireById`, **`modifierEnfantsActivitePrestataire`** (`PUT …/activites-prestataires/{id}/enfants`, `preserveResponseData` pour conflit créneau).
- **Helpers** : **`enfantsEffectifsSortie`**, **`idsEnfantsSelectionInitialeSortie`** (défaut = enfants des `groupeIds` si pas d'assignation enregistrée) ; **`idsEnfantsDejaAffectesAutreEvenement`** (activités internes + autres sorties, hiérarchie moments).
- **UI** (`Sorties.tsx`) : accordéons **`ListeAccordion`** — replié : nom, date, moment ; déplié : horaires, groupes, infos, tél., **Gérer les participants** ; filtres **date** (Dropdown) et **groupes** (MultiSelect) limités aux dates/groupes réellement présents ; pas d'affichage enfants sur la carte (modale uniquement).
- **Modale** : **`SortieEnfantsParticipantsModal`** — tous les enfants inscrits au séjour en édition ; conflits créneau grisés ; enregistrement via PUT `/enfants` (tout membre du séjour, `ACCES_SEJOUR`). CRUD sortie complète reste web / direction (`GESTION_SEJOURS`).

### 2026-06-25 (suite 10)
- **Activités — calendrier** (`Activites.tsx`) : grille **animateur × jours** (fenêtre 1/3/5, swipe, **Aujourd'hui**, paysage tableau) ; chargement parallèle activités internes + **sorties prestataires** + groupes/lieux/moments/types ; fusion cellules (**activité** / **sortie** vert / **conflit** orange) via **`activitePrestataireCalendrier.ts`**.
- **CRUD** : **`ActiviteFormulaireModal`** (Dropdown/MultiSelect, consultation → Modifier) ; **`ActiviteEnfantsParticipantsModal`** ; services **`activite.service`** (GET/POST/PUT/DELETE), **`typeActivite.service`**, **`activitePrestataire.service`** (GET + PUT pour résolution conflits `nonParticipations`).
- **Droits** : directeur/adjoint = toutes lignes ; animateur = sa ligne ; conflit sortie à l'enregistrement → modale **`ActiviteConflitSortieModal`** (directeur) ou message blocage (animateur). Pas de retrait sortie depuis la grille mobile.
- **Filtres calendrier** : MultiSelect **animateurs** (directeur, connecté en tête) et **groupes** (âge/niveau uniquement, groupes référent connecté en tête — **`groupesFiltreCalendrierActivites`**).
- **Libellés** : colonne animateur et « Avec : » via **`libelleMembreDansCelluleEquipe`** (prénom + lettres nom si homonymes) ; jour initial **`jourFocusDefautActivites`** (aujourd'hui si dans le séjour, sinon 1er jour) ; date création = cellule cliquée.
- **Helpers** : **`activiteUtils.ts`**, **`construireArbreMoments.ts`** (hiérarchie moments, `idsEnConflit`).

### 2026-06-25 (suite 9)
- **Plannings — droits animateur par ligne** : si **`sourceLibelleLignes = MEMBRE_EQUIPE`**, l’animateur ne peut éditer que les cellules de **sa** ligne (`libelleUtilisateurTokenId` = `tokenId` connecté) ; contenu cellule **`MEMBRE_EQUIPE`** → PATCH **ma-presence** sur toute ligne (sa case uniquement) ; directeur/adjoint inchangés (PUT toutes lignes).
- **Helpers** : **`peutModifierCellulePlanning`**, **`ligneEstCelleDeUtilisateur`**, **`planningAnimateurAUneCelluleEditable`** dans **`planningGrilleUtils.ts`** ; **`GrilleDetail`** : clic cellule filtré par ligne (plus de flag global `peutModifier`).
- **API (enjoyApi, aligné web)** : `PUT …/cellules` accepte **`ACCES_SEJOUR`** pour la propre ligne membre ; contrôle métier côté serveur — déploiement API requis pour l’enregistrement animateur hors directeur/adjoint.

### 2026-06-25 (suite 8)
- **Mode paysage des grilles** (`Menus`, **`GrilleDetail`**) : bouton rotation dans la toolbar (à côté des chips 1/3/5 j.) ; **`ConteneurGrillePaysage`** applique une rotation 90° **uniquement au tableau** (header + barre d'outils + app restent en portrait) ; hook **`useModePaysageGrille`** (état local, pas de verrou orientation appareil).
- **Composants** : **`BoutonModePaysageGrille`** (icône `screen-rotation`, état actif) ; segment 1/3/5 j. en largeur compacte (`alignSelf: 'flex-start'`, sans `flex: 1`).

### 2026-06-25 (suite 7)
- **Menus (UX mobile)** — aligné modèle plannings orga / web : **`Menus.tsx`** remplace l'ancienne **`SectionList`** par une **grille calendrier** (lignes = types repas, colonnes = jours) ; fenêtre **1 / 3 / 5 jours** via **`useFenetreJoursPlanning`** ; swipe + flèches (bonds = taille de la vue) + bouton **Aujourd'hui** ; ouverture directe sur l'onglet (pas de liste intermédiaire) — jour par défaut = **aujourd'hui** si dans le séjour, sinon **premier jour** (`jourFocusDefautMenus`).
- **Helpers menus** : **`menuRepas.ts`** étendu — `indexerMenusParJourEtType`, `resumeMenuCellule`, `metaAllergenesRegimesMenu`, libellés/couleurs repas (`LABELS_TYPE_REPAS`, `COULEUR_FOND_CARTE_MENU`).
- **Hook partagé** : **`useFenetreJoursPlanning`** — `decalage` / `definirDebutFenetre` stabilisés (`useCallback`) ; navigation par page entière (1, 3 ou 5 jours selon la vue) ; bénéficie aussi à **`GrilleDetail`**.

### 2026-06-25 (suite 6)
- **Onglet bas plannings** : route bottom tab **`Organisation` → `Orga`** (`BottomTabParamList`, `BottomTabNavigator`) ; libellé barre d'onglets « Orga » ; icône `calendar-alt` inchangée ; stack interne `OrganisationNavigator` et header liste « Organisation » conservés.

### 2026-06-25 (suite 5)
- **Plannings organisation (UX mobile)** — aligné web / API : refonte **`GrilleDetail`** en **matrice multi-jours** (colonnes = jours, lignes = libellés) ; fenêtre glissante **1 / 3 / 5 jours** (`useFenetreJoursPlanning`, jours du séjour via **`enumererJoursSejour`**) ; swipe horizontal + flèches + bouton **Aujourd'hui** ; en-têtes jour (nom + date) ; sections `libelleRegroupement` ; colonne libellés fixe 108 px.
- **Édition cellules** : tap cellule → **`PlanningCelluleModal`** (bottom sheet ~92 %) ; directeur/adjoint (`peutGererMembresEquipeSejour`) → PUT cellules complètes ; animateur sur grille `MEMBRE_EQUIPE` → PATCH **ma-presence** uniquement ; validation + résumé via **`planningGrilleUtils`** (prénom seul en cellule équipe, désambiguïsation homonymes).
- **Service étendu** : `planningGrille.service` — `remplacerCellulesPlanning` (PUT), `modifierMaPresenceCellulePlanning` (PATCH) ; types `PlanningCellulePayload`, `UpsertPlanningCellulesRequest`, `ModifierMaPresenceCelluleMembreEquipeRequest`.
- **Liste plannings** (`Organisation.tsx`) : tri alphabétique par titre ; recherche avec normalisation casse/accents ; bouton ✕ pour vider le champ (Android + iOS).

### 2026-06-25 (suite 4)
- **Gestion des chambres (écriture)** — alignée web / API `ACCES_SEJOUR` : **`chambre.service.ts`** étendu (CRUD chambre + affectation/retrait occupants enfants et équipe) ; types `SaveChambreRequest`, `AffecterOccupants*` dans `types/api.d.ts`.
- **Helper `helpers/chambreOccupantsUtils.ts`** : éligibilité occupants (genre, groupe), validation modification chambre, fusion locale après réaffectation (déplacement).
- **Écran Chambres** (`Bedrooms.tsx`) : FAB **+** ; accordéon déplié → **Affecter** / **Modifier** / **Supprimer** ; retrait occupant (icône + confirmation) ; chargement parallèle chambres + groupes + **enfants**.
- **Modales** : `ChambreFormulaireModal` (création/édition, pills type/genre, sélecteur groupe dépliable, `ScrollView` gesture-handler) ; `AffecterOccupantsModal` (feuille ~92 % écran, recherche, multi-sélection, hint déplacement depuis autre chambre). Pas de référents animateurs ni historique (hors périmètre mobile v1).

### 2026-06-25 (suite 3)
- **Tri des listes de personnes** (réglage partagé API, lecture seule mobile) : champs `triListesEnfants` / `triListesEquipe` sur `SejourDTO` (`CritereTriListeApi` : `NOM` | `PRENOM`) ; helpers `helpers/trierUtilisateurs.ts` (comparateurs locale `fr`) + `helpers/triListesSejour.ts` (tri + libellé « Nom Prénom » ou « Prénom Nom »).
- **Hook `useRafraichirSejourCourant`** : recharge le séjour courant dans le store au pull-to-refresh (pour prendre en compte un changement de tri côté web) ; inclus dans le `executer` de **Équipe, Enfants, Groupes, Chambres, Sanitaire, Activités, GrilleDetail**.
- **Écrans concernés** : tri + libellé harmonisés — enfants (`trierEnfantsDuSejour`, `libelleEnfantDuSejour`) sur Enfants, Groupes (accordéons), Chambres (occupants enfants), Sanitaire ; équipe (`trierEquipeDuSejour`, `libelleEquipeDuSejour`) sur Équipe, Chambres (occupants équipe), Activités (animateurs), GrilleDetail (membres).

### 2026-06-25 (suite 2)
- **Liste Chambres** (`screens/Lists/Bedrooms.tsx`) : accordéons via **`ListeAccordion`** (identifiant/nom, badge type style Équipe, genre, jauge remplissage, groupe âge/niveau) ; déplié → enfants ou membres équipe selon `typeChambre` ; **filtres sur une ligne** : menus déroulants Type / Genre / Groupe (choix unique, groupes âge-niveau ; masqué si type Équipe) + **chip** Places dispo ; chargement parallèle chambres + groupes ; tri par identifiant.
- **Composant partagé** : `Components/ListeAccordion.tsx` — coque accordéon (chevron, en-tête, corps) ; utilisé par **Groupes** et **Chambres** (`Groups.tsx` refactorisé).

### 2026-06-25 (suite)
- **Liste Groupes** (`screens/Lists/Groups.tsx`) : accordéons (nom + type + tranche/description, chevron, compteur enfants) ; déplié → liste enfants ; **chips filtre type** (Tous / Par âge / Par niveau / Thématique, types présents uniquement) ; dans les groupes **thématiques**, nom des groupes par âge/niveau de chaque enfant à droite (croisement sur `tousLesGroupes`).

### 2026-06-25
- **Liste Enfants** (`screens/Lists/Children.tsx`) : cartes prénom/nom + badge groupes (style Équipe) ; recherche + **MultiSelect groupes** + chips genre (Garçons/Filles) ; tap → modal détail (âge, niveau scolaire, groupes, chambre, contacts parents via dossier).
- **Modal partagée** : `Components/FichePersonneModal.tsx` (+ `LigneInfoFiche`) factorisée depuis Équipe et Enfants.
- **Anniversaire pendant séjour** : helper `helpers/anniversaireSejour.ts` ; icône gâteau (`MaterialIcons` `cake`) avant le nom sur la carte ; ligne **Anniversaire : {date}** dans la modale (dates séjour Redux `sejourCourant`).

### 2026-06-24 (suite 2)
- **Cartes liste Équipe** : affichage épuré (prénom/nom + badge rôle uniquement) ; tél./e-mail/groupes/chambre réservés au **modal** au tap.

### 2026-06-24 (suite)
- **Écran Équipe enrichi** (`screens/Lists/Animators.tsx`) : tap carte → modal (tél./e-mail cliquables, groupes dont le membre est référent, chambre d'hébergement = occupant `membreTokenId`). Barre compacte recherche + **MultiSelect groupes** (`react-native-element-dropdown`, cases à cocher). Chargement parallèle groupes/chambres pour filtres et modal.
- **Directeur** : `DirecteurInfos` (séjour) ne porte pas tél./e-mail → complément via profil dans `equipe` ou `GET /utilisateurs/profil?tokenId=` (`utilisateurService.getProfilByTokenId`).
- **Filtre Direction** : chip unique regroupant directeur + adjoints (`ADJOINT`), à la place du chip « Adj ».

### 2026-06-24
- **Recherche + filtre liste Équipe** (`screens/Lists/Animators.tsx`) : `TextInput` de recherche (prénom/nom/téléphone, insensible casse/accents) + chips de filtre par **rôle séjour** (et non rôle système). Chips dynamiques : seuls les rôles présents dans l'équipe s'affichent ; garde-fou si le rôle actif disparaît.
- **Type `RoleSejour`** ajouté dans `types/api.d.ts` + champ `roleSejour?` sur `ProfilUtilisateurDTO` (déjà renvoyé par l'API, non typé jusque-là).
- **Helper `helpers/roleSejour.ts`** : libellés courts (chips : AS/SB/Anim/Autre ; **Direction** géré à part dans `Animators`) et longs **adaptés au genre** (badge carte : Animateur/Animatrice…), repris de `getRoleSejourByGenre` (web).

### 2026-06-21 (suite)
- **Cycle d'import navigation** : `navigationRef` extrait dans `Navigators/navigationRef.ts` (évite le cycle `BottomTabNavigator` ↔ `Home` ; utilisé pour déconnexion et session expirée).
- **Migration API complète** : suppression onglets Infos utiles et Plannings ; Listes (Équipe, Enfants, Groupes, Chambres), Menus, Organisation (liste grilles + détail jour par jour), Activités/Sorties, Sanitaire (écran unique) alimentés par l'API.
- **Nettoyage Sheets** : suppression `config/api.ts`, `types/sheets.ts`, `overlaySlice`, clé `googleApiKey` dans `app.config.js`.
- **Navigation** : fabrique `Navigators/creerTopTab.tsx` ; titres de header dynamiques par sous-onglet (Listes : Équipe/Enfants/Groupes/Chambres ; Activités : Activités/Sorties).
- **Pull-to-refresh** : hook `hooks/useChargementRafraichissable.ts` + `RefreshControl` sur tous les écrans API et l'accueil (`Home` recharge CR veille + liste séjours).
- **Règles Cursor** : `.cursor/rules/30-app-web.mdc` et `40-api.mdc` pour consulter enjoyWebApp / enjoyApi.

### 2026-06-21
- **Thème centralisé** : `config/theme.ts` (tokens complets, zéro couleur en dur, palette alignée sur `enjoyWebApp/src/_variables.scss`).

### 2026-06-20
- Mise en place Memory Bank mobile, accueil avec menu déroulant séjour, helper `sejourPeriode.ts`, règle `20-simplicite-code.mdc`.
