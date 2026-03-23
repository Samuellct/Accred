# TO_DO_V1.md — Feuille de route Accred V1

Deadline : Festival de Cannes 2026, mi-mai. ~7-8 semaines de dev.

Chaque phase est conçue pour être exécutée par Claude Code de façon autonome.
Fin de phase = build local qui passe + tests OK + push conventionnel sur GitHub.

---

## Phase 0 — Conventions (référence permanente)

A relire avant chaque session de travail.

### Commits

Format Conventional Commits strict (semantic-release en dépend) :

```
feat: ajouter page sélection festival
fix: corriger calcul conflits avec buffer
chore: mise à jour deps
refactor: extraire logique import CSV
test: tests parsers colonnes manquantes
docs: deployment.md première version
```

- Commits granulaires, un sujet par commit
- Messages courts, FR ou EN, pas de tirets cadratins
- `[skip tests]` dans le message si on veut bypass les tests CI (lint + build tournent quand même)
- Release manuelle uniquement : `gh workflow run release.yml`

### Code

- Zéro marqueur IA. Le code doit sembler 100% écrit par un dev humain.
- Commentaires naturels, informels, mix FR/EN — pas de docstrings structurées
- Pas d'emojis, pas de tirets cadratins (`--`)
- Pas de sur-abstraction : 3 lignes similaires > abstraction prématurée
- Constantes dans des fichiers de config, pas en dur dans le code

### Design

- Charte "Crème & intime" — palette ci-dessous, fonts Playfair Display + DM Sans
- `--noir: #1A1714` / `--parchemin: #F7F4EE` / `--creme: #EDE8DC`
- `--or: #A67C3D` / `--or-chaud: #C9985A` / `--brun: #3D342A` / `--gris-c: #8C8070`
- Zéro border-radius (sauf si explicitement justifié)
- Mobile-first absolu — device cible : Samsung Galaxy S21 (Android)
- Textes UI en français

### Tests

- Vitest sur la logique métier uniquement : parsers, conflits, stats, ICS, Letterboxd
- Pas de tests sur les composants React (pas de Testing Library)
- `npm run test` doit passer avant chaque push de fin de phase

### Fin de phase standard

```bash
npm run build       # doit passer sans erreur
npm run lint        # zéro warning/erreur
npm test            # si des tests existent pour cette phase
git add <fichiers>
git commit -m "feat: ..."
git push
```

---

## Phase 1 — Init projet

**Semaine 1 — objectif : 24-26 mars**

Créer la base du projet Next.js avec la stack complète et la charte graphique intégrée.

### Tâches

