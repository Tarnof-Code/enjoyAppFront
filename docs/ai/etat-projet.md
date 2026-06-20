# État projet — services, contrat API, glossaire

Inventaire factuel. Pour les patterns, voir [decisions-architecturales.md](decisions-architecturales.md).

## Contrat API (alignement enjoyApi / enjoyWebApp)

- Base : `/api/v1`, JWT **Bearer**, `withCredentials: true` (refresh/logout).
- Types DTO dans `types/api.d.ts`, à garder synchronisés avec `enjoyWebApp/src/types/api.d.ts`.
- Référence utilisateur : **`tokenId`** (jamais id SQL).

### Endpoints utilisés / cibles (mobile)

| Domaine | Endpoint | Usage mobile |
|---------|----------|--------------|
| Auth | `POST /auth/connexion` | Connexion (email + mot de passe) |
| Auth | `POST /auth/refresh-token` | Rafraîchissement (single-flight ; `X-Client-Type: mobile`) |
| Auth | `POST /auth/logout` | Déconnexion |
| Profil | `GET /utilisateurs/profil?tokenId=…` | Profil courant (`ProfilUtilisateurDTO`) |
| Profil | `GET /utilisateurs/{tokenId}/photo-profil` | Photo (blob + JWT) — cible |
| Séjours | `GET /sejours/utilisateur/{tokenId}` | Séjours de l’utilisateur (sélection) — cible |
| Séjour | `GET /sejours/{id}` | Détail séjour courant |
| Réunions | `GET /sejours/{sejourId}/reunions` | Compte rendu de la veille (`Home`) — cible |

> Listes / Plannings / Activités / Sanitaire : endpoints enfants, groupes, chambres, dossiers-enfants, activités, grilles — voir le plan de migration pour la correspondance écran → API.

## Services (`services/`)

| Fichier | Rôle |
|---------|------|
| `httpClient.ts` | Client axios + intercepteurs auth (refresh, 401), `loginRequest`, `logoutRequest` |
| `account.service.ts` | `login`, `logout`, `fetchProfil`, `restoreSession`, messages d’erreur de connexion |
| `accountStorage.ts` | Stockage session (access/refresh token, `tokenId`, expiry), `clearLocalSession` |
| `tokenStorage.ts` | Accès bas niveau `expo-secure-store` |
| `sejour.service.ts` | Récupération séjour(s) |
| `sejour-reunion.service.ts` | Réunions / compte rendu veille |
| `utilisateur.service.ts` | Données utilisateur / photo profil |

## Helpers (`helpers/`)

- `axiosError.ts` — `getApiErrorMessage` (extraction message backend).
- `dernierSejour.ts` — mémorisation/lecture du dernier séjour visité (par `tokenId`).
- `photoProfil.ts` — récupération de la photo de profil (blob).
- `reunionVeille.ts` — sélection de la réunion J−1 (timezone Europe/Paris).
- `reunionTipTapTexte.ts` — rendu texte du contenu TipTap des réunions.

## Glossaire

- **`tokenId`** : identifiant public utilisateur (claim `sub` du JWT).
- **Bootstrap** : restauration de session au démarrage (`BottomTabNavigator`) → profil + dernier séjour → route initiale.
- **Single-flight** : garantie d’un seul refresh token concurrent.
- **Compte rendu de la veille** : dernière réunion (`id` max) à la date J−1, affichée sur `Home`.
- **Animateur (`BASIC_USER`)** : utilisateur cible mobile, accès en lecture aux séjours dont il est membre d’équipe.
