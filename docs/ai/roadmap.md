# Roadmap — Enjoy Mobile

Suivi synthétique. Plan détaillé : [`.cursor/plans/migration-api-mobile.plan.md`](../../.cursor/plans/migration-api-mobile.plan.md).

## Fait

- [x] Migration JavaScript → TypeScript.
- [x] Couche API / auth (httpClient, SecureStore, refresh single-flight).
- [x] Bootstrap session + types `api.d.ts`.
- [x] **Phase A** — Suppression Infos utiles, Plannings, groupes en dur, composants Sheets orphelins.
- [x] **Phase B** — Listes (Équipe, Enfants, Groupes, Chambres), Menus, Organisation (+ détail grille), Activités/Sorties, Sanitaire (écran unique API).
- [x] **Phase C** — Nettoyage Sheets (`config/api.ts`, `types/sheets.ts`, `overlaySlice`, clé Google) ; fabrique `creerTopTab` ; titres header dynamiques ; pull-to-refresh global.
- [x] Écran Équipe : recherche, filtres rôle séjour (chip Direction), MultiSelect groupes, modal détail membre (`FichePersonneModal`).
- [x] Écran Enfants : recherche, filtres groupes/genre, modal détail, anniversaire pendant séjour ; modal partagée avec Équipe.
- [x] Écran Groupes : accordéons, filtre par type, croisement groupes âge/niveau dans les listes thématiques.
- [x] Écran Chambres : accordéons (`ListeAccordion`), filtres Type/Genre/Groupe + chip Places dispo, occupants enfants ou équipe.
- [x] Écran Chambres (écriture) : CRUD chambre, affectation/retrait occupants (modales `ChambreFormulaireModal` / `AffecterOccupantsModal`, service chambre complet, helper `chambreOccupantsUtils`).
- [x] Tri des listes enfants/équipe selon réglage séjour API (`triListesEnfants` / `triListesEquipe`) ; hook `useRafraichirSejourCourant` ; helpers `triListesSejour` / `trierUtilisateurs`.
- [x] Plannings organisation : liste tri alpha + recherche ; détail matrice multi-jours (1/3/5) ; édition cellules (`PlanningCelluleModal`, `planningGrilleUtils`, PUT/PATCH API) ; droits directeur/adjoint vs animateur (**par ligne** si libellé membre équipe).
- [x] **Activités calendrier** : grille animateur×jours, fusion sorties prestataires, CRUD modales, filtres, conflits activité/sortie, libellés homonymes (`libelleMembreDansCelluleEquipe`).
- [x] **Sorties — enfants participants** : accordéons liste, filtres date/groupes, modale **`SortieEnfantsParticipantsModal`**, `PUT …/enfants`, helpers effectifs/défaut/conflits.
- [x] Thème centralisé aligné web.
- [x] Règles Cursor app web / API (`30-app-web.mdc`, `40-api.mdc`).

## Reste (mineur)

- [ ] Chambres : référents animateurs et historique modifications (présents web, hors périmètre mobile v1).
- [ ] Remplacer avatars animateurs codés en dur dans `Header.tsx` (photos API ou initiales).
- [ ] Supprimer `Components/DropdownAnim.tsx` et assets `LogosGroupes/` non utilisés.
- [ ] Spike refresh token prod (HTTPS, Android/iOS).
- [ ] Mettre à jour Memory Bank web si besoin de parité doc inter-apps.