1. Initialiser le projet Next.js 15 avec TypeScript et Tailwind CSS 4 :
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --src-dir=no --import-alias="@/*"
   ```

2. Configurer les design tokens dans `tailwind.config.ts` :
   - Couleurs de la charte (voir Phase 0)
   - Fonts : Playfair Display (titres) + DM Sans (corps)
   - `borderRadius: {}` pour désactiver les radius par défaut

3. Installer les dépendances core :
   ```bash
   npm install better-sqlite3 drizzle-orm
   npm install -D drizzle-kit @types/better-sqlite3
   npm install next-auth@beta
   npm install vitest @vitejs/plugin-react
   ```

4. Créer la structure de dossiers :
   ```
   app/
   ├── (auth)/login/
   ├── festivals/[id]/
   │   ├── programme/
   │   ├── selection/
   │   ├── journal/
   │   └── stats/
   ├── archive/
   └── api/
   components/
   ├── ui/           (Button, Input, Card, etc.)
   ├── festival/     (ProgrammeGrid, SeanceCard, etc.)
   └── journal/      (QuickNote, RatingStars, TagPicker)
   lib/
   ├── db/           (schema, connexion)
   ├── importers/    (CSV, JSON)
   └── ...
   public/
   └── templates/
   docs/
   ```

5. Configurer `app/layout.tsx` avec les fonts Google (next/font) et les variables CSS de la charte

6. Créer `.env.example` :
   ```
   DATABASE_URL=file:./data/app.db
   TMDB_API_KEY=
   NEXTAUTH_SECRET=
   AUTH_PASSWORD=
   ```

7. Mettre à jour `.gitignore` : exclure `/data/`, `/public/posters/`

8. Configurer Vitest (`vitest.config.ts`) avec path aliases

### Vérification

```bash
npm run dev    # page d'accueil Next.js par défaut, pas d'erreur console
npm run build  # build prod qui passe
npm run lint   # zéro erreur
```

### Commit de fin de phase

```
feat: init Next.js 15 + Tailwind 4 + design tokens + structure dossiers
```

---

## Phase 2 — Schema DB + migrations

**Semaine 1 — objectif : 26-27 mars**

Définir le modèle de données complet et créer la migration initiale.

### Tâches

1. Créer `lib/db/schema.ts` avec les tables Drizzle :
   - `users` : id, email, passwordHash, createdAt
   - `festivals` : id, name, location, edition, startDate, endDate, status (upcoming/active/done), createdAt
   - `films` : id, title, originalTitle, director, year, duration, genres, countries, synopsis, posterPath, tmdbId, imdbId, createdAt
   - `seances` : id, festivalId, filmId, dateTime, venue, section, format (FK vers festivals + films)
   - `selections` : id, userId, seanceId, priority (high/med/low), createdAt — userId toujours 1 en V1
   - `logs` : id, userId, filmId, festivalId, rating, text, longCritique, tags, letterboxdExported, seenAt, createdAt
   - `settings` : key, value (table clé/valeur pour config app)

2. Créer `lib/db/index.ts` : connexion singleton better-sqlite3, WAL mode, foreign keys activées

3. Configurer `drizzle.config.ts`

4. Générer et appliquer la migration initiale :
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

5. Créer `lib/db/seed.ts` : utilisateur admin (id=1) + festival de test "Cannes 2026"

6. Script npm pour le seed : `"db:seed": "tsx lib/db/seed.ts"`

### Vérification

```bash
npm run db:seed     # pas d'erreur, DB créée dans ./data/
npx drizzle-kit studio   # tables visibles dans le studio
npm run build
```

### Commit de fin de phase

```
feat: schema Drizzle complet + migration + seed
```

---

## Phase 3 — Auth NextAuth v5

**Semaine 1 — objectif : 27-28 mars**

Authentification single-user avec mot de passe en `.env`, session persistante 30 jours.

### Tâches

1. Configurer NextAuth v5 (`auth.ts` à la racine) :
   - Provider Credentials
   - Mot de passe comparé via `bcryptjs` avec le hash stocké dans `.env` (ou généré au setup)
   - Session JWT, maxAge 30 jours

2. Créer `app/api/auth/[...nextauth]/route.ts`

3. Page login `app/(auth)/login/page.tsx` :
   - Background parchemin, logo Accred centré en Playfair Display
   - Un seul input password + bouton "Entrer"
   - Message d'erreur simple si mot de passe incorrect
   - Pas de champ email (single-user)

4. Middleware `middleware.ts` :
   - Protéger toutes les routes sauf `/login` et `/api/auth/`
   - Redirect vers `/login` si pas de session

5. Header minimal `components/layout/Header.tsx` :
   - Logo "Accred" (Playfair Display, lien vers `/`)
   - Bouton déconnexion discret (texte ou icône)

### Vérification

```bash
npm run dev
# naviguer vers / → redirect /login
# entrer le bon mot de passe → accès
# F5 → toujours connecté (session 30j)
npm run build
```

### Commit de fin de phase

```
feat: auth NextAuth v5 credentials + page login + middleware
```

---

## Phase 4 — Festival CRUD + navigation

**Semaine 2 — objectif : 28 mars - 2 avril**

Navigation deux niveaux et layout responsive complet.

### Tâches

1. API routes festivals `app/api/festivals/` :
   - GET `/api/festivals` — liste tous les festivals
   - POST `/api/festivals` — créer festival
   - PATCH `/api/festivals/[id]` — modifier
   - DELETE `/api/festivals/[id]` — supprimer (cascade sur séances, sélections, logs)

2. Page Niveau 1 `app/page.tsx` (sélection festival) :
   - Liste des festivals avec statut visuel (à venir / en cours / terminé)
   - Compteurs rapides (nb séances, nb sélections)
   - Bouton "Nouveau festival" → modal ou page dédiée
   - Design : fond parchemin, cards beige/crème, statut en couleur or

3. Page Niveau 2 `app/festivals/[id]/layout.tsx` :
   - Header festival : nom + badge édition + bouton retour (= badge cliquable "Cannes 2026")
   - Stats rapides dans le header (nb séances, nb sélectionnées)
   - Bottom nav mobile + sidebar desktop (voir ci-dessous)

4. `components/layout/BottomNav.tsx` (mobile uniquement) :
   - 5 icônes : Programme / Sélection / **Note** (central, accentué or) / Journal / Stats
   - Active state avec couleur or
   - Bouton Note central légèrement plus grand

5. `components/layout/Sidebar.tsx` (desktop >=768px) :
   - Navigation verticale gauche avec les mêmes 5 sections
   - Largeur fixe ~200px, fond brun sombre

6. Layout responsive : `md:hidden` sur BottomNav, `hidden md:flex` sur Sidebar

7. Composants UI de base :
   - `components/ui/Button.tsx` : 3 variantes (primary or, secondary outline, ghost)
   - `components/ui/Input.tsx` : style charte, fond crème, pas de border-radius
   - `components/ui/Card.tsx` : conteneur simple avec fond crème/parchemin

### Vérification

```bash
npm run dev
# créer un festival via l'UI
# naviguer dans le festival → layout deux-niveaux visible
# mobile : bottom nav visible, sidebar cachée
# desktop (768px+) : sidebar visible, bottom nav caché
npm run build && npm run lint
```

### Commit de fin de phase

```
feat: festival CRUD + navigation deux niveaux + layout responsive
```

---

## Phase 5 — Import séances + TMDb

**Semaines 2-3 — objectif : 2-9 avril** ⚠️ DEADLINE CRITIQUE

Le programme PDF de Cannes est disponible début/mi-avril. Le template CSV doit être prêt avant.

### Tâches

#### Parsers import

1. `lib/importers/csv.ts` : parser CSV avec validation
   - Colonnes attendues : `titre`, `date`, `heure`, `salle`, `section`, `duree` (optionnel)
   - Gestion encodage UTF-8 et CSV avec points-virgules
   - Retourne `{ valid: SeanceRow[], errors: ImportError[] }`

2. `lib/importers/json.ts` : parser JSON (format à définir, plus souple)

3. Tests `lib/importers/__tests__/` :
   - Colonnes manquantes → erreur explicite
   - Dates invalides → erreur avec numéro de ligne
   - Encodage caractères spéciaux
   - Fichier vide

4. Template CSV `public/templates/import_seances.csv` avec exemple commenté
5. Doc `docs/import-format.md` expliquant les formats acceptés

#### Client TMDb

6. `lib/tmdb.ts` :
   - `searchFilm(title, year?)` → liste de résultats
   - `getFilmDetails(tmdbId)` → données complètes (genres, pays, synopsis, etc.)
   - `downloadPoster(posterPath, filmId)` → sauvegarde dans `public/posters/`
   - Cache : stocker les réponses TMDb dans la table `films` pour éviter les re-requêtes

7. API proxy `app/api/tmdb/[...path]/route.ts` : transférer les requêtes vers TMDb en ajoutant la clé API côté serveur

8. Tests `lib/__tests__/tmdb.test.ts` avec mocks fetch (pas d'appels réels en test)

#### API routes séances

9. `app/api/festivals/[id]/seances/` :
   - GET : liste des séances du festival
   - POST : créer une séance (saisie manuelle)
   - POST `/import` : import batch (CSV ou JSON parsé)

#### UI import

10. Page `app/festivals/[id]/import/page.tsx` :
    - 3 onglets : CSV / JSON / Saisie manuelle
    - Upload fichier → preview du tableau (20 premières lignes) → erreurs listées → bouton "Importer"
    - Saisie manuelle : champs titre/date/heure/salle/section + autocomplétion TMDb (recherche en temps réel)
    - Lien pour télécharger le template CSV

11. Page de revue TMDb `app/festivals/[id]/import/review/page.tsx` :
    - Liste des séances importées sans correspondance TMDb confirmée
    - Pour chaque film : résultats de recherche TMDb avec poster, titre original, année
    - Actions : confirmer correspondance / corriger / ignorer (import sans TMDb)

### Vérification

```bash
npm test    # parsers + TMDb mocks passent
npm run dev
# importer un CSV de test avec quelques séances
# vérifier preview et gestion d'erreurs
# confirmer enrichissement TMDb sur 2-3 films
# vérifier posters téléchargés dans public/posters/
npm run build && npm run lint
```

### Commit de fin de phase

```
feat: import CSV/JSON + client TMDb + UI import + template
```

---

## Phase 6 — Programme + sélection + conflits + ICS

**Semaines 3-4 — objectif : 9-18 avril**

Le coeur fonctionnel de l'app pendant le festival.

### Tâches

#### Programme

1. Page `app/festivals/[id]/programme/page.tsx` :
   - Vue liste par défaut : groupée par jour, onglets jours en haut
   - Filtre par salle, section, films déjà sélectionnés
   - Recherche titre/réalisateur
   - `SeanceCard` : poster miniature, titre, heure, salle, durée, bouton +/✓

2. Vue grille desktop `components/festival/ProgrammeGrid.tsx` :
   - Grille CSS : heures en Y, salles en X
   - Affichée uniquement sur >=768px
   - Blocs colorés selon statut sélection

3. Page fiche film `app/festivals/[id]/films/[filmId]/page.tsx` :
   - Poster en header sombre (fond noir, image en dégradé)
   - Infos : titre, réalisateur, année, durée, pays, genres, synopsis
   - Liste des séances du film dans ce festival
   - Bouton sélection sur chaque séance

#### Sélection et conflits

4. `lib/conflicts.ts` :
   - `detectConflicts(selections, allSeances)` : chevauchement strict + buffer configurable (défaut 20min)
   - `suggestAlternative(conflictSeance, allSeances, selections)` : trouver une séance du même film sans conflit
   - Gestion durée inconnue : considérer comme conflit si overlap possible

5. Tests `lib/__tests__/conflicts.test.ts` :
   - Chevauchement exact (même heure)
   - Chevauchement avec buffer (film se terminant 10min avant le suivant)
   - Durée inconnue
   - Pas de conflit (séances le même jour mais pas de chevauchement)

6. API routes sélections `app/api/festivals/[id]/selections/` :
   - GET : liste des sélections avec séances et films joints
   - POST : ajouter sélection (retourner conflits détectés)
   - DELETE : retirer sélection
   - PATCH : modifier priorité

7. Page `app/festivals/[id]/selection/page.tsx` :
   - Timeline verticale par jour : barre or à gauche (sélection confirmée), barre rouge (conflit)
   - Badges priorité : haute / moyenne / basse
   - `ConflictAlert` : alerte inline avec suggestion alternative
   - Bouton export ICS en haut

#### Export ICS

8. `lib/ics.ts` :
   - `generateICS(selections, seances, films)` → string au format iCal
   - Chaque événement : titre du film, salle, section, heure début/fin
   - UID stable basé sur seanceId

9. Tests `lib/__tests__/ics.test.ts` : format ICS valide, accents gérés

10. `app/api/festivals/[id]/selections/export.ics/route.ts` : retourner le fichier ICS avec les bons headers

### Vérification

```bash
npm test    # conflits + ICS passent
npm run dev
# naviguer dans le programme, sélectionner 3-4 séances
# vérifier détection conflit (sélectionner deux séances qui se chevauchent)
# vérifier suggestion alternative
# exporter l'ICS et l'importer dans Google Calendar
npm run build && npm run lint
```

### Commit de fin de phase

```
feat: programme + sélection + détection conflits + export ICS
```

---

## Phase 7 — Journal mobile + QuickNote + PWA + Web Push

**Semaines 4-5 — objectif : 18-28 avril**

L'expérience mobile du festival : noter vite, recevoir des rappels.

### Tâches

#### Journal et composants mobiles

1. API routes `app/api/journal/` :
   - GET `/api/festivals/[id]/journal` : logs du festival, triés par date
   - POST : créer un log
   - PATCH `/api/journal/[logId]` : modifier (note, tags, critique, flag letterboxd)

2. `components/journal/RatingStars.tsx` :
   - Demi-étoiles (0.5 à 5.0), 10 états
   - Tap zones >=44px (accessibilité mobile)
   - Couleur or (`--or-chaud`) pour les étoiles remplies
   - Cliquer à gauche d'une étoile = demi, à droite = entière

3. `components/journal/TagPicker.tsx` :
   - Tags prédéfinis : `#émouvant` `#surprenant` `#décevant` `#chef-oeuvre` `#à-revoir` + custom
   - Toggle tap (on/off), affichage en chips
   - Ajout tag custom : input text simple

