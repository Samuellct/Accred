# Compagnon de festival de cinéma — Spécification du projet

> Document de spécification — Version 2.0
> Usage : référence pour la conception et le développement (Claude Code)

---

## Table des matières

1. [Vision du projet](#1-vision-du-projet)
2. [Étude des noms : inventaire et analyse](#2-étude-des-noms--inventaire-et-analyse)
   - [2.1 Inventaire des plateformes et apps existantes](#21-inventaire-des-plateformes-et-apps-existantes)
   - [2.2 Vocabulaire technique du cinéma exploitable](#22-vocabulaire-technique-du-cinéma-exploitable)
   - [2.3 Propositions de noms](#23-propositions-de-noms)
3. [Forme et expérience utilisateur](#3-forme-et-expérience-utilisateur)
4. [Fonctionnalités](#4-fonctionnalités)
5. [Stack technique](#5-stack-technique)
6. [Parcours utilisateur](#6-parcours-utilisateur-détaillé)
7. [Phases de développement](#7-phases-de-développement-suggérées)
8. [Questions ouvertes](#8-questions-ouvertes-à-trancher-avant-de-commencer)
9. [Dépendances principales](#9-dépendances-principales)

---

## 1. Vision du projet

### Problème résolu

Les cinéphiles qui fréquentent plusieurs festivals par an (Cannes, Deauville, Clermont,
etc.) n'ont aucun outil dédié à leur point de vue de spectateur. Les outils existants
sont soit conçus pour les **organisateurs** (Eventival, Fiona, Sched), soit des
applications génériques (Google Calendar, notes papier). Il n'existe rien qui couvre
l'intégralité du cycle d'un festival vu du côté spectateur :

```
Avant        →     Pendant        →      Après
Planifier         Vivre                 Archiver
─────────         ────────              ────────
Parcourir         Prendre note          Rédiger
le programme      rapidement            ses critiques
Construire        Consulter             Parcourir
sa sélection      sa prochaine          ses archives
                  séance                multi-festivals
Détecter les      Marquer               Exporter
conflits          comme vu              vers Letterboxd
d'horaires
```

### Ce que le projet fait

Un compagnon de festival de cinéma personnel. Il permet de planifier sa sélection avant
le festival, de prendre des notes rapides sur téléphone entre les séances, et d'archiver
l'ensemble de ses participations festivalières dans une base consultable sur le long terme.

### Ce que le projet n'est pas

- Pas un outil pour les organisateurs de festival
- Pas un concurrent de Letterboxd (il alimente Letterboxd, ne le remplace pas)
- Pas une application grand public dans sa v1 — c'est un outil initialement personnel

---

## 2. Étude des noms : inventaire et analyse

### 2.1 Inventaire des plateformes et apps existantes

#### Plateformes de suivi et notation de films

| Nom | Type | Origine du nom |
|---|---|---|
| **Letterboxd** | Réseau social cinéphile | Format "letterbox" = les bandes noires du cinéma 16:9 |
| **Trakt** | Suivi films/séries | "Track" = tracer, suivre |
| **MUBI** | Streaming + notation | Acronyme de "My Ultimate Blu-ray Index" ou simplement inventé |
| **AlloCiné** | Référence + séances | "Allô" (téléphone) + "Ciné" — référence au minitel |
| **SensCritique** | Notation FR | "Sens" (meaning) + "Critique" |
| **JustWatch** | Agrégateur streaming | Descriptif : "just watch" |
| **TMDb** | Base de données | The Movie Database |
| **IMDb** | Base de données | Internet Movie Database |
| **Must** | Liste de visionnage | "Must watch" tronqué |
| **Simkl** | Suivi multi-contenus | Acronyme opaque |
| **Filmow** | Réseau social cinéma (BR) | "Film" + suffixe "-ow" (flow, follow) |
| **TV Time** | Suivi séries | Descriptif |
| **Hobi** | Suivi séries | "Hobby" stylisé |

#### Observations sur la logique de nommage

Les noms qui durent dans le cinéma numérique ont trois points communs :
1. **Un ancrage dans le vocabulaire cinématographique** (Letterboxd : format d'image,
   MUBI : blu-ray, Trakt : traçage) — même opaque, il y a une intention.
2. **Court, prononçable dans plusieurs langues**, mémorisable en 2 secondes.
3. **Une dimension légèrement décalée** — pas de description littérale
   (pas "MyFilmDiary" ou "CinemaPlanner"), mais un concept qui laisse de la place
   à l'interprétation.

#### Différenciateurs à exploiter

Ce projet a une spécificité que les apps ci-dessus n'ont pas : le **festival**. L'ancrage
dans l'univers des festivals de cinéma est une signature forte et distinctive. Aucune
app existante ne porte ce positionnement dans son nom.

---

### 2.2 Vocabulaire technique du cinéma exploitable

#### Termes du tournage et de la production

| Terme | Définition | Potentiel de réemploi |
|---|---|---|
| **Claquette** (ou Clap) | Plaquette qui claque au début de chaque prise pour synchroniser son et image | Fort : marque un début, un moment, une prise |
| **Rushes** | Prises de vue brutes sélectionnées chaque jour pour être montrées à l'équipe | Fort : vos notes rapides = vos rushes à monter |
| **Scripte** | Technicien qui note chaque détail du tournage pour assurer la continuité | Fort : le logiciel est votre "scripte" |
| **Dépouillement** | Analyse scène par scène du scénario avant le tournage | Moyen : métaphore riche mais peu évocateur pour le public |
| **Raccord** | Correspondance entre deux plans pour assurer la continuité | Moyen : "raccorder" vos expériences de festivals |
| **Bout-à-bout** | Premier montage brut, sans retouches | Faible : peu connu |
| **Étalonnage** | Harmonisation des couleurs en post-production | Faible : trop technique |

#### Termes de la salle et de la projection

| Terme | Définition | Potentiel de réemploi |
|---|---|---|
| **Photogramme** | La plus petite unité du film : une image parmi les 24 par seconde | Fort : chaque film = un photogramme dans votre vie |
| **Bobine** | Rouleau de pellicule | Moyen : nostalgique, identifiable, mais déjà utilisé (La Bobine à Bréal) |
| **Pellicule** | Support argentique du film | Moyen : nostalgique, connoté |
| **Séance** | Une projection unique dans une salle | Fort : cœur du festival, double sens FR/EN |
| **Avant-première** | Première projection d'un film | Moyen : trop littéral |
| **Intertitre** | Texte inséré entre les plans (cinéma muet) | Fort : poétique, méconnu, disponible |
| **Fondu** | Transition progressive entre deux images | Moyen : évoque le passage |

#### Termes du scénario et de la narration

| Terme | Définition | Potentiel de réemploi |
|---|---|---|
| **Continuité** | Cohérence des détails d'un plan à l'autre | Fort : relier ses festivals sur le long terme |
| **Plan-séquence** | Long plan sans coupe | Faible : trop long comme nom |
| **Hors-Champ** | Ce qui existe en dehors du cadre visible | Fort : l'expérience du festival au-delà du film |
| **Générique** | Séquence de titre ou de fin d'un film | Moyen : identifiable, mais nom commun |
| **DCP** | Digital Cinema Package (format de distribution numérique) | Faible : trop technique |

---

### 2.3 Propositions de noms

> Pour chaque nom : intention, lecture double, disponibilité estimée du domaine `.fr`.
> **Important :** La disponibilité des domaines `.fr` n'a pas pu être vérifiée de façon
> automatisée — l'AFNIC exige une requête manuelle via son WHOIS. Vérification à faire
> sur [whois.afnic.fr](https://www.afnic.fr/noms-de-domaine/tout-savoir/whois-trouver-un-nom-de-domaine/)
> avant tout choix définitif.

---

#### Nom 1 — **Claquette**

**Intention :** La claquette (ou clap) est l'objet qui marque précisément le début de
chaque prise. C'est le signal de départ, le marqueur temporel du cinéma. Par extension,
l'app est celle qui marque chaque film vu — une claquette personnelle pour chaque
séance.

**Lecture double :** En argot français, "claquette" renvoie aussi aux tongs, aux savates —
une légèreté qui désacralise un peu le cinéphile trop sérieux. Ce décalage est une force.

**Sonorité :** Trois syllabes, féminin, très français, prononçable à l'international.

**Domaine .fr :** `claquette.fr` — présence web trouvée uniquement pour des cinémas
locaux et des articles définissant le terme. Potentiellement disponible. **À vérifier.**

---

#### Nom 2 — **Rushes**

**Intention :** Les rushes sont les prises de vue brutes capturées chaque jour de
tournage — du matériau brut, non monté, authentique. Vos notes prises pendant le
festival entre deux séances sont vos rushes personnels : des impressions brutes,
immédiates, qui n'ont pas encore été "montées" en critique. L'app est l'endroit où
vous accumulez ces rushes avant de les travailler.

**Lecture double :** "Rush" en anglais = urgence, précipitation — l'adrénaline du
festival, courir d'une salle à l'autre.

**Sonorité :** Court, international, déjà intégré dans le français courant
(on dit "les rushes" en France). Fonctionne en `.fr` et `.io`.

**Domaine .fr :** `rushes.fr` — une page Facebook "Rushes Cinéma" existe (média
indépendant). Le domaine `.fr` est possiblement enregistré. **Vérification prioritaire.**

---

#### Nom 3 — **Photogramme**

**Intention :** Un photogramme est la plus petite unité du cinéma : une image parmi
les 24 projetées chaque seconde. Seul, il ne raconte rien. C'est l'accumulation des
photogrammes qui crée le mouvement, l'histoire, l'émotion. Métaphore directe :
chaque film vu en festival est un photogramme dans la pellicule de votre vie cinéphile.
L'app assemble ces photogrammes en une timeline personnelle.

**Lecture double :** Le photogramme est aussi une technique photographique artistique
(Man Ray, Moholy-Nagy) — connotation artistique forte, ancrage dans l'histoire des arts
visuels.

**Sonorité :** Quatre syllabes, un peu long, mais mémorisable et distinctif. Très peu
de concurrence dans l'espace des apps.

**Domaine .fr :** `photogramme.fr` — aucun site web commercial trouvé. Terme trop
spécialisé pour avoir été enregistré par des noms de domaine opportunistes.
**Probablement disponible.**

---

#### Nom 4 — **Hors-Champ**

**Intention :** Le hors-champ est tout ce qui existe en dehors de ce que la caméra
filme — l'espace invisible mais présent, celui que le spectateur imagine. Métaphore :
l'expérience d'un festival, c'est aussi tout ce qui se passe "hors-champ" du film —
l'attente dans la file, le débat après la projection, la note griffonnée dans le noir,
la rencontre avec un inconnu qui partage votre enthousiasme. C'est cela que l'app capture.

**Lecture double :** "Hors-champ" est aussi une expression courante en critique de cinéma
francophone (la revue Hors-champ existe au Québec) — ancrage culturel cinéphile fort.

**Sonorité :** Deux mots, un trait d'union — évocateur, un peu littéraire. Fonctionne
particulièrement bien pour un public francophone cultivé.

**Domaine .fr :** `horschamp.fr` (sans tiret) ou `hors-champ.fr` — la revue
québécoise `hors-champ.com` existe, mais `.fr` semble libre.
**Probablement disponible.**

---

#### Nom 5 — **Scripte**

**Intention :** La scripte (poste traditionnellement féminin dans le cinéma français)
est la technicienne qui note absolument tout pendant le tournage — chaque détail de
costume, chaque position d'acteur, chaque prise retenue — pour garantir la continuité
du film. L'app est votre scripte personnelle : elle note tout, elle n'oublie rien,
elle assure la continuité de votre expérience festivalière.

**Lecture double :** "Script" en anglais = scénario. L'app écrit votre script cinéphile.

**Sonorité :** Deux syllabes, épuré, moderne. Fonctionne bien à l'international.

**Domaine .fr :** `scripte.fr` — aucun site trouvé sur ce terme comme marque.
**Probablement disponible.**

---

#### Nom 6 — **Pellicule**

**Intention :** La pellicule est le support argentique sur lequel s'inscrit le film.
Elle est à la fois fragile et indestructible, elle porte l'empreinte de la lumière.
Métaphore : l'app est votre pellicule personnelle — vous y inscrivez les empreintes
lumineuses que les films laissent en vous.

**Lecture double :** "Pellicule" a une connotation nostalgique et artisanale qui
contraste joliment avec le numérique. C'est aussi, en français argotique, un film (
"t'as vu la pellicule ?"). Trois syllabes fluides, très français.

**Sonorité :** Doux, évocateur, mémorisable.

**Domaine .fr :** `pellicule.fr` — terme générique potentiellement utilisé par des
laboratoires photo, des studios d'impression. **À vérifier.**

---

#### Nom 7 — **Fondu**

**Intention :** Le fondu est la transition cinématographique où une image disparaît
progressivement et laisse place à une autre. C'est le passage entre deux plans,
deux moments, deux films. Métaphore : l'app est le fondu enchaîné entre deux séances
— le moment de transition où vous notez vos impressions avant que la salle suivante
ne commence.

**Lecture double :** "Être fondu de cinéma" est une expression française (être passionné,
"fou"). Nom drôle et juste à la fois.

**Sonorité :** Court, deux syllabes, très mémorisable. Fonctionne dans les deux langues
(fondu/faded).

**Domaine .fr :** `fondu.fr` — terme générique (fondu au fromage, fondu en cuisine)
très probablement enregistré. **Probablement indisponible.**

---

#### Nom 8 — **Intertitre**

**Intention :** L'intertitre est ce texte qui s'insère entre les images dans le cinéma
muet — "Et pendant ce temps, à Paris..." — la voix narrative entre les scènes.
Métaphore : l'app est l'intertitre de votre vie festivalière, le texte qui relie les
images (les films) entre eux et donne un sens à l'ensemble.

**Lecture double :** "Intertitre" contient "titre" — votre propre titre pour chaque film,
votre propre intitulé pour chaque festival.

**Sonorité :** Quatre syllabes, distinctif, très peu de concurrence. Son côté "vieux
cinéma muet" donne une élégance rétro qui peut séduire les cinéphiles cultivés.

**Domaine .fr :** `intertitre.fr` — terme très spécialisé. **Probablement disponible.**

---

#### Nom 9 — **Cadrage** (avec réserve)

**Intention :** Le cadrage est l'acte de délimiter ce qu'on montre dans l'image —
choisir ce qui entre dans le cadre, ce qui reste hors-champ. Métaphore : avec l'app,
vous "cadrez" votre festival, vous choisissez ce que vous voulez capturer.

**Réserve importante :** Une app professionnelle existante pour réalisateurs s'appelle
déjà "Cadrage" (chercheur de champ numérique, disponible sur iOS et Android).
Le terme est donc déjà "brûlé" dans l'espace des apps cinéma. **Déconseillé.**

**Domaine .fr :** Probablement enregistré par l'éditeur de l'app.

---

#### Nom 10 — **Clap**

**Intention :** Version raccourcie de "claquette" — le son qui marque le début de
chaque prise. Court, percutant, international. Le clap, c'est l'instant T, le départ du
chronomètre, le signal que l'action commence.

**Lecture double :** "Clap" = applaudir en anglais (les festivals, c'est aussi ça).
"Clap" = coup sec, instantané, comme une note prise en vitesse.

**Sonorité :** Une syllabe, extrêmement mémorisable.

**Domaine .fr :** `clap.fr` — quasi-certainement enregistré (terme anglais très courant).
**Probablement indisponible.** Tester aussi `clapboard.fr`.

---

#### Nom 11 — **Continuité**

**Intention :** La continuité est le métier du cinéma qui consiste à assurer que rien
ne "casse" d'un plan à l'autre — que le verre est à moitié plein dans les deux plans
de la même scène, que l'acteur porte le même costume. Métaphore directe et riche :
l'app assure la continuité de votre cinéphilie à travers les années et les festivals.

**Lecture double :** "La continuité de son œuvre" — en art, la continuité est ce qui
donne un sens à une trajectoire. Vos festivals ont une continuité.

**Sonorité :** Cinq syllabes — un peu long. Mais `conti.fr` comme abréviation serait
élégant (dans le milieu, on dit "la conti" pour la continuité).

**Domaine .fr :** `continuité.fr` — terme très générique, certainement enregistré.
`conti.fr` — à vérifier. **Probablement indisponible pour le terme complet.**

---

#### Nom 12 — **Séance Noire**

**Intention :** Jeu de mots à plusieurs niveaux. "Séance" (projection) + "Noire"
(l'obscurité de la salle, mais aussi le film noir comme genre fondateur du cinéma de
festival). "Séance noire" évoque aussi les moments d'absorption totale dans un film —
quand on sort de la salle en ayant oublié le monde. C'est aussi une référence aux
"journées noires" des festivals (les journées marathon où on enchaîne 5 films).

**Lecture double :** En photographie argentique, la chambre noire est l'endroit où
les images se révèlent. L'app est l'endroit où vos impressions se révèlent.

**Sonorité :** Quatre syllabes, deux mots, évocateur. En anglais "Dark Screening"
perdrait la poésie — à garder en français.

**Domaine .fr :** `seancenoire.fr` — non trouvé comme marque. **Probablement disponible.**

---

#### Nom 13 — **Ouvreuse**

**Intention :** L'ouvreuse est le personnage emblématique des salles de cinéma à la
française — celle qui vous guide vers votre place dans le noir avec sa lampe de poche,
qui connaît la salle par cœur, qui vous accueille avant chaque film. C'est un métier
presque disparu, nostalgique, très français. L'app est votre ouvreuse numérique :
elle vous guide dans le programme, vous aide à trouver votre chemin dans le noir
du festival.

**Lecture double :** "Ouvrir" — l'app ouvre les portes des festivals, ouvre votre
regard sur des films.

**Sonorité :** Trois syllabes, très français, prononçable. Connotation chaleureuse
et humaine.

**Domaine .fr :** `ouvreuse.fr` — terme très spécifique et peu commercial. Bonne
chance de disponibilité. **Probablement disponible.**

---

### Tableau récapitulatif

| Nom | Terme source | Intention | Dispo .fr estimée | Recommandation |
|---|---|---|---|---|
| **Claquette** | Clapperboard | Marqueur de chaque prise/film | Probable | ★★★★★ |
| **Rushes** | Prises brutes du jour | Notes brutes = rushes à monter | Incertain | ★★★★☆ |
| **Photogramme** | Image unique d'un film | Chaque film = un photogramme de votre vie | Probable | ★★★★☆ |
| **Hors-Champ** | Espace hors de la caméra | L'expérience au-delà du film | Probable | ★★★★☆ |
| **Scripte** | Technicien de continuité | L'app note tout, comme une scripte | Probable | ★★★☆☆ |
| **Pellicule** | Support argentique | Empreinte de lumière = souvenir de film | Incertain | ★★★☆☆ |
| **Fondu** | Transition entre plans | Passage entre deux séances | Probable prise | ★★★☆☆ |
| **Intertitre** | Texte inter-scènes (muet) | Voix narrative entre les films | Probable | ★★★☆☆ |
| ~~Cadrage~~ | Délimitation du champ | App existante déjà nommée Cadrage | — | ✗ déconseillé |
| ~~Clap~~ | Claquette courte | Trop générique, domaine pris | Improbable | ✗ |
| **Continuité** | Cohérence inter-plans | Continuité cinéphile sur les années | Improbable | ★★★☆☆ |
| **Séance Noire** | Séance + film noir | Absorption dans le festival | Probable | ★★★☆☆ |
| **Ouvreuse** | Placière de cinéma | Guide du festival, figure nostalgique | Probable | ★★★★☆ |

### Recommandation finale

**Premier choix :** `Claquette`
Le terme est parfaitement reconnaissable pour un cinéphile francophone sans explication,
fonctionne en anglais par glissement (clapperboard → clap), évoque un début, un marqueur
précis, une action. Il n'est pas utilisé comme marque dans l'écosystème des apps cinema.
Le domaine `claquette.fr` a de bonnes chances d'être disponible.

**Alternative forte :** `Ouvreuse`
Plus poétique, plus différenciante, avec une dimension humaine et nostalgique qui
correspond bien à l'esprit d'un outil artisanal pensé par un cinéphile pour des
cinéphiles. Moins évidente à l'international mais plus mémorable en France.

**Pour un déploiement international futur :** `Rushes`
Court, fonctionne en français et en anglais, ancré dans le métier du cinéma.
Le risque principal est la disponibilité du domaine.

---

## 3. Forme et expérience utilisateur

### Choix : PWA mobile-first, auto-hébergée

**Progressive Web App (PWA)** hébergée sur un serveur personnel (VPS ou serveur local).

**Pourquoi une PWA et pas une app native :**
- Fonctionne sur tous les appareils sans installation via l'App Store
- S'installe sur l'écran d'accueil du téléphone comme une vraie application
- Fonctionne **offline** pendant les séances (service workers : le programme et le
  journal sont disponibles sans réseau, les données se synchronisent quand le réseau
  revient)
- Une seule codebase pour mobile et desktop
- Auto-hébergeable sur le serveur existant (même serveur que Jellyfin)

**Pourquoi mobile-first et pas desktop-first :**
- L'usage critique est la prise de note rapide entre deux séances, sur téléphone
- La planification sur desktop est un usage secondaire, confortable, pas urgent
- Mobile-first force une interface épurée qui reste bonne sur desktop

### Deux modes d'interface

**Mode Festival (téléphone)** : Interface minimaliste, optimisée pour la vitesse.
Une main, des gestes. Actions : noter, marquer comme vu, voir la prochaine séance.

**Mode Planning/Archive (desktop)** : Interface complète avec le programme du festival
en grille, les sélections, les statistiques, les archives.

---

## 4. Fonctionnalités

### Module 1 — Gestion des festivals

```
CRÉER UN FESTIVAL
- Nom, dates, lieu, édition
- Logo / affiche optionnels

IMPORTER LE PROGRAMME
- Méthode A : import JSON structuré (format défini par l'app)
- Méthode B : import CSV (titre, date, heure, salle, durée, réalisateur)
- Méthode C : saisie manuelle film par film
- Le programme est une liste de séances, pas de films (un film peut avoir plusieurs séances)

ENRICHISSEMENT AUTOMATIQUE
- Pour chaque film du programme : recherche TMDb via titre + année
- Récupérer : affiche, synopsis, pays, langue, genre, réalisateur, casting
- Stocker localement pour fonctionner offline
```

### Module 2 — Sélection personnelle

```
PARCOURIR LE PROGRAMME
- Vue grille : par jour et par heure (type grille TV / programme de salle)
- Vue liste : filtrée par genre, pays, réalisateur, section festival
- Vue carte : si les salles ont des coordonnées GPS

CONSTRUIRE SA SÉLECTION
- Ajouter / retirer une séance de sa sélection
- Détection automatique des conflits d'horaires (chevauchement de séances)
  → Alerte visuelle et suggestion de la séance alternative du même film
- Marquer "intéressé" sans mettre dans la sélection (watchlist légère)
- Note de priorité : haute / moyenne / basse

EXPORTER
- Export ICS (iCalendar) de la sélection → Google Calendar, Apple Calendar
- PDF récapitulatif de la sélection par jour
```

### Module 3 — Journal de festival (usage mobile)

```
MARQUER COMME VU
- Bouton rapide sur la fiche séance : "J'ai vu ce film"
- Horodatage automatique

PRISE DE NOTE RAPIDE (interface mobile optimisée)
- Note texte libre (dictée vocale possible via l'API Speech du navigateur)
- Note rating immédiat : 5 étoiles ou demi-étoiles
- Tags rapides par tap : #emouvant #surprenant #décevant #chef-oeuvre #à-revoir
- Temps de saisie cible : < 30 secondes

SUIVI EN TEMPS RÉEL
- Widget "Ma prochaine séance" sur la page d'accueil
  → Titre, heure, salle, temps restant
- Notification (si PWA installée) 15 minutes avant chaque séance sélectionnée
```

### Module 4 — Développement post-festival

```
COMPLÉTER SES NOTES
- Pour chaque film vu, accéder aux notes rapides prises pendant le festival
- Éditeur de texte enrichi pour développer en critique structurée
- Champs optionnels : comparaison avec filmographie du réalisateur, contexte du festival

EXPORT VERS LETTERBOXD
- Pour chaque film vu + noté : préparer un log Letterboxd
  → Pré-remplir : titre, date de visionnage, rating, texte de critique
  → Export en CSV compatible avec l'import Letterboxd
  → Ou affichage d'un formulaire pré-rempli à copier-coller

STATISTIQUES DU FESTIVAL
- Nombre de films vus
- Répartition par genre, pays de production, langue
- Durée totale de visionnage
- Distribution des ratings
- Réalisateurs les plus représentés dans la sélection
```

### Module 5 — Archive multi-festivals

```
VUE D'ENSEMBLE
- Tous les festivals auxquels tu as participé, chronologiquement
- Statistiques cumulées sur plusieurs années

RECHERCHE TRANSVERSALE
- Retrouver tous les films d'un réalisateur vus en festival
- Retrouver tous les films vus dans une période, un genre, un pays
- Retrouver tous les films d'une édition d'un festival

TIMELINE PERSONNELLE
- Vue chronologique de tous les films vus en festival, tous festivals confondus
- Filtrable par année, festival, rating

COMPARAISON INTER-FESTIVALS
- Films vus à Cannes 2025 vs Deauville 2024 vs Clermont 2025
- Évolution de ses goûts (distribution des ratings dans le temps)
```

### Module 6 — Connexion Letterboxd (optionnel)

```
IMPORT WATCHLIST
- Charger l'export CSV Letterboxd
- Croiser avec le programme du festival : signaler les films en compétition
  qui sont sur ta watchlist Letterboxd

ENRICHISSEMENT
- Pour les films du programme déjà présents dans ton historique Letterboxd
  (export CSV), afficher ta note passée et ta critique
```

---

## 5. Stack technique

### Choix structurants

| Décision | Choix | Justification |
|---|---|---|
| Framework | Next.js 15 (App Router) | Déjà maîtrisé, déployable sur Cloudflare Pages, PWA possible |
| Langage | TypeScript | Typage strict, meilleure expérience avec les APIs externes |
| Styling | Tailwind CSS | Déjà utilisé sur le portfolio, mobile-first natif |
| Base de données | SQLite via fichier local | Légère, zéro infrastructure, parfaite pour usage personnel |
| ORM | Drizzle ORM | TypeScript-first, compatible SQLite, migrations propres |
| PWA | next-pwa ou service workers manuels | Offline obligatoire pour l'usage mobile festival |
| API films | TMDb API (gratuite) | La plus complète, bien documentée |
| Déploiement | Auto-hébergé (même serveur que Jellyfin) | Pas de coût, données locales, contrôle total |

### Arborescence du projet

```
[nom-du-projet]/
├── app/                          Next.js App Router
│   ├── (auth)/                   Authentification simple (usage perso)
│   ├── festivals/                Liste et détail des festivals
│   │   ├── [id]/
│   │   │   ├── programme/        Grille des séances
│   │   │   ├── selection/        Ma sélection
│   │   │   ├── journal/          Notes et films vus
│   │   │   └── stats/            Statistiques du festival
│   ├── archive/                  Vue multi-festivals
│   ├── api/                      Routes API Next.js
│   │   ├── festivals/
│   │   ├── seances/
│   │   ├── journal/
│   │   └── tmdb/                 Proxy TMDb (cacher la clé API)
│   └── layout.tsx
├── components/
│   ├── festival/
│   │   ├── ProgrammeGrid.tsx     Grille des séances
│   │   ├── SeanceCard.tsx        Carte d'une séance
│   │   ├── ConflictAlert.tsx     Alerte conflit d'horaires
│   │   └── NextSeance.tsx        Widget "prochaine séance"
│   ├── journal/
│   │   ├── QuickNote.tsx         Saisie rapide mobile
│   │   ├── RatingStars.tsx       Notation rapide
│   │   └── TagPicker.tsx         Tags prédéfinis
│   └── ui/                       Composants génériques
├── lib/
│   ├── db/
│   │   ├── schema.ts             Drizzle ORM + schéma
│   │   └── migrations/
│   ├── tmdb.ts                   Client TMDb API
│   ├── letterboxd.ts             Parser export CSV Letterboxd
│   ├── ics.ts                    Générateur de fichiers ICS
│   └── importers/
│       ├── json.ts
│       └── csv.ts
├── public/
│   ├── manifest.json             Manifest PWA
│   └── sw.js                     Service Worker (offline)
└── docker/
    └── docker-compose.yml        Déploiement auto-hébergé
```

### Schéma de base de données

```typescript
// lib/db/schema.ts (Drizzle ORM)

festivals {
  id, nom, annee, dateDebut, dateFin, lieu, description, logoUrl
}

films {
  id, titre, titreFr, titreOriginal, annee,
  realisateur, pays, langue, dureeMin,
  synopsisFr, affichePath,
  tmdbId, imdbId, genres[]
}

seances {
  id, festivalId, filmId,
  dateHeure, salle, section,
  noteOrga
}

selections {
  id, seanceId, priorite,
  interet     // true = dans la sélection, false = juste "intéressé"
}

logs {
  id, seanceId,
  vuLe, heureFin,
  noteRapide,    // 0.5 à 5.0
  noteTexte,     // Texte court saisi pendant le festival
  critique,      // Texte long développé après
  tags[],
  exporteLetterboxd  // boolean
}
```

### APIs et intégrations

```
TMDb API (https://api.themoviedb.org/3)
  → Clé gratuite via compte TMDb
  → Utilisée : recherche de film, métadonnées, affiche
  → Mise en cache locale dans la BDD

Letterboxd
  → Import via export CSV Letterboxd (Settings > Import & Export)
  → Export vers Letterboxd : CSV au format attendu par l'import Letterboxd
     (colonnes : Name, Year, WatchedDate, Rating, Review)

ICS (iCalendar)
  → Généré côté serveur (ical.js ou manuellement)
  → Format standard compatible Google Calendar, Apple Calendar, Outlook
```

### Déploiement

```yaml
# docker/docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3001:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/public/uploads
    environment:
      - DATABASE_URL=file:/app/data/app.db
      - TMDB_API_KEY=${TMDB_API_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
```

Accès via Nginx Proxy Manager (déjà en place sur le serveur Jellyfin) :
`[nom].samuel-lecomte.fr` → container port 3001.

---

## 6. Parcours utilisateur détaillé

### Avant le festival : planification (desktop)

```
1. Créer un nouveau festival : "Festival de Cannes 2026"
2. Importer le programme quand il est publié (CSV ou JSON)
3. L'app génère automatiquement les fiches films via TMDb
4. Parcourir le programme en vue grille
5. Ajouter des séances à la sélection, voir les conflits
6. Exporter la sélection en ICS → synchronisé dans le calendrier
```

### Pendant le festival : usage mobile

```
1. Ouvrir l'app sur le téléphone (PWA installée, mode offline)
2. Page d'accueil : widget "Prochaine séance dans 45 minutes — Pauvres Créatures, Lumière"
3. Après la séance : ouvrir le film, appuyer sur "Vu"
4. Saisir une note rapide en 20 secondes (3 étoiles + 2 tags)
5. Notification 15 min avant la prochaine séance sélectionnée
```

### Après le festival : archivage

```
1. Ouvrir les logs de la semaine
2. Développer les notes rapides en critiques pour les films marquants
3. Générer l'export Letterboxd CSV → importer sur Letterboxd
4. Consulter les stats du festival : 12 films vus, 8 pays différents, note moy. 3.8/5
5. Le festival s'ajoute à l'archive — consultable d'ici 10 ans
```

---

## 7. Phases de développement suggérées

### Phase 1 — Noyau festival (4 à 5 jours)
- Modèle de données Drizzle + migrations
- CRUD festivals, films, séances
- Import programme CSV
- Enrichissement TMDb
- Page programme (vue liste)

### Phase 2 — Sélection et planification (3 à 4 jours)
- Système de sélection + détection de conflits
- Vue grille (timeline par jour)
- Export ICS

### Phase 3 — Journal mobile (3 à 4 jours)
- Interface QuickNote mobile-first
- Marquage "vu", rating, tags
- Widget "prochaine séance"
- PWA : manifest + service worker offline

### Phase 4 — Archivage et export (2 à 3 jours)
- Vue archive multi-festivals
- Statistiques par festival
- Export Letterboxd CSV
- Critiques longues (éditeur texte)

### Phase 5 — Polish (2 jours)
- Notifications Web Push
- Thème sombre
- Tests sur mobile réel
- Documentation de déploiement

**Durée totale estimée : 4 à 6 semaines de travail effectif.**

---

## 8. Questions ouvertes à trancher avant de commencer

1. **Nom du projet :** Claquette, Ouvreuse, Rushes, ou autre ?
   → Vérifier la disponibilité des domaines `.fr` sur [whois.afnic.fr](https://www.afnic.fr)
   avant de décider.

2. **Authentification :** Simple mot de passe local (usage perso, un utilisateur) ou
   NextAuth avec provider (Google, GitHub) pour accéder depuis plusieurs appareils ?

3. **Base de données :** SQLite fichier local sur le serveur (simple) ou Turso
   (SQLite distribué, accès depuis partout sans VPN) ?

4. **Stockage des affiches :** Télécharger et stocker localement (offline garanti),
   ou pointer vers les URLs TMDb (requiert réseau) ?
   → Recommandation : stocker localement.

---

## 9. Dépendances principales

```json
{
  "dependencies": {
    "next": "15.x",
    "react": "19.x",
    "typescript": "5.x",
    "tailwindcss": "4.x",
    "drizzle-orm": "latest",
    "better-sqlite3": "latest",
    "next-pwa": "latest",
    "ical.js": "latest",
    "papaparse": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "@types/better-sqlite3": "latest"
  }
}
```

---

*Document de spécification v2.0 — À transmettre à Claude Code pour démarrer l'implémentation.*
