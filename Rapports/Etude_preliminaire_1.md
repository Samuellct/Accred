# Accred — Etude préliminaire V1

> Mars 2026 — Cadrage du périmètre V1, pipeline CI/CD et options de déploiement
> Mis à jour après session de questions — voir section 0

---

## Table des matières

0. [Réponses aux questions ouvertes](#0-réponses-aux-questions-ouvertes)
1. [Contexte du projet](#1-contexte-du-projet)
2. [Périmètre fonctionnel V1](#2-périmètre-fonctionnel-v1)
   - [2.5 Charte graphique](#25-charte-graphique----crème--intime)
3. [Questions ouvertes et décisions](#3-questions-ouvertes-et-décisions-à-prendre)
   - 3.1 Auth · 3.2 SQLite · 3.3 Affiches · 3.4 Import · 3.5 Conflits · 3.6 Web Push · 3.7 Editeur
   - [3.8 Adaptation desktop](#38-adaptation-desktop)
   - [3.9 Flow d'authentification](#39-flow-dauthentification)
   - [3.10 Architecture multi-festivals](#310-architecture-multi-festivals-et-navigation-par-niveaux)
4. [Pipeline CI/CD](#4-pipeline-cicd)
5. [Options de déploiement](#5-options-de-déploiement)
6. [Recommandation finale](#6-recommandation-finale)

---

## 0. Réponses aux questions ouvertes

Session de cadrage — Mars 2026. Réponses qui impactent les décisions techniques.

### Infrastructure

Le serveur Jellyfin existant ne peut pas héberger Accred. Un VPS dédié est obligatoire. Ca n'impacte pas l'architecture (Docker Compose + Nginx Proxy Manager reste le plan), mais supprime l'option "zéro coût hébergement" — compter ~3-5 EUR/mois.

### Import du programme des festivals

La plupart des festivals publient leur programme sous forme de PDF ou sur leur site/billetterie. Il n'existe pas de format d'export structuré standard côté festival. Conséquences :

- L'import CSV reste pertinent mais comme **chemin manuel** — l'utilisateur compile le programme dans le template CSV fourni par Accred
- La saisie manuelle séance par séance est un chemin **tout aussi important** que l'import CSV, pas un fallback de seconde zone
- A terme, un import par scraping ou copier-coller intelligent pourrait être exploré (hors V1)
- Le cas Cannes est particulier : accréditation cinéphile confirmée, accès à la billetterie interne du festival qui propose une grille horaire complète par jour et une liste des séances avec salle et horaires. Le programme complet est également publié au format PDF sur le site du festival, généralement début/mi-avril. Ce PDF sera la source principale pour compiler le CSV Accred. La disponibilité du PDF en avril donne une fenêtre de 3-4 semaines avant Cannes (mi-mai) — le template CSV doit donc être prêt et documenté avant début avril

Priorité V1 sur l'import : rendre le **template CSV clair et documenté** + **saisie manuelle fluide et rapide**.

### Téléphone et PWA — Android Samsung Galaxy S21

Bonne nouvelle : Android est la plateforme idéale pour les PWA. Sur Chrome/Android :
- Web Push fonctionne nativement, sans restriction (contrairement à iOS < 16.4)
- Le prompt "Installer sur l'écran d'accueil" est natif, sans manipulation
- Les service workers sont pleinement supportés
- La PWA se comporte comme une app native une fois installée

Aucune limitation à anticiper sur le Galaxy S21. Les notifications 15 min avant séance fonctionneront.

### Design — Charte graphique validée

La charte `accred_charte_3.html` ("Crème & intime") est la direction artistique retenue. Voir section 2.5 pour le détail complet.

Style général : élégant, intimiste, référence carnet de notes et affiche de festival. Contraste fort noir/crème avec accents dorés. Typographie mixte serif (Playfair Display) / sans-serif (DM Sans).

### Letterboxd

Utilisateur actif de Letterboxd. Flux actuel sans Accred : griffonnage de brouillon dans les notes téléphone pendant le festival, puis saisie manuelle dans Letterboxd après coup — flux fragmenté et laborieux.

Accred résout exactement ce pain point : QuickNote pendant le festival -> critique développée après -> export CSV Letterboxd en un clic. L'intégration Letterboxd est donc une feature centrale, pas optionnelle.

### Deadline : Festival de Cannes 2026

**Cannes 2026 (mi-mai) est le premier festival cible.** La V1 doit être complète, stable et déployée sur accred.fr avant cette date. Pas de réduction de scope — toutes les features définies en section 2 sont attendues pour Cannes.

---

## 1. Contexte du projet

### Problème résolu

Les cinéphiles qui fréquentent plusieurs festivals par an (Cannes, Deauville, Clermont-Ferrand, etc.) n'ont aucun outil pensé de leur point de vue. Les outils existants couvrent soit les **organisateurs** (Eventival, Sched), soit le suivi de films en général (Letterboxd, Trakt) sans aucune notion de festival, de programme ou de sélection personnelle.

Il n'existe rien qui couvre l'intégralité du cycle vu du côté spectateur :

```
Avant              Pendant              Après
─────────          ────────             ────────
Parcourir          Prendre note         Rédiger
le programme       rapidement           ses critiques

Construire         Consulter la         Exporter
sa sélection       prochaine séance     vers Letterboxd

Détecter les       Marquer comme vu     Archiver,
conflits                                consulter sur
d'horaires                              le long terme
```

### Ce qu'est Accred

Un compagnon de festival de cinéma personnel. PWA mobile-first, single-user, self-hosted. L'usage critique est la prise de note rapide sur téléphone entre deux séances (objectif < 30 secondes). Le reste — planification, archive, export — est un usage bureau, secondaire mais important.

### Ce qu'Accred n'est pas

- Un outil pour organisateurs de festival
- Un concurrent de Letterboxd (il l'alimente, il ne le remplace pas)
- Une app grand public dans sa V1 — c'est d'abord un outil personnel

### Stack retenue

- Next.js 15 (App Router) + TypeScript 5.x
- Tailwind CSS 4.x
- SQLite via better-sqlite3 + Drizzle ORM
- PWA offline-first (service workers)
- TMDb API v3, proxié via `/api/tmdb/`
- Docker Compose, self-hosted derrière Nginx Proxy Manager

---

## 2. Périmètre fonctionnel V1

La V1 doit être **production ready** : toutes les fonctionnalités majeures présentes, finies, robustes. Pas un prototype.

### Module 1 — Gestion des festivals

Socle de l'application. Sans ça, rien n'existe.

**CRUD festivals**
- Créer / éditer / supprimer un festival (nom, édition, dates, lieu, description)
- Logo / affiche optionnels (upload fichier)
- Liste des festivals avec statut : à venir / en cours / terminé

**Import du programme**
- Import CSV (colonnes : titre, date, heure, salle, durée, réalisateur, section) — format à documenter
- Import JSON structuré (format propre à Accred)
- Saisie manuelle séance par séance en fallback
- Un film peut avoir plusieurs séances (même film, salles/jours différents)

**Enrichissement TMDb**
- Pour chaque film importé : recherche par titre + année sur TMDb
- Récupérer : affiche, synopsis FR, pays, langue, genre, réalisateur, casting principal
- Stocker localement dans la BDD (offline garanti, pas de dépendance réseau pendant le festival)
- Interface de confirmation/correction si la correspondance TMDb est incertaine
- Cache : ne pas re-fetcher un film déjà enrichi

### Module 2 — Sélection personnelle

Le coeur de la planification avant le festival.

**Navigation dans le programme**
- Vue grille : axe X = créneaux horaires, axe Y = salles/jours (style grille TV)
- Vue liste : filtrée par genre, pays, section festival, réalisateur
- Fiche film : affiche, synopsis, méta TMDb + toutes les séances de ce film

**Construction de la sélection**
- Ajouter / retirer une séance de sa sélection
- Niveaux de priorité : haute / moyenne / basse
- Watchlist légère "je suis intéressé" (en dessous de la sélection ferme)
- Détection automatique des conflits d'horaires :
  - Chevauchement temporel entre deux séances sélectionnées
  - Alerte visuelle sur la grille et dans la fiche séance
  - Suggestion de la séance alternative du même film si elle existe
- Compteur de séances sélectionnées par jour

**Export**
- Export ICS (iCalendar) de la sélection — compatible Google Calendar, Apple Calendar, Outlook
- Les événements ICS contiennent : titre, salle, heure de début/fin, lien vers la fiche dans l'app

### Module 3 — Journal de festival (mobile)

L'interface la plus critique. Doit fonctionner à une main, offline, en < 30 secondes.

**Marquage "vu"**
- Bouton "J'ai vu ce film" sur la fiche séance, horodatage automatique
- Accessible depuis la page d'accueil (widget prochaine séance) sans naviguer

**Prise de note rapide (QuickNote)**
- Note texte libre
- Dictée vocale via Web Speech API (en option, degradable)
- Rating immédiat : demi-étoiles de 0.5 à 5.0
- Tags rapides par tap : #émouvant #surprenant #décevant #chef-oeuvre #à-revoir #longueur #formdaring #humour + champ libre pour tag custom
- Objectif UX : note complète (étoiles + 1-2 tags + texte bref) en < 30 secondes
- Interface accessible sans déverrouiller l'app (shortcut PWA)

**Widget page d'accueil**
- "Prochaine séance : Anora, Salle Debussy, dans 42 min"
- Affichage de la séance en cours si applicable
- Accès direct au bouton "Vu + Note"

**Notifications Web Push**
- Rappel 15 minutes avant chaque séance sélectionnée (si PWA installée)
- Notification optionnelle : "Séance terminée — prendre une note ?"

### Module 4 — Développement post-festival

A utiliser depuis le bureau, après le festival.

**Compléter ses notes**
- Accès à toutes les notes rapides prises pendant le festival
- Editeur de texte (pas de rich text compliqué — textarea ou éditeur markdown léger)
- Champs optionnels : comparaison avec la filmographie du réalisateur, contexte du festival
- Distinguer "note rapide" (texte brut du festival) et "critique" (développée après)

**Export Letterboxd**
- Pour chaque film vu et noté : générer une entrée au format CSV Letterboxd
  - Colonnes : Name, Year, WatchedDate, Rating10, Review
  - Rating : mapping 0.5-5.0 (Accred) -> 1-10 (Letterboxd)
- Export CSV téléchargeable -> importable directement dans Letterboxd (Settings > Import & Export)
- Flag "exporté vers Letterboxd" sur chaque log pour éviter les doublons

**Statistiques du festival**
- Nombre de films vus / sélectionnés / manqués
- Répartition par genre, pays de production, langue
- Durée totale de visionnage (en heures)
- Distribution des ratings (histogramme)
- Réalisateurs les plus représentés
- Taux de "satisfaction" (ratio films notés >= 3.5 sur total vus)

### Module 5 — Archive multi-festivals

Vue longue durée, depuis le bureau.

**Vue d'ensemble**
- Liste chronologique de tous les festivals archivés
- Stats cumulées : X films vus en Y festivals sur Z années

**Recherche transversale**
- Tous les films d'un réalisateur vus en festival
- Tous les films vus dans un genre, un pays, une langue
- Tous les films d'une section ou d'une édition
- Recherche full-text dans les notes et critiques

**Timeline personnelle**
- Vue chronologique de tous les films vus, tous festivals confondus
- Filtrable par année, festival, rating, tag

### Module 6 — Connexion Letterboxd (import)

Enrichissement de l'expérience de planification.

**Import watchlist**
- Charger l'export CSV Letterboxd (watchlist + historique)
- Croiser avec le programme du festival : signaler les films de la watchlist présents en compétition
- Pour les films déjà vus (dans l'historique Letterboxd), afficher la note passée sur la fiche

### Module 7 — PWA et offline

Fonctionnalités transversales liées au mode PWA.

**Manifest + installation**
- `manifest.json` complet : icônes, nom, thème, orientation portrait
- Installable sur écran d'accueil iOS et Android

**Service worker offline**
- Le programme du festival en cours est disponible hors ligne
- Les notes prises offline sont sauvegardées localement et sync au retour du réseau
- Les affiches films sont cachées (stratégie cache-first)
- Les pages statiques (interface) fonctionnent sans réseau

### Module 8 — Auth et accès

Single-user mais doit être accessible depuis mobile et desktop.

**Authentification simple**
- Un seul compte (usage perso)
- Mot de passe local — pas de OAuth pour simplifier le déploiement
- Session persistante longue durée (ne pas se reconnecter chaque matin au festival)
- NextAuth.js v5 avec provider credentials

### Récapitulatif V1 — ce qui est IN et ce qui est OUT

| Feature | V1 | Commentaire |
|---|---|---|
| CRUD festivals | IN | Socle |
| Import CSV/JSON programme | IN | Core |
| Enrichissement TMDb | IN | Core |
| Vue grille programme | IN | Core |
| Sélection + priorités | IN | Core |
| Détection conflits | IN | Core |
| Export ICS | IN | Simple mais très utile |
| QuickNote mobile | IN | Feature principale |
| Rating demi-étoiles | IN | Core |
| Tags rapides | IN | Core |
| Widget prochaine séance | IN | Core mobile |
| Notifications Web Push | IN | Important festival |
| Editeur critique post-festival | IN | Important |
| Export Letterboxd CSV | IN | Important |
| Stats par festival | IN | Important |
| Archive multi-festivals | IN | Production ready = archive fonctionnelle |
| Recherche transversale archive | IN | Important long terme |
| Import watchlist Letterboxd | IN | Bonne valeur ajoutée |
| Auth single-user | IN | Obligatoire |
| PWA offline | IN | Obligatoire |
| Dark mode | OUT V1 | Phase polish |
| Vue carte (GPS salles) | OUT V1 | Complexité/valeur faible |
| Dictée vocale | OUT V1 | Bonus si simple à ajouter |
| Stats comparatives inter-festivals | OUT V1 | Post-V1 |
| API Letterboxd officielle | OUT V1 | Pas d'API publique disponible |

---

## 2.5 Charte graphique — "Crème & intime"

Source : `accred_charte_3.html`. Direction artistique validée.

### Palette de couleurs

| Variable | Hex | Usage |
|---|---|---|
| `--noir` | `#1A1714` | Fond sombre, header, bouton primaire |
| `--parchemin` | `#F7F4EE` | Fond principal des cards, surfaces claires |
| `--creme` | `#EDE8DC` | Fond body général |
| `--creme-f` | `#E4DECE` | Variante crème plus foncée |
| `--brun` | `#3D342A` | Texte courant, titres secondaires |
| `--or` | `#A67C3D` | Accent principal, labels, bordures actives |
| `--or-chaud` | `#C9985A` | Accent secondaire, point logo, hover |
| `--gris-c` | `#8C8070` | Métadonnées, captions, liens inactifs |

### Typographie

| Rôle | Police | Poids | Usage |
|---|---|---|---|
| Titres | Playfair Display | 400 (normal + italic) | Noms de films, titres de section, logo |
| Corps | DM Sans | 300 / 400 / 500 | Navigation, labels, texte courant, boutons |

Le mix serif (Playfair) pour les éléments nobles (titres films, nom de l'app) et sans-serif (DM Sans) pour le fonctionnel (nav, métadonnées, boutons) est la signature visuelle centrale.

### Composants clés

**Logo** : "Accred" en Playfair Display 400, suivi d'un petit point rond `#C9985A`. Variante compacte sur fond noir pour le header mobile.

**Boutons** :
- Primaire : fond `#1A1714`, texte parchemin, uppercase, letter-spacing large
- Secondaire : transparent, bordure `#3D342A` 30% opacité, hover vers or
- Tertiaire : texte `#A67C3D`, underline, uppercase

**Film card** : grille 2 colonnes (affiche sombre à gauche, body crème à droite), bordure or 25% opacité, section en uppercase or, titre en Playfair, note en italic brun.

**Navigation** : liens uppercase en DM Sans 0.6rem, letter-spacing 0.15em, gris inactif, noir + underline or pour l'actif. Badge festival en bordure or.

### Esprit général

Pas de border-radius agressifs, pas de couleurs saturées. L'interface doit ressembler à un carnet de notes de festival — intime, élégant, comme un programme imprimé de qualité. Les animations sont subtiles (transitions 0.15s). Mobile-first mais l'esthétique fonctionne aussi très bien sur desktop.

---

## 3. Questions ouvertes et décisions à prendre

Plusieurs zones d'ombre dans les specs initiales nécessitent une décision avant de coder.

### 3.1 Authentification : credentials local vs OAuth

**Option A — Credentials local (mot de passe simple)**
- `NextAuth.js v5` avec provider `Credentials`
- Un seul compte hardcodé dans les variables d'environnement (`ADMIN_PASSWORD=...`)
- Session JWT longue durée (30 jours)
- Avantage : zéro infrastructure supplémentaire, déploiement trivial
- Inconvénient : mot de passe en clair dans `.env`, pas de reset par email

**Option B — NextAuth avec provider OAuth (Google/GitHub)**
- Avantage : pas de gestion de mot de passe, reset natif
- Inconvénient : dépendance à un service tiers, nécessite de configurer une app OAuth pour chaque provider

**Decision recommandée : Option A** — credentials simples. C'est un outil perso, le serveur est self-hosted, un `.env` sécurisé suffit. OAuth est du surengineering pour un seul utilisateur.

### 3.2 Base de données : SQLite local vs Turso

**Option A — SQLite fichier local** (`better-sqlite3` sur le VPS)
- Le fichier `.db` vit sur le disque du VPS, dans un volume Docker
- Simple, zéro latence, fonctionne offline
- Backup = copier le fichier

**Option B — Turso** (SQLite distribué, libSQL)
- SQLite hébergé dans le cloud, accès depuis n'importe quel appareil sans VPN
- Latence réseau sur chaque requête
- Plan gratuit : 500 bases, 9GB storage, 1 milliard rows read/mois
- Complexité supplémentaire : driver `@libsql/client` au lieu de `better-sqlite3`
- Avantage : accessible depuis Vercel/Cloudflare si on migre plus tard

**Decision recommandée : Option A** — SQLite local sur VPS. Le serveur est accessible depuis partout via HTTPS, il n'y a aucun besoin de Turso. Turso est pertinent si on veut déployer sur serverless (Vercel) mais ce n'est pas le cas ici. Backup simplifié (un fichier à copier, cron + rsync).

### 3.3 Stockage des affiches TMDb : local vs URL distante

**Option A — Stockage local**
- Télécharger et stocker les affiches dans `/public/uploads/posters/` au moment de l'enrichissement
- Fonctionne 100% offline pendant le festival
- Coût : quelques dizaines de Mo par festival (affiches JPEG compressées)

**Option B — URL TMDb distante**
- Stocker l'URL TMDb dans la BDD, le navigateur charge l'image depuis TMDb
- Zéro espace disque serveur
- Offline cassé si TMDb inaccessible
- Risque : les URLs TMDb peuvent changer

**Decision recommandée : Option A** — stockage local. L'offline est une exigence non négociable pendant le festival. Les affiches à 300x450px pèsent ~30ko chacune, un festival de 200 films = 6Mo maximum. Négligeable.

### 3.4 Chemins d'import du programme — trois niveaux

Les festivals ne fournissent pas de fichier structuré exportable. Le programme est disponible en PDF ou sur le site/billetterie du festival. Il faut donc prévoir trois chemins d'import, tous en V1 :

**Chemin A — Import CSV (via template Accred)**
L'utilisateur compile le programme dans le template CSV fourni par l'app, puis l'importe. C'est le chemin le plus efficace une fois le template maîtrisé.

Format du template :
```
titre_original,titre_fr,date,heure_debut,duree_min,salle,section,realisateur,annee
Poor Things,Pauvres Créatures,2024-05-15,14:30,141,Grande Salle,Compétition,Yorgos Lanthimos,2023
```

- `titre_fr`, `section`, `annee` sont optionnels
- `date` format ISO `YYYY-MM-DD`, `heure_debut` format `HH:MM`
- `annee` = année de production (aide TMDb), pas l'année du festival
- Un validateur d'import signale les erreurs avant traitement
- Le template CSV vide doit être téléchargeable depuis l'interface

**Chemin B — Saisie manuelle séance par séance**
Interface formulaire pour ajouter une séance : titre, date, heure, salle, section, durée. Enrichissement TMDb déclenché après validation. Ce chemin est aussi important que l'import CSV — pas un fallback.

**Chemin C — Import JSON**
Format JSON structuré défini par Accred. Utile si on veut scripter l'import depuis une source tierce ou réimporter une sauvegarde. Même champs que le CSV, format objet.

### 3.5 Détection de conflits : quelle granularité ?

Un conflit existe quand deux séances sélectionnées se chevauchent. Mais les cas limites :

- **Chevauchement exact** : séance A finit à 16h30, séance B commence à 16h30 — conflit ou non ?
- **Marge de déplacement** : ajouter un buffer configurable (ex. 20 min entre deux séances) pour le temps de trajet ?
- **Durée approximative** : si la durée d'un film n'est pas connue, on ne peut pas calculer la fin

**Decision recommandée** :
- Conflit si `debut_B < fin_A` (chevauchement strict, sans buffer par défaut)
- Option dans les settings : buffer de déplacement configurable (0, 15, 20, 30 min)
- Si durée inconnue : pas de détection de conflit pour cette séance, warning UI

### 3.6 Web Push : complexité vs valeur

Les notifications Web Push nécessitent :
- Un service worker enregistré (de toute façon requis pour la PWA)
- Un serveur VAPID (clés publique/privée) pour envoyer les push
- L'utilisateur doit avoir accordé la permission de notifications

La bibliothèque `web-push` (npm) gère l'envoi depuis Node.js. La complexité est modérée.

**Decision recommandée** : inclure en V1. C'est une feature avec une vraie valeur pendant le festival (rappel 15 min avant séance). L'infrastructure service worker est déjà requise par la PWA.

### 3.7 Editeur de texte pour les critiques

Plusieurs options :
- **Textarea simple** : le plus simple, pas de formatage
- **Markdown avec preview** : `react-markdown` + textarea — léger, format standard
- **Tiptap ou Lexical** : rich text editor — lourd, overkill pour un usage perso

**Decision recommandée** : Markdown avec preview. Format texte brut, exportable, lisible même sans l'app. Une textarea en mode split avec preview Markdown suffit. Pas de WYSIWYG.

### 3.8 Adaptation desktop

L'app est mobile-first mais accessible via accred.fr depuis un PC. Approche retenue : **layout responsive deux zones**, pas un simple centrage du layout mobile.

```
Mobile (< 768px)          Desktop (>= 768px)
─────────────────         ──────────────────────────────────
Contenu plein écran        ┌─────────┬──────────────────────┐
                           │ Sidebar │ Contenu principal    │
Bottom nav (5 icônes)      │ nav     │                      │
                           │         │                      │
                           └─────────┴──────────────────────┘
```

Différences desktop :
- Bottom nav → sidebar gauche avec icônes + labels
- Programme → vue grille horizontale (heures en X, salles en Y) au lieu de liste verticale
- Journal → 2 colonnes de cards
- QuickNote → reste centré et étroit (action mobile-centric)
- Charte graphique identique sur les deux formats

Le desktop est optimisé pour la **planification** (grille programme lisible, sélection confortable), le mobile pour la **vitesse** (noter en < 30 sec). Même codebase, responsive CSS.

### 3.9 Flow d'authentification

Puisque l'app est accessible publiquement sur accred.fr, le flow complet est :

```
accred.fr
    │
    ├── [non connecté] ──→ Page login
    │                       Logo Accred centré, champ mot de passe, bouton "Entrer"
    │                       Session JWT 30 jours après connexion
    │
    ├── [connecté, aucun festival actif] ──→ Page sélection de festival
    │
    └── [connecté, festival sélectionné] ──→ Dashboard festival (mockup_ui_v1.html)
```

La page login respecte la charte : fond parchemin, logo Playfair centré, input minimaliste sans décoration superflue, rien d'autre. Pas de lien "mot de passe oublié" (usage perso, le `.env` fait foi).

### 3.10 Architecture multi-festivals et navigation par niveaux

L'app fonctionne sur **deux niveaux** distincts :

**Niveau 1 — Sélection de festival**

Page d'accueil après connexion. Liste tous les festivals suivis par l'utilisateur.

```
┌─────────────────────────────────────────────────┐
│  Accred·                                        │
├─────────────────────────────────────────────────┤
│  Cannes 2026         En cours   4 vus / 11 sél. │  [→]
│  14–25 mai 2026 · Cannes                        │
├─────────────────────────────────────────────────┤
│  Deauville 2025      Terminé    8 vus            │  [→]
│  5–14 sept. 2025 · Deauville                    │
├─────────────────────────────────────────────────┤
│  Clermont 2025       Terminé    22 vus           │  [→]
│  31 jan–8 fév 2025 · Clermont-Ferrand           │
├─────────────────────────────────────────────────┤
│             [+ Ajouter un festival]             │
└─────────────────────────────────────────────────┘
```

Actions disponibles sur chaque festival : entrer, renommer, supprimer (avec confirmation — suppression en cascade de toutes les données liées).

**Niveau 2 — Festival actif**

= le mockup `mockup_ui_v1.html`. Le badge festival dans le header ("Cannes 2026") est un **bouton de retour** vers le niveau 1.

```
Header : [Accred·]  [Cannes 2026 ▾]  ← tap → retour niveau 1
```

**Isolation des données par festival**

Toutes les tables (`seances`, `selections`, `logs`) ont une clé étrangère `festivalId`. Aucune donnée n'est partagée entre festivals — chaque festival est un espace étanche.

**Anticipation multi-utilisateurs**

En V1, l'app est single-user. Mais le schéma Drizzle inclura un champ `userId` sur les tables principales dès le départ. Ca ne change rien à l'UX V1 (un seul utilisateur = un seul `userId` = `1`), mais ça évite une migration douloureuse si on ouvre l'app à d'autres utilisateurs plus tard.

```typescript
// anticipation dans le schema — transparent en V1
selections: {
  id, festivalId, seanceId, userId,  // userId = 1 toujours en V1
  priorite, interet
}
```

---

## 4. Pipeline CI/CD

### 4.1 Vue d'ensemble — trois workflows distincts

```
Tout push / toute PR
     |
     v
CI (.github/workflows/ci.yml)
     lint → build → test*
     * sautés si [skip tests] dans le message de commit

                    ┌─────────────────────────────────────┐
                    │ Déclenchement manuel (fin de phase) │
                    └──────────────┬──────────────────────┘
                                   v
                    Release (.github/workflows/release.yml)
                         lint → build → test (toujours)
                                   |
                                   v
                         npx semantic-release
                         tag git + CHANGELOG.md + GitHub Release

Déploiement VPS (.github/workflows/deploy.yml)  ← à créer quand VPS prêt
     build image Docker → push ghcr.io → SSH deploy
```

Le déploiement VPS est un troisième workflow, distinct de la release. Il sera câblé quand l'infrastructure sera en place (VPS commandé, secrets configurés).

### 4.2 Workflow CI — `.github/workflows/ci.yml`

Déclenché sur **tout push** (toutes branches) et les **PR vers main**.

Pipeline : `npm ci` → `lint` → `build` → `test`

Le flag `[skip tests]` dans le message de commit saute l'étape test. Utile en phase de développement initial pour ne pas bloquer sur des tests non encore écrits. Le lint et le build tournent toujours.

```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run build --if-present
      - name: Tests
        if: "!contains(github.event.head_commit.message, '[skip tests]')"
        run: npm test --if-present
```

### 4.3 Workflow Release — `.github/workflows/release.yml`

Déclenché **uniquement manuellement** (`workflow_dispatch`). Jamais automatique.

- `[skip tests]` n'est pas honoré ici — les tests tournent toujours avant une release
- semantic-release analyse tous les commits depuis le dernier tag et détermine le bump semver automatiquement
- Crée le tag git, met à jour `CHANGELOG.md`, crée la GitHub Release

```yaml
name: Release

on:
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run build --if-present
      - run: npm test --if-present
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release
```

**Deux façons de déclencher la release :**
- Manuellement : onglet Actions sur GitHub → workflow "Release" → "Run workflow"
- Via Claude : `gh workflow run release.yml` (nécessite `gh` CLI authentifié — déjà disponible)

En fin de phase de développement, je peux me charger de déclencher la release après avoir vérifié que les commits depuis le dernier tag sont cohérents et correctement formatés.

### 4.4 Workflow Deploy — `.github/workflows/deploy.yml` (à créer)

Ce workflow sera ajouté quand le VPS et le domaine seront opérationnels. Il sera déclenché sur push dans `main` après que la CI passe.

Pipeline prévu : build image Docker → push `ghcr.io` → SSH sur VPS → `docker compose pull && docker compose up -d`

Registry : `ghcr.io` (authentification via `GITHUB_TOKEN` natif, pas de compte Docker Hub requis).

### 4.5 semantic-release — `.releaserc.json`

Configuration en place :

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md"],
      "message": "chore(release): ${nextRelease.version} [skip ci]"
    }],
    "@semantic-release/github"
  ]
}
```

Règles de versioning :
- `feat:` → bump minor (0.1.0 → 0.2.0)
- `fix:` → bump patch (0.1.0 → 0.1.1)
- `BREAKING CHANGE:` dans le footer → bump major (1.0.0 → 2.0.0)
- `chore:`, `docs:`, `refactor:`, `test:` → pas de release déclenchée

Le commit `chore(release): x.y.z [skip ci]` généré automatiquement par semantic-release ne redéclenche pas la CI.

### 4.6 Secrets GitHub à configurer

Secrets déjà nécessaires maintenant :
- Aucun — le `GITHUB_TOKEN` est automatique pour la release

Secrets à ajouter quand le VPS sera prêt (pour le workflow deploy) :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH (ex. `deploy`) |
| `SSH_PRIVATE_KEY` | Clé privée SSH sans passphrase |
| `TMDB_API_KEY` | Clé API TMDb |
| `NEXTAUTH_SECRET` | Secret NextAuth (32 chars random) |
| `ADMIN_PASSWORD` | Mot de passe de l'interface Accred |

### 4.7 Tests unitaires — scope prévu

Les tests ciblent la logique métier pure, pas l'UI. Framework : **Vitest** (intégration native Next.js 15, TypeScript-first, rapide).

Modules à couvrir :
- Détection de conflits : chevauchement exact, buffer configurable, durée inconnue
- Calculs stats : durée totale, distribution ratings, ratios
- Parser CSV d'import : colonnes manquantes, dates invalides, encodage
- Export Letterboxd : mapping rating 0.5-5.0 → 1-10, format colonnes
- Générateur ICS : format VEVENT valide, timezone Europe/Paris
- Client TMDb : erreurs 404, rate limit, réponse vide

---

## 5. Options de déploiement

### 5.1 Contrainte fondamentale : pourquoi pas les PaaS serverless ?

L'app utilise `better-sqlite3`, un module natif Node.js qui écrit dans un fichier sur le disque. Cette contrainte élimine d'emblée les plateformes serverless :

| Plateforme | Verdict | Raison |
|---|---|---|
| **Vercel** | Incompatible | Filesystem éphémère, `better-sqlite3` incompatible avec l'edge runtime |
| **Cloudflare Pages/Workers** | Incompatible | Pas de filesystem persistant, SQLite uniquement via D1 (driver différent) |
| **Netlify** | Incompatible | Même raisons que Vercel |
| **Railway** | Compatible | Volumes persistants, mais vendor lock-in et coût > VPS |
| **Fly.io** | Compatible avec friction | Volumes disponibles, mais pas de docker-compose.yml — nécessite fly.toml |
| **Render.com** | Compatible | Disques persistants sur plans payants, zero-downtime deploy impossible avec disque |
| **VPS + Docker Compose** | Idéal | Contrôle total, persistance native, coût minimal |

Note : si on voulait un jour migrer vers Vercel, il faudrait remplacer `better-sqlite3` par Turso (libSQL), ce qui est une réécriture non triviale. Le choix de rester sur VPS est donc structurant.

### 5.2 Comparatif VPS

| Hébergeur | Offre | Prix/mois | RAM | vCPU | Stockage | Pays data center |
|---|---|---|---|---|---|---|
| **Hetzner Cloud** | CX11 | ~3.29 EUR* | 2 GB | 1 | 20 GB NVMe | Allemagne/Finlande |
| **Hetzner Cloud** | CX21 | ~5.77 EUR* | 4 GB | 2 | 40 GB NVMe | Allemagne/Finlande |
| **OVHcloud** | VPS Starter | ~3.50 EUR | 2 GB | 1 | 20 GB SSD | France |
| **Scaleway** | DEV1-S | ~7.20 EUR | 2 GB | 2 | 20 GB NVMe | France |
| **Infomaniak** | VPS Lite | ~2.70 CHF | 1 GB | 1 | 10 GB SSD | Suisse |
| **Hostinger** | KVM 1 | ~4.99 USD | 4 GB | 1 | 50 GB NVMe | Global |

*Hetzner a annoncé une hausse tarifaire de 25-33% effective avril 2026.

**Contexte :** Un VPS dédié est obligatoire — le serveur Jellyfin existant ne peut pas héberger Accred.

- **Hetzner CX11** reste le meilleur rapport qualité/prix malgré la hausse d'avril 2026, NVMe + réseau 1Gbps
- **OVHcloud Starter** si on préfère un hébergeur français avec data center en France (RGPD, latence réduite, support FR)

### 5.3 Registrar pour accred.fr

**Conditions AFNIC pour un .fr**
- Pas de condition de nationalité française — tout résident UE/EEE peut enregistrer un .fr
- Un développeur français peut enregistrer sans aucune contrainte

**Comparatif registrars**

| Registrar | Enregistrement | Renouvellement | Notes |
|---|---|---|---|
| **OVH** | ~5 EUR/an | ~7 EUR/an | Français, gestion DNS simple |
| **Gandi** | ~8 EUR/an | ~8 EUR/an | Interface claire, support réactif |
| **Infomaniak** | ~3 EUR/an | ~7 EUR/an | Le moins cher à l'enregistrement |
| **Porkbun** | ~5 USD/an | ~7 USD/an | Pas de renouvellement surprenant |
| **Namecheap** | ~5 USD/an | ~8 USD/an | Interface correcte |

**Recommandation** : OVH ou Gandi — les deux sont fiables pour un .fr, support en français, DNS managé gratuit inclus. OVH est moins cher, Gandi a une meilleure réputation pour le support et l'interface.

### 5.4 Architecture de déploiement cible

```
Internet
    |
    v
DNS : accred.fr -> IP du VPS
    |
    v
VPS (Hetzner CX11 ou serveur Jellyfin existant)
    |
    v
Docker Compose
    |
    |-- nginx-proxy-manager (ports 80/443)
    |       |-> gère SSL Let's Encrypt automatiquement
    |       |-> route accred.fr vers container app:3000
    |
    |-- accred (port 3000, non exposé publiquement)
    |       |-> Next.js 15 + better-sqlite3
    |       |-> volume: ./data:/app/data (SQLite + uploads)
    |
    |-- (optionnel) uptime-kuma (monitoring léger)
```

### 5.5 SSL avec Nginx Proxy Manager

Nginx Proxy Manager est une image Docker (`jc21/nginx-proxy-manager`) qui fournit une interface web pour gérer les règles de proxy et les certificats SSL.

Configuration type dans `docker-compose.yml` :

```yaml
services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
      - "81:81"   # interface admin NPM (restreindre au réseau local !)
    volumes:
      - ./npm/data:/data
      - ./npm/letsencrypt:/etc/letsencrypt

  app:
    image: ghcr.io/[username]/accred:latest
    restart: always
    expose:
      - "3000"  # pas de `ports:`, seulement exposé en interne
    volumes:
      - ./data:/app/data
    env_file:
      - .env
```

Dans l'interface NPM (port 81) :
1. Ajouter un "Proxy Host"
2. Domain : `accred.fr`
3. Forward : `app:3000`
4. SSL : Let's Encrypt, activer "Force SSL" et "HTTP/2"
5. Le certificat se génère et se renouvelle automatiquement

### 5.6 Backup de la base de données

SQLite = un seul fichier. Stratégie de backup recommandée :

```bash
# cron sur le VPS, tous les soirs à 3h
0 3 * * * cp /opt/accred/data/app.db /opt/accred/backups/app_$(date +%Y%m%d).db
# garder 30 jours
find /opt/accred/backups -name "*.db" -mtime +30 -delete
```

Ou via un container de backup dédié dans le compose. Pour plus de robustesse : rsync vers un stockage distant (Backblaze B2, ~0.006 USD/GB/mois).

---

## 6. Recommandation finale

### Stack de déploiement retenue

| Composant | Choix | Justification |
|---|---|---|
| **Hébergement** | VPS Hetzner CX11 (ou serveur Jellyfin existant) | Meilleur rapport qualité/prix, Docker Compose natif |
| **Domaine** | accred.fr via OVH ou Gandi | Fiable, support FR, ~7 EUR/an |
| **SSL** | Let's Encrypt via Nginx Proxy Manager | Gratuit, automatique, intégré Docker |
| **Registry Docker** | ghcr.io | Natif GitHub Actions, gratuit |
| **CI/CD** | GitHub Actions | Intégration native, gratuit pour dépôts publics |
| **Versioning** | semantic-release | Automatise tags et CHANGELOG |
| **Tests** | Vitest | Rapide, TypeScript-first |
| **Base de données** | SQLite local sur VPS | Zéro infrastructure, offline garanti |
| **Auth** | NextAuth.js v5 credentials | Simple, self-hosted, un seul user |
| **Backup** | Cron + copie fichier SQLite | Un fichier à copier, trivial à automatiser |

### Coût mensuel estimé

| Poste | Coût | Fréquence |
|---|---|---|
| VPS Hetzner CX11 | ~3.30 EUR | Mensuel |
| Domaine accred.fr | ~0.60 EUR | Mensuel (amortissement) |
| TMDb API | 0 EUR | Gratuit |
| GitHub Actions | 0 EUR | Gratuit (2000 min/mois inclus) |
| **Total** | **~4 EUR/mois** | |

### Prochaines étapes concrètes

1. Enregistrer `accred.fr` chez OVH ou Gandi
2. Commander le VPS (Hetzner CX11 ou OVHcloud Starter), installer Docker + Docker Compose
3. Initialiser le projet Next.js avec le stack défini
4. Mettre en place le schema Drizzle (Phase 1)
5. Configurer les workflows GitHub Actions CI/CD + secrets
6. Déployer une version vide sur accred.fr pour valider l'infrastructure avant de coder
7. **Deadline : app complète et testée sur mobile avant mi-mai 2026 (Cannes 2026)**

---

*Etude préliminaire V1 — Mars 2026*