4. `components/journal/QuickNote.tsx` :
   - Objectif : noter un film en <30 secondes
   - Un seul écran : poster en header compact, RatingStars, TagPicker, textarea (optionnel)
   - Bouton "Enregistrer" bien visible, feedback haptic si possible
   - Ouvrable depuis le BottomNav (bouton Note central)

5. Page journal `app/festivals/[id]/journal/page.tsx` :
   - Liste chronologique des films vus
   - Badge "Non noté" sur les films vus (sélection passée) sans log
   - Tap sur un film → ouvre QuickNote ou page d'édition complète

6. Widget `components/festival/NextSeance.tsx` :
   - Prochain film sélectionné avec countdown (HH:MM:SS)
   - Bouton "Vu + Note" apparaît quand la séance est terminée
   - Affiché en haut du dashboard festival

#### PWA

7. `public/manifest.json` :
   - name: "Accred", short_name: "Accred"
   - theme_color: #1A1714, background_color: #F7F4EE
   - Icons 192x192 + 512x512
   - display: standalone, orientation: portrait

8. Service worker `public/sw.js` :
   - Cache-first pour assets statiques et posters
   - Network-first pour les API calls
   - Pre-cache app shell (layout, navigation)

9. Enregistrement SW dans `app/layout.tsx`

