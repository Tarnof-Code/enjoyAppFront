# État projet — services, contrat API, glossaire

Inventaire factuel. Pour les patterns, voir [decisions-architecturales.md](decisions-architecturales.md).

## Contrat API (alignement enjoyApi / enjoyWebApp)

- Base : `/api/v1`, JWT **Bearer**, `withCredentials: true`.
- Types DTO dans `types/api.d.ts`, synchronisés avec `enjoyWebApp/src/types/api.d.ts`.
- Référence utilisateur : **`tokenId`** (jamais id SQL).

### Endpoints utilisés (mobile)

| Domaine | Endpoint | Écran / usage |
|---------|----------|---------------|
| Auth | `POST /auth/connexion`, `/refresh-token`, `/logout` | Connexion, session |
| Profil | `GET /utilisateurs/profil?tokenId=`, `PUT /utilisateurs`, `PATCH /utilisateurs/mot-de-passe`, `GET/POST/DELETE /utilisateurs/{tokenId}/photo-profil` | Bootstrap, **`Profil`**, **`Home`**, **`Header`**, **`Animators`** (directeur + photos équipe via `photoProfilUrl`) |
| Séjours | `GET /sejours/utilisateur/{tokenId}`, `GET /sejours/{id}` | **`Home`** (liste + choix modal, persistance dernier séjour), refresh séjour (`useRafraichirSejourCourant` sur listes, Sanitaire, Activités, GrilleDetail) |
| Réunions | `GET /sejours/{sejourId}/reunions` | `Home` (CR veille) |
| Enfants | `GET /sejours/{id}/enfants` | `Children` |
| Chambres | `GET/POST /sejours/{id}/chambres`, `GET/PUT/DELETE …/{chambreId}`, `POST/DELETE …/occupants/enfants[/{enfantId}]`, `POST/DELETE …/occupants/equipe[/{membreTokenId}]` | `Bedrooms` (lecture + CRUD + occupants), `Animators`, `Children` (modal chambre occupant) |
| Groupes | `GET /sejours/{id}/groupes` | `Groups`, `Bedrooms` (filtre), `Animators`, `Children` (filtre + modal), résolution libellés (Activités, Sorties, GrilleDetail) |
| Menus | `GET /sejours/{id}/menus?dateDebut&dateFin` | `Menus` |
| Plannings | `GET /sejours/{id}/planning-grilles`, `GET …/{grilleId}` | `Organisation`, `GrilleDetail` |
| Plannings (écriture) | `PUT …/{grilleId}/lignes/{ligneId}/cellules` (`GESTION_SEJOURS` ou **`ACCES_SEJOUR`** sur sa ligne si libellé `MEMBRE_EQUIPE`), `PATCH …/cellules/{jour}/ma-presence` | `GrilleDetail` — directeur/adjoint : toutes lignes ; animateur : PATCH si contenu `MEMBRE_EQUIPE`, PUT sa ligne si libellé `MEMBRE_EQUIPE` |
| Réf. planning | `GET …/moments`, `…/lieux`, `…/horaires` | `GrilleDetail` (résolution libellés + édition cellule) |
| Activités | `GET/POST/PUT/DELETE /sejours/{id}/activites`, `GET …/{activiteId}` | `Activites` (grille + CRUD) |
| Sorties | `GET /sejours/{id}/activites-prestataires`, `GET …/{id}`, `PUT …/{id}/enfants` (`UpdateActivitePrestataireEnfantsRequest`), `PUT …/{id}` (`SaveActivitePrestataireRequest`, `nonParticipations` — résolution conflits calendrier) | `Activites` (fusion calendrier) ; `Sorties` (accordéons + gestion participants) |
| Types activité | `GET /sejours/{id}/types-activite` | `Activites` (formulaire) |
| Réf. activités | `GET …/moments`, `…/lieux` (usage ACTIVITE) | `Activites` |
| Sanitaire | `GET /sejours/{id}/dossiers-enfants` | `DossierSanitaire` (liste), `Children` (contacts parents dans modal ; chargement silencieux si indisponible) |
| Dossier enfant | `GET /sejours/{id}/enfants/{enfantId}/dossier` | **`DossierEnfantModal`** (consultation seule ; édition via web) |
| Cahier infirmerie | `GET/POST /sejours/{id}/cahier-infirmerie`, `PUT/DELETE …/{entreeId}` | `CahierInfirmerie` (accordéons + CRUD modale) |

