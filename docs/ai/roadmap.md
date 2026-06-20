# Roadmap — Enjoy Mobile

Suivi synthétique. Le plan détaillé (phases, correspondances écran → API, spike refresh) vit dans [`.cursor/plans/migration-api-mobile.plan.md`](../../.cursor/plans/migration-api-mobile.plan.md).

## Fait

- [x] Migration JavaScript → TypeScript (navigateurs, écrans, services).
- [x] Couche API / auth : `httpClient.ts`, `account.service.ts`, stockage SecureStore, refresh single-flight + proactif.
- [x] Bootstrap session (restauration profil + dernier séjour) dans `BottomTabNavigator`.
- [x] Types `types/api.d.ts` alignés sur l’API.
- [x] Écran Connexion + sélection séjour (`Login`, `SejourPicker`) sur API.

## À faire (migration Sheets → API)

- [ ] **Phase 0** — finaliser fondations : spike cookie refresh (Android/iOS Expo Go), `EXPO_PUBLIC_API_URL` en HTTPS prod.
- [ ] **Phase 1** — Accueil (`Home`) : profil + compte rendu de la réunion de la veille (`/sejours/{id}/reunions`).
- [ ] **Phase 2** — Listes + Sanitaire via GET enfants / groupes / chambres / dossiers-enfants.
- [ ] **Phase 3** — Plannings (grilles + menus) et Activités (internes + prestataires).
- [ ] **Phase 4** — Infos : `Regulations`, `Weather` ; `UsefulNumbers` laissé en Sheets (hors scope v1).
- [ ] **Phase 5** — Nettoyage : retirer Google Sheets (sauf `UsefulNumbers`) et les photos animateurs hardcodées.