#### Web Push

10. Générer les clés VAPID et les ajouter à `.env.example` :
    ```
    VAPID_PUBLIC_KEY=
    VAPID_PRIVATE_KEY=
    VAPID_EMAIL=
    ```

11. `app/api/push/subscribe/route.ts` : enregistrer une subscription PushSubscription en DB

12. `app/api/push/notify/route.ts` : envoyer une notification (usage interne/test)

13. Scheduler côté client dans `NextSeance` : `setTimeout` pour envoyer une notification 15min avant chaque séance sélectionnée du jour

14. Notification post-séance : déclencher "Film terminé — veux-tu le noter ?" après l'heure de fin estimée

### Vérification

```bash
npm run dev
# ouvrir sur mobile (Samsung S21 via réseau local ou ngrok)
# ajouter à l'écran d'accueil → PWA installée
# sélectionner une séance → noter un film via QuickNote (<30s chrono)
# vérifier le widget NextSeance avec countdown
# activer les notifications push et vérifier la réception
npm run build && npm run lint
```

### Commit de fin de phase

```
feat: journal mobile + QuickNote + PWA manifest + service worker + web push
```

---

## Phase 8 — Critique longue + export Letterboxd + stats

**Semaines 5-6 — objectif : 28 avril - 6 mai**

Post-festival : critique développée, export vers Letterboxd, statistiques.

