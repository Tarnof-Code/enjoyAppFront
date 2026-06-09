# Enjoy Mobile App — consignes pour l’agent

## Commits Git

Tous les messages de commit doivent être **en français**, en **une seule phrase synthétique**.

Commencer par un **nom**, pas un verbe : `Correction de…`, `Renommage de…`, `Migration vers…` — pas `Corriger…`, `Renommer…`, `Migrer…`.

Exemple : `Renommage des exports des écrans WakeUp, EatingHealth, Animators et Bedrooms`

### Bouton ✨ « Generate commit message » (Source Control)

Les règles `.cursor/rules/` et `User Rules` **ne s’appliquent pas** à ce bouton (limitation Cursor).

Ce qui fonctionne pour ce bouton :

1. **[`.cursorrules`](.cursorrules)** à la racine du repo (legacy, lu par la génération SCM)
2. **Historique Git en français** — après quelques commits manuels en français, Cursor tend à suivre le style
3. **Hook Git** (optionnel, bloque les commits en anglais) :

```bash
git config core.hooksPath .githooks
```

Sous Windows Git Bash, rendre le hook exécutable si besoin :

```bash
chmod +x .githooks/commit-msg
```
