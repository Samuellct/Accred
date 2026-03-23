# CLAUDE.md

Instructions pour Claude Code sur ce projet.

## Projet

Compagnon personnel pour festivals de cinéma ("Accred"). PWA mobile-first, single-user, self-hosted. Spec complète dans `Rapports/seance_spec_v2.md`.

**Nom retenu : Accred.** (ref. accréditation festival)

## Stack

- Next.js 15 (App Router) + TypeScript 5.x
- Tailwind CSS 4.x
- SQLite via better-sqlite3 + Drizzle ORM
- PWA offline-first (next-pwa ou service workers manuels)
- TMDb API v3, proxié via `/api/tmdb/`
- Docker Compose, self-hosted derrière Nginx Proxy Manager

## Commandes

```bash
npm run dev
npm run build
npm run start
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit studio
```

## Architecture

### Routes (App Router)

```
app/
├── (auth)/
├── festivals/[id]/
│   ├── programme/
│   ├── selection/
│   ├── journal/
│   └── stats/
├── archive/
└── api/
    ├── festivals/, seances/, journal/
    └── tmdb/
```

### Modules clés

- `components/festival/` : ProgrammeGrid, SeanceCard, ConflictAlert, NextSeance
- `components/journal/` : QuickNote (mobile, <30s), RatingStars (demi-étoiles), TagPicker
- `lib/db/schema.ts` : schema Drizzle (festivals, films, seances, selections, logs)
- `lib/tmdb.ts` : client TMDb + cache local
- `lib/importers/` : import CSV et JSON
- `lib/letterboxd.ts` : export CSV Letterboxd
- `lib/ics.ts` : export iCalendar

### Modèle de données

- **festivals** : métadonnées (nom, dates, lieu, édition)
- **films** : enrichis via TMDb (poster, synopsis, réalisateur, genres, tmdbId, imdbId)
- **seances** : projection d'un film à un festival (dateTime, salle, section)
- **selections** : séances choisies par l'utilisateur (priorité high/med/low)
- **logs** : entrées de journal (note 0.5-5.0, texte, tags, critique longue, flag Letterboxd)

## Variables d'environnement

```
DATABASE_URL=file:/app/data/app.db
TMDB_API_KEY=
NEXTAUTH_SECRET=
```

## Deadline

**Festival de Cannes 2026 (mi-mai)** — première utilisation réelle d'Accred. La V1 complète doit être déployée sur accred.fr et testée sur mobile avant cette date. Pas de réduction de scope.

## Phases

1. Core : schema Drizzle, CRUD, import CSV + saisie manuelle, enrichissement TMDb
2. Sélection : détection conflits, grille horaire, export ICS
3. Journal mobile : QuickNote, PWA manifest + service worker, Web Push
4. Archive & export : vue multi-festivals, stats, export Letterboxd, éditeur critique markdown
5. Polish : dark theme, tests mobile, documentation déploiement

## Principes de développement

### Code

- Zéro marqueur IA dans les fichiers. Le projet doit paraître 100% personnel.
- Pas de Co-Authored-By dans les commits.
- Pas de commentaires style IA (longues docstrings structurées, listes à puces dans les commentaires).
- Pas de tirets cadratins (--), pas d'emojis décoratifs.
- Commentaires style naturel, informel, mix FR/EN, abréviations OK.
- Des commentaires debug/todo "humains" de temps en temps.
- Messages de commit courts, informels, en FR ou EN, convention Conventional Commits (feat/fix/chore/docs/refactor/test).

### Structure

- Code organisé en modules clairs.
- Pas de sur-abstraction : 3 lignes similaires valent mieux qu'une abstraction prématurée.
- Configuration centralisée, pas de constantes magiques dans le code.

### Design

- Mobile-first absolu. Le cas d'usage critique c'est la prise de note rapide sur téléphone entre deux séances.
- Appareil cible : Samsung Galaxy S21 (Android). Android est la plateforme principale, PWA/Web Push pleinement supportés.
- UI française. Tous les textes, tags, libellés sont en français.
- Tags journal : #émouvant #surprenant #décevant #chef-oeuvre #à-revoir (et autres)

### Charte graphique — "Crème & intime"

Source : `Rapports/accred_charte_3.html`. Direction artistique validée, à respecter dans tous les composants.

**Palette :**
```
--noir:      #1A1714   (fond sombre, header, bouton primaire)
--parchemin: #F7F4EE   (fond cards, surfaces claires)
--creme:     #EDE8DC   (fond body)
--creme-f:   #E4DECE   (variante crème foncée)
--brun:      #3D342A   (texte courant)
--or:        #A67C3D   (accent principal, bordures actives, labels)
--or-chaud:  #C9985A   (accent secondaire, point logo, hover)
--gris-c:    #8C8070   (métadonnées, inactif)
```

**Typographie :**
- Titres : `Playfair Display` 400 (normal + italic) — noms de films, logo, titres de section
- Corps : `DM Sans` 300/400/500 — navigation, labels, boutons, texte courant

**Esprit :** carnet de notes festival, élégant et intimiste. Pas de border-radius agressifs, pas de couleurs saturées. Animations subtiles (0.15s). Référence visuelle : le site du Festival de Cannes.

### Tests

- Tests unitaires sur la logique métier (détection conflits, calculs stats, parsers import).
- CI GitHub Actions : tests à chaque push et PR.
- CD : si CI passe, semantic-release génère un tag + met à jour CHANGELOG.md.
- Convention commits : Conventional Commits obligatoire pour que semantic-release fonctionne.

### Documentation

- Mettre à jour `docs/` au fil des phases.