### Tâches

#### Éditeur critique

1. Page `app/festivals/[id]/journal/[logId]/edit/page.tsx` :
   - Version complète du log : QuickNote résumé en haut (modifier note/tags)
   - Éditeur critique markdown : textarea à gauche, preview `react-markdown` à droite (desktop) / toggle (mobile)
   - Flag "Exporter vers Letterboxd"
   - Bouton "Enregistrer"

2. Installer `react-markdown`

#### Export Letterboxd

3. `lib/letterboxd.ts` :
   - `generateLetterboxdCSV(logs)` → string CSV au format Letterboxd
   - Colonnes : Title, Year, Directors, Rating10, WatchedDate, Rewatch, Tags, Review
   - Rating 0.5-5.0 → 1-10 (×2)
   - Exclure les logs déjà exportés (si flag activé)
   - Marquer les logs exportés après génération

4. Tests `lib/__tests__/letterboxd.test.ts` :
   - Mapping rating correct
   - Format CSV valide (pas de virgules dans les champs sans quotes)
   - Exclusion des déjà-exportés

5. `app/api/festivals/[id]/export/letterboxd/route.ts` : retourner le CSV avec headers téléchargement

6. Bouton export sur la page journal (barre en bas de liste)

#### Stats

7. `lib/stats.ts` :
   - `computeFestivalStats(logs, seances, films)` :
     - Durée totale visionnée
     - Distribution des notes (histogramme)
     - Répartition par genre / pays / section
     - Top réalisateurs
     - Taux de satisfaction (% notes >= 3.5)

