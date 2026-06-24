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
| Profil | `GET /utilisateurs/profil?tokenId=`, `GET /utilisateurs/{tokenId}/photo-profil` | Bootstrap, `Home`, `Animators` (coordonnées directeur) |
| Séjours | `GET /sejours/utilisateur/{tokenId}`, `GET /sejours/{id}` | `SejourPicker`, `Home`, `Animators` (refresh) |
| Réunions | `GET /sejours/{sejourId}/reunions` | `Home` (CR veille) |
| Enfants | `GET /sejours/{id}/enfants` | `Children` |
| Groupes | `GET /sejours/{id}/groupes` | `Groups`, `Animators` (filtre + modal), résolution libellés (Activités, Sorties, GrilleDetail) |
| Chambres | `GET /sejours/{id}/chambres` | `Bedrooms`, `Animators` (modal chambre occupant) |
| Menus | `GET /sejours/{id}/menus?dateDebut&dateFin` | `Menus` |
| Plannings | `GET /sejours/{id}/planning-grilles`, `GET …/{grilleId}` | `Organisation`, `GrilleDetail` |
| Réf. planning | `GET …/moments`, `…/lieux`, `…/horaires` | `GrilleDetail` (résolution libellés) |
| Activités | `GET /sejours/{id}/activites` | `Activites` |
| Sorties | `GET /sejours/{id}/activites-prestataires` | `Sorties` |
| Sanitaire | `GET /sejours/{id}/dossiers-enfants` | `Sanitaire` |

> Équipe (`Animators`) : données `directeur` + `equipe` dans `SejourDTO` (store) ; refresh via `getSejourById`. Compléments : groupes/chambres du séjour, profil directeur si absent de `equipe`. Chaque membre d'équipe porte `roleSejour` ; le directeur (champ séparé, sans `roleSejour`) est rattaché au filtre chip **Direction** avec les adjoints.

## Services (`services/`)

| Fichier | Rôle |
|---------|------|
| `httpClient.ts` | Client axios + intercepteurs auth |
| `account.service.ts` | Login, logout, profil, restoreSession |
| `accountStorage.ts` / `tokenStorage.ts` | SecureStore |
| `sejour.service.ts` | Séjours utilisateur et détail |
| `sejour-reunion.service.ts` | Réunions (CR veille) |
| `utilisateur.service.ts` | Profil par `tokenId`, photo profil |
| `enfant.service.ts` | Enfants du séjour |
| `groupe.service.ts` | Groupes |
| `chambre.service.ts` | Chambres |
| `menu.service.ts` | Menus repas |
| `planningGrille.service.ts` | Grilles planning (liste + détail) |
| `moment.service.ts`, `lieu.service.ts`, `horaire.service.ts` | Référentiels planning |
| `activite.service.ts`, `activitePrestataire.service.ts` | Activités internes et sorties |
| `dossierEnfant.service.ts` | Fiches sanitaires agrégées |

## Helpers (`helpers/`)

| Fichier | Rôle |
|---------|------|
| `axiosError.ts` | Messages d'erreur utilisateur |
| `dateApi.ts` | Normalisation dates API (ISO, timestamp, tableau Jackson) |
| `menuRepas.ts` | Types repas, ordre, alias date menu |
| `dernierSejour.ts` | Dernier séjour visité (SecureStore) |
| `sejourPeriode.ts` | Formatage périodes séjour |
| `reunionVeille.ts`, `reunionTipTapTexte.ts` | CR réunion J−1 (`Home`) |
| `photoProfil.ts` | Blob photo profil |
| `roleSejour.ts` | Libellés rôle séjour : courts (chips) + longs adaptés au genre (badge) |

## Glossaire

- **`tokenId`** : identifiant public utilisateur (claim `sub` du JWT).
- **Bootstrap** : restauration session au démarrage → profil + dernier séjour → route initiale.
- **Single-flight** : un seul refresh token concurrent.
- **Compte rendu de la veille** : dernière réunion à J−1, affichée sur `Home`.
- **Pull-to-refresh** : tirer vers le bas pour recharger (`useChargementRafraichissable` ou logique dédiée `Home` / `Animators`).