> **`SejourDTO`** : en plus de `directeur` / `equipe`, porte `triListesEnfants?` et `triListesEquipe?` (`CritereTriListeApi` : `NOM` | `PRENOM`) — réglage partagé web, lecture seule mobile ; tri et libellés via `helpers/triListesSejour.ts`.
>
> Équipe (`Animators`) : données `directeur` + `equipe` dans le store ; compléments : groupes/chambres du séjour, profil directeur si absent de `equipe`. Chaque membre d'équipe porte `roleSejour` ; le directeur (champ séparé, sans `roleSejour`) est rattaché au filtre chip **Direction** avec les adjoints.

## Services (`services/`)

| Fichier | Rôle |
|---------|------|
| `httpClient.ts` | Client axios + intercepteurs auth |
| `account.service.ts` | Login, logout, profil, restoreSession |
| `accountStorage.ts` / `tokenStorage.ts` | SecureStore |
| `sejour.service.ts` | Séjours utilisateur et détail |
| `sejour-reunion.service.ts` | Réunions (CR veille) |
| `utilisateur.service.ts` | Profil, **`updateUser`**, **`changePassword`**, photo profil (GET data URI, upload, remplacer, supprimer) |
| `enfant.service.ts` | Enfants du séjour |
| `groupe.service.ts` | Groupes |
| `chambre.service.ts` | Chambres (liste, détail, CRUD, affectation/retrait occupants enfants et équipe) |
| `menu.service.ts` | Menus repas |
| `planningGrille.service.ts` | Grilles planning (liste, détail, PUT cellules, PATCH ma-presence) |
| `moment.service.ts`, `lieu.service.ts`, `horaire.service.ts` | Référentiels planning |
| `activite.service.ts`, `activitePrestataire.service.ts`, `typeActivite.service.ts` | Activités internes (CRUD), sorties prestataires (liste, GET détail, PUT enfants, PUT `nonParticipations`), types d'activité |
| `dossierEnfant.service.ts` | Fiches sanitaires agrégées ; dossier enfant (`getDossiersSanitairesBySejour`, `getDossierEnfant`) |
| `cahierInfirmerie.service.ts` | Cahier d'infirmerie (lister, créer, modifier, supprimer entrées) |

## Config (`config/` + `.env/`)

| Fichier | Rôle |
|---------|------|
| `config/env.ts` | **`API_BASE_URL`** depuis `Constants.expoConfig.extra.apiUrl` (fallback `EXPO_PUBLIC_API_URL` / localhost) |
| `config/loadEnv.cjs` | Parse **`.env/.env.local`** puis **`.env/.env.prod`** si mode prod |
| `config/theme.ts` | Tokens couleurs, espacements, polices |
| `app.config.js` | Charge env via **`loadEnjoyEnv`**, expose **`extra.apiUrl`** et **`extra.enjoyEnv`** |
| `scripts/expo-env.cjs` | Lance Expo avec **`ENJOY_ENV=local|prod`** (scripts npm `start`, `start:prod`, etc.) |
| `.env/.env.example` | Modèle versionné — copier vers `.env.local` / `.env.prod` (non commités) |

## Hooks (`hooks/`)