8. Tests `lib/__tests__/stats.test.ts` : calculs corrects avec fixtures

9. Page `app/festivals/[id]/stats/page.tsx` :
   - Histogramme notes (barres CSS, pas de lib externe)
   - Répartitions en listes avec pourcentages
   - Top 3 réalisateurs vus
   - Stat principale en grand : "X films vus / Y heures de cinéma"

### Vérification

```bash
npm test    # letterboxd + stats passent
npm run dev
# noter 3-4 films avec critiques longues
# exporter le CSV Letterboxd et vérifier le format
# vérifier la page stats avec des données
npm run build && npm run lint
```

### Commit de fin de phase

```
feat: éditeur critique markdown + export Letterboxd + stats festival
```

---

## Phase 9 — Archive + recherche + import Letterboxd

**Semaine 6 — objectif : 6-11 mai**

Vue multi-festivals et enrichissement depuis Letterboxd. Phase compressible si retard sur les phases précédentes.

### Tâches

1. Page archive `app/archive/page.tsx` :
   - Liste des festivals terminés (status = "done")
   - Stats cumulées : total films vus, total heures, note moyenne globale
   - Lien vers chaque festival archivé (accès lecture seule)

2. Recherche transversale `app/search/page.tsx` :
   - Input recherche full-text : titres de films, réalisateurs, texte des notes
   - SQLite FTS5 ou LIKE selon volume
   - Filtres : festival, année, note min
   - Résultats : liste de logs avec festival d'origine

3. Timeline personnelle `app/timeline/page.tsx` :
   - Tous les films vus chronologiquement, tous festivals confondus
   - Filtrable par année ou festival

4. Import watchlist Letterboxd `lib/importers/letterboxd-watchlist.ts` :
   - Parser le CSV export watchlist de Letterboxd
   - Croiser avec les films du programme actif par titre/année
   - Ajouter un badge "Watchlist" sur les `SeanceCard` correspondantes

5. UI d'import watchlist dans la page import (nouvel onglet)

### Vérification

```bash
npm run dev
# vérifier la page archive avec au moins un festival terminé
# tester la recherche sur quelques mots-clés
# importer une watchlist Letterboxd export CSV
# vérifier les badges sur le programme
npm run build && npm run lint
```

### Commit de fin de phase

```
feat: archive multi-festivals + recherche + import watchlist Letterboxd
```

---

## Phase 10 — Docker + déploiement + polish

**Semaine 7 — objectif : 11-18 mai** ⚠️ DEADLINE ABSOLUE avant Cannes

### Tâches

#### Docker

1. `Dockerfile` multi-stage :
   - Stage `deps` : install deps
   - Stage `builder` : build Next.js standalone
   - Stage `runner` : image minimale, port 3000, volume `/app/data` pour la DB

2. `.dockerignore` : exclure node_modules, .git, data/, public/posters/

