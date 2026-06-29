# Roadmap — Enjoy Mobile

Suivi synthétique. Plan détaillé : [`.cursor/plans/migration-api-mobile.plan.md`](../../.cursor/plans/migration-api-mobile.plan.md).

## Fait

- [x] Migration JavaScript → TypeScript.
- [x] Couche API / auth (httpClient, SecureStore, refresh single-flight).
- [x] Bootstrap session + types `api.d.ts`.
- [x] **Phase A** — Suppression Infos utiles, Plannings, groupes en dur, composants Sheets orphelins.
- [x] **Phase B** — Listes (Équipe, Enfants, Groupes, Chambres), Menus, Organisation (+ détail grille), Activités/Sorties, Sanitaire (top-tabs Dossiers sanitaires + Cahier d'infirmerie CRUD).
- [x] **Phase C** — Nettoyage Sheets (`config/api.ts`, `types/sheets.ts`, `overlaySlice`, clé Google) ; fabrique `creerTopTab` ; titres header dynamiques ; pull-to-refresh global.
- [x] Écran Équipe : recherche, filtres rôle séjour (chip Direction), MultiSelect groupes, photos profil (**`AvatarProfil`**, **`usePhotosProfilEquipe`**), modal détail avec photo zoomable (`FichePersonneModal`).
- [x] Écran Enfants : recherche, filtres groupes/genre, modal détail, anniversaire pendant séjour ; modal partagée avec Équipe.
- [x] Écran Groupes : accordéons, filtre par type, croisement groupes âge/niveau dans les listes thématiques.
- [x] Écran Chambres : accordéons (`ListeAccordion`), filtres Type/Genre/Groupe + chip Places dispo, occupants enfants ou équipe.
- [x] Écran Chambres (écriture) : CRUD chambre, affectation/retrait occupants (modales `ChambreFormulaireModal` / `AffecterOccupantsModal`, service chambre complet, helper `chambreOccupantsUtils`).
- [x] Tri des listes enfants/équipe selon réglage séjour API (`triListesEnfants` / `triListesEquipe`) ; hook `useRafraichirSejourCourant` ; helpers `triListesSejour` / `trierUtilisateurs`.
- [x] Plannings organisation : liste tri alpha + recherche ; détail matrice multi-jours (1/3/5) ; édition cellules (`PlanningCelluleModal`, `planningGrilleUtils`, PUT/PATCH API) ; droits directeur/adjoint vs animateur (**par ligne** si libellé membre équipe).
- [x] **Activités calendrier** : grille animateur×jours, fusion sorties prestataires, CRUD modales, filtres, conflits activité/sortie, libellés homonymes (`libelleMembreDansCelluleEquipe`).
- [x] **Sorties — enfants participants** : accordéons liste, filtres date/groupes, modale **`SortieEnfantsParticipantsModal`**, `PUT …/enfants`, helpers effectifs/défaut/conflits.
- [x] **Sanitaire — cahier d'infirmerie** : `TopTabSanitaire`, CRUD entrées (service + modale + droits), parsing dates API epoch s/ms, `@react-native-community/datetimepicker`.
- [x] Thème centralisé aligné web.
- [x] Règles Cursor app web / API (`30-app-web.mdc`, `40-api.mdc`).
- [x] **Mon profil** : écran **`Profil`** (édition infos, mot de passe, photo API) ; avatar **`Header`** / **`Home`** depuis Redux ; recadrage **`PhotoProfilRecadrageModal`**, zoom **`PhotoProfilZoomModal`** ; refresh photo au pull-to-refresh.
- [x] **Politique mot de passe** : helper **`passwordPolicy.ts`** aligné enjoyApi **`PasswordPolicy`** ; **`ChangePasswordModal`** + **`regexValidation.validatePassword`**.
- [x] **Accueil** : refonte UI (dégradé, **`GlassPanel`**, **`AvatarProfil`**) ; CR veille TipTap natif ; **`Login`** fond dégradé, formulaire classique.
- [x] **Séjour sur accueil** : suppression **`SejourPicker`** ; connexion sans séjour ; onglets bottom conditionnels ; choix via modal **`Home`**.
- [x] **Fond UI listes / orga / sanitaire** : **`EcranListeFond`**, **`ListeEcranLayout`** (filtres fixes, fond uni **`background`**) ; modales chambre/cahier/affectation (feuille grise, champs blancs) ; **`GrilleDetail`** section haute blanche.
- [x] **Sanitaire — dossier enfant modale** : tap carte **`DossierSanitaire`** → **`DossierEnfantModal`** (consultation seule, `GET …/dossier` ; édition réservée au web).
- [x] **UI navigation** : **`Header`** compact ; barres top-tabs homogènes (**`barreOngletsCompacte`**) ; bande recherche Organisation dissociée ; icônes app régénérées (`scripts/generate-app-icons.cjs`, splash sur `icon.png`).

## Reste (mineur)

- [ ] Cahier d'infirmerie : historique des modifications et impression (présents web, hors périmètre mobile).
- [ ] Chambres : référents animateurs et historique modifications (présents web, hors périmètre mobile v1).
- [ ] Supprimer `Components/DropdownAnim.tsx` et assets `LogosGroupes/` non utilisés.
- [ ] Spike refresh token prod (HTTPS, Android/iOS).
- [ ] Mettre à jour Memory Bank web si besoin de parité doc inter-apps.