| Fichier | Rôle |
|---------|------|
| `useChargementRafraichissable.ts` | Chargement initial + pull-to-refresh (+ **`rafraichirPhotoProfil`** au refresh) |
| `usePhotoProfilLoader.ts` | Charge **`photoProfilUri`** dans Redux (montage BottomTab + focus) |
| `usePhotosProfilEquipe.ts` | Photos profil membres équipe (`photoProfilUrl` → data URI ; réutilise Redux si connecté) |
| `useRafraichirSejourCourant.ts` | Recharge `sejourCourant` (critères tri listes) au refresh |
| `useFenetreJoursPlanning.ts` | Fenêtre glissante 1/3/5 jours ; navigation par bonds (= taille vue) ; partagé **`GrilleDetail`**, **`Menus`** et **`Activites`** |
| `useModePaysageGrille.ts` | Bascule état paysage visuel du tableau (sans rotation appareil) |

## Composants UI (`Components/`)

| Fichier | Rôle |
|---------|------|
| `EcranListeFond.tsx` | Fond uni **`colors.background`** pour écrans listes/orga |
| `ListeEcranLayout.tsx` | **`ListeEcranLayout`** + **`ListeAvecFiltresFixes`** ; export **`styleCarteListe`** |

## Helpers (`helpers/`)

| Fichier | Rôle |
|---------|------|
| `axiosError.ts` | Messages d'erreur utilisateur |
| `dateApi.ts` | `parseDateDepuisValeurApi`, `dayjsDepuisValeurApi` (epoch s/ms, ISO, chaîne numérique) ; `jourISOdepuisValeurApi` (jour `YYYY-MM-DD`, tableaux Jackson) |
| `menuRepas.ts` | Types repas, ordre, indexation jour×type, résumé cellule grille, jour focus défaut, couleurs affichage |
| `dernierSejour.ts` | Dernier séjour visité (SecureStore) |
| `sejourPeriode.ts` | Formatage périodes séjour |
| `reunionVeille.ts`, `reunionTipTapTexte.ts` | CR réunion J−1 (`Home`) — **`trouverReunionVeille`**, **`formatTitreCompteRenduAccueil`**, **`estContenuTipTapVide`** |
| `photoProfil.ts` | Blob photo profil → data URI |
| `rafraichirPhotoProfil.ts` | **`chargerPhotoProfilDansStore`**, **`rafraichirPhotoProfil`** (store Redux) |
| `photoProfilRecadrage.ts` | Recadrage pinch/pan → rectangle crop + export JPEG |
| `buildUpdateUserRequest.ts` | Body PUT `/utilisateurs` (aligné web) |
| `canEditEmail.ts` | Droits édition email profil |
| `dateToISO.ts` | Date → ISO API |
| `libelleRoleProfil.ts` | Badge rôle profil (séjour courant ou système) |
| `roleSejour.ts` | Libellés rôle séjour : courts (chips) + longs adaptés au genre (badge) |
| `anniversaireSejour.ts` | Date d'anniversaire pendant la période du séjour (affichage liste Enfants) |
| `trierUtilisateurs.ts` | Comparateurs locale `fr` nom/prénom |
| `triListesSejour.ts` | Tri et libellés enfants/équipe selon `triListesEnfants` / `triListesEquipe` |
| `chambreOccupantsUtils.ts` | Éligibilité occupants, validation modification chambre, fusion liste locale après affectation |
| `enumererJoursSejour.ts` | Liste des jours ISO entre date début/fin séjour |
| `peutGererMembresEquipeSejour.ts` | Directeur ou adjoint (droits édition structure planning) |
| `passwordPolicy.ts` | Politique mot de passe alignée API — **`PASSWORD_REGEX`**, **`PASSWORD_MESSAGE`**, **`isValidPassword`** |
| `regexValidation.ts` | Validation email, téléphone et mot de passe (**`validatePassword`** → **`passwordPolicy`**) |
| `planningGrilleUtils.ts` | Affichage/validation cellules planning, fenêtre jours, permissions par ligne (`peutModifierCellulePlanning`, `ligneEstCelleDeUtilisateur`), résumés, **`libelleMembreDansCelluleEquipe`** |
| `activiteUtils.ts` | Calendrier activités : droits, indexation par animateur/jour, cartes cellule, filtres groupes âge/niveau, défauts formulaire, enfants participants activité ; **`couleurFondCalendrierPourTypeActivite`** (fond carte par `typeActivite.id`, HSL 36 teintes, aligné web) ; sorties : **`enfantsEffectifsSortie`**, **`idsEnfantsSelectionInitialeSortie`**, **`idsEnfantsDejaAffectesAutreEvenement`** |
| `activitePrestataireCalendrier.ts` | Fusion activités/sorties en cellule, conflits hiérarchiques, `nonParticipations`, filtres lignes calendrier |
| `construireArbreMoments.ts` | Arbre moments hiérarchiques, `idsEnConflit`, sélection visuelle dropdown |
| `droitsCahierInfirmerie.ts` | Droits modification/suppression entrée cahier (directeur/adjoint/admin, auteur, soigneur) |

