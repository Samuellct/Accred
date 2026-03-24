# Format d'import des seances

Deux formats acceptes : CSV et JSON.

## Format CSV

Separateur : point-virgule (`;`)
Encodage : UTF-8
Les lignes commencant par `#` sont ignorees (commentaires).
La premiere ligne non-commentee est l'en-tete.

### Colonnes

| Colonne  | Requis | Format         | Description                         |
|----------|--------|----------------|-------------------------------------|
| titre    | oui    | texte          | Titre du film (tel qu'affiche)      |
| date     | oui    | YYYY-MM-DD     | Date de la seance                   |
| heure    | oui    | HH:mm          | Heure de debut                      |
| salle    | non    | texte          | Nom de la salle                     |
| section  | non    | texte          | Section (Competition, UCR, etc.)    |
| duree    | non    | entier (min)   | Duree du film en minutes            |
| format   | non    | texte          | Format projection (IMAX, 35mm, ...) |
| notes    | non    | texte          | Notes libres                        |

Les champs contenant des points-virgules doivent etre entoures de guillemets doubles : `"Film; titre bizarre"`.

### Exemple

```csv
# Import seances Cannes 2026
titre;date;heure;salle;section;duree
Anora;2026-05-13;10:00;Grand Theatre Lumiere;Competition;139
The Substance;2026-05-14;18:30;Salle Debussy;Un Certain Regard;141
```

Telecharger le modele : `/templates/import_seances.csv`

## Format JSON

Deux structures acceptees.

### Tableau direct

```json
[
  { "titre": "Anora", "date": "2026-05-13", "heure": "10:00", "salle": "Grand Theatre Lumiere" },
  { "titre": "The Substance", "date": "2026-05-14", "heure": "18:30" }
]
```

### Avec wrapper

```json
{
  "seances": [
    { "titre": "Anora", "date": "2026-05-13", "heure": "10:00" }
  ]
}
```

Les cles peuvent etre en francais (`titre`, `salle`, `section`) ou en anglais (`title`, `venue`). La cle francaise a la priorite en cas de doublon.

## Regles de validation

- `date` doit etre au format `YYYY-MM-DD` et representer une date valide
- `heure` doit etre au format `HH:mm` (24h)
- `duree` doit etre un entier positif (minutes)
- Les lignes/elements invalides sont signales avec leur numero et le champ en cause
- Les lignes valides sont importees meme si d'autres lignes ont des erreurs

## Apres l'import

Les films importes n'ont pas encore de correspondance TMDb. Apres l'import, la page de review TMDb permet d'enrichir chaque film avec ses donnees officielles (poster, synopsis, realisateur, etc.).
