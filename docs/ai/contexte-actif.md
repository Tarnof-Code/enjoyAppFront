# Contexte actif — phase courante & journal

> Journal factuel et daté. Garder les entrées courtes ; le détail technique va dans [decisions-architecturales.md](decisions-architecturales.md) et [etat-projet.md](etat-projet.md).

## Phase courante

**Migration Sheets → API largement terminée** (phases A/B/C du plan `.cursor/plans/migration-api-mobile.plan.md`). L'app mobile reflète la structure du web : 6 onglets bas, données via l'API Enjoy, plus de Google Sheets.

Reste mineur : photos animateurs codées en dur dans `Header.tsx`, composant orphelin `DropdownAnim.tsx`, assets `LogosGroupes/` non référencés, spike refresh token en prod (HTTPS).

## Journal

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