## Composants (`Components/` — complément)

| Fichier | Rôle |
|---------|------|
| `PlanningCelluleModal.tsx` | Bottom sheet édition cellule planning (horaires, moments, groupes, lieux, membres, texte libre) |
| `ActiviteFormulaireModal.tsx` | CRUD activité (bottom sheet, Dropdown/MultiSelect moments hiérarchiques) |
| `ActiviteEnfantsParticipantsModal.tsx` | Sélection enfants participants d'une activité interne |
| `SortieEnfantsParticipantsModal.tsx` | Sélection enfants participants d'une sortie (`PUT …/enfants`) |
| `ActiviteConflitSortieModal.tsx` | Résolution conflit activité / sortie à l'enregistrement (directeur) |
| `CahierInfirmerieFormModal.tsx` | Création/édition entrée cahier d'infirmerie (date/heure séparées, soins, appels, soigneur) |
| `DossierEnfantModal.tsx` | Consultation dossier sanitaire enfant (bottom sheet, 4 sections, lecture seule) |
| `ChangePasswordModal.tsx` | Modification mot de passe (depuis **`Profil`**) |
| `AvatarProfil.tsx` | Avatar circulaire (photo ou initiales) — **`Animators`**, **`FichePersonneModal`** |
| `PhotoProfilRecadrageModal.tsx` | Recadrage photo profil (cercle, Valider/Annuler) |
| `PhotoProfilZoomModal.tsx` | Agrandissement photo profil (pinch / double-tap / pan ; fermeture fond ou croix) |
| `GlassPanel.tsx` | Panneau givré (`expo-blur` iOS, overlay Android) — **`Home`**, modal séjour |
| `ReunionContenuTipTap.tsx` | Rendu natif JSON TipTap réunion (mode **`compact`** sur accueil) |
| `CompteRenduPleinEcranModal.tsx` | Lecture plein écran CR veille (ordre du jour + TipTap) |

## Glossaire

- **`tokenId`** : identifiant public utilisateur (claim `sub` du JWT).
- **Bootstrap** : restauration session au démarrage → profil + **optionnel** dernier séjour mémorisé → **`BottomTab`** (ou **`Login`**).
- **Séjour courant** : sélection sur **`Home`** ; connexion explicite sans séjour ; onglets applicatifs masqués tant que `sejourCourant` est null.
- **Single-flight** : un seul refresh token concurrent.
- **Compte rendu de la veille** : dernière réunion à J−1 sur `Home` ; titre **`formatTitreCompteRenduAccueil`** ; contenu **`ReunionContenuTipTapJson`** rendu par **`ReunionContenuTipTap`** (plus d'extraction texte brut seule).
- **Pull-to-refresh** : tirer vers le bas pour recharger (`useChargementRafraichissable` ou logique dédiée `Home`) ; inclut le **rafraîchissement photo profil** (`rafraichirPhotoProfil`).
- **`CritereTriListeApi`** : `NOM` ou `PRENOM` — ordre d'affichage des listes enfants/équipe, configuré côté web, appliqué côté mobile à l'affichage et au tri.