3. `docker-compose.yml` :
   - Service `app` : image buildée localement ou depuis ghcr.io
   - Volume `./data:/app/data`
   - Volume `./public/posters:/app/public/posters`
   - `restart: unless-stopped`
   - Intégration avec nginx-proxy-manager via un network Docker commun

#### CI/CD déploiement

4. `.github/workflows/deploy.yml` :
   - Trigger : `workflow_dispatch` (manuel) ou optionnellement sur release
   - Build image Docker → push sur `ghcr.io/[user]/accred`
   - SSH vers VPS → `docker compose pull && docker compose up -d`

5. `scripts/backup.sh` : dump SQLite vers `./backups/app_YYYYMMDD.db` + nettoyage après 7 jours

#### Polish et polish

6. Empty states : pages vides (aucun festival, aucune sélection, journal vide) avec messages encourageants en FR

7. Loading states : skeletons ou spinners cohérents avec la charte

8. Messages d'erreur en français : API errors, formulaires invalides

9. Page settings minimale `app/settings/page.tsx` :
   - Changer le mot de passe
   - Clé API TMDb (si pas en .env)
   - Buffer conflits (défaut 20min)
   - Bouton regénérer les clés VAPID

#### Tests et vérification finale

10. Tests mobile réel sur Samsung Galaxy S21 :
    - Flow complet : créer festival → importer CSV → enrichir TMDb → sélectionner séances → noter → exporter ICS + Letterboxd
    - PWA installée, notifications reçues
    - Perf : page programme avec 100 séances < 1s

11. `docs/deployment.md` : guide d'installation VPS (Hetzner CX11 + Docker Compose + Nginx Proxy Manager + domaine)

12. `docs/usage.md` : guide utilisateur rapide (import, sélection, QuickNote, exports)

13. Mise à jour `README.md` : description projet, stack, lien vers docs

### Vérification finale pré-Cannes

```bash
# Build et test complets
npm run build && npm test

# Test Docker local
docker compose up --build
# vérifier sur http://localhost:3000

# Flow complet en conditions réelles
# 1. Login
# 2. Créer festival "Cannes 2026"
# 3. Importer le CSV du programme
# 4. Enrichir TMDb
# 5. Naviguer dans le programme, sélectionner 5-6 séances
# 6. Vérifier les conflits et l'export ICS
# 7. Simuler la prise de note QuickNote
# 8. Exporter Letterboxd
# 9. Vérifier les stats

# Push final
git push
gh workflow run release.yml   # tag + CHANGELOG si tout est OK
```

### Commit de fin de phase

```
feat: Docker + deploy workflow + polish UI + docs finales
chore(release): 1.0.0
```

---

## Planning résumé

| Phase | Contenu | Dates cibles | Priorité |
|-------|---------|-------------|----------|
| 1 | Init projet (Next.js, Tailwind, Drizzle, structure) | 24-26 mars | Critique |
| 2 | Schema DB + migrations + seed | 26-27 mars | Critique |
| 3 | Auth NextAuth v5 + login + middleware | 27-28 mars | Critique |
| 4 | Festival CRUD + navigation + layout responsive | 28 mars - 2 avril | Critique |
| 5 | Import CSV/JSON + TMDb + UI import | 2-9 avril | **DEADLINE** |
| 6 | Programme + sélection + conflits + ICS | 9-18 avril | Critique |
| 7 | Journal mobile + QuickNote + PWA + Web Push | 18-28 avril | Critique |
| 8 | Critique + Letterboxd export + stats | 28 avril - 6 mai | Important |
| 9 | Archive + recherche + Letterboxd import | 6-11 mai | Compressible |
| 10 | Docker + déploiement + polish + docs | 11-18 mai | **DEADLINE** |

**Phases 1-7** : non négociables pour Cannes. Sans elles, l'app n'est pas utilisable pendant le festival.

**Phases 8-9** : compressibles en cas de retard. L'export Letterboxd peut être fait post-Cannes.

**Phase 10** : deadline absolue mi-mai. Laisser au moins 3-4 jours pour les tests sur device réel.

**Milestone critique Phase 5** : le template CSV doit être prêt avant début avril, quand le PDF Cannes est publié.
