# Roadmap — Enjoy Mobile

Suivi synthétique. Plan détaillé : [`.cursor/plans/migration-api-mobile.plan.md`](../../.cursor/plans/migration-api-mobile.plan.md).

## Fait

- [x] Migration JavaScript → TypeScript.
- [x] Couche API / auth (httpClient, SecureStore, refresh single-flight).
- [x] Bootstrap session + types `api.d.ts`.
- [x] **Phase A** — Suppression Infos utiles, Plannings, groupes en dur, composants Sheets orphelins.
- [x] **Phase B** — Listes (Équipe, Enfants, Groupes, Chambres), Menus, Organisation (+ détail grille), Activités/Sorties, Sanitaire (écran unique API).
- [x] **Phase C** — Nettoyage Sheets (`config/api.ts`, `types/sheets.ts`, `overlaySlice`, clé Google) ; fabrique `creerTopTab` ; titres header dynamiques ; pull-to-refresh global.
- [x] Thème centralisé aligné web.
- [x] Règles Cursor app web / API (`30-app-web.mdc`, `40-api.mdc`).

## Reste (mineur)

- [ ] Remplacer avatars animateurs codés en dur dans `Header.tsx` (photos API ou initiales).
- [ ] Supprimer `Components/DropdownAnim.tsx` et assets `LogosGroupes/` non utilisés.
- [ ] Spike refresh token prod (HTTPS, Android/iOS).
- [ ] Mettre à jour Memory Bank web si besoin de parité doc inter-apps.
