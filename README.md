# Atelier Khattat

Une phrase en arabe, près de 200 styles calligraphiques, 86 modèles de tableaux, le tashkīl, et des fichiers nets à toutes les tailles : SVG, PDF, EPS et DXF en vectoriel, PNG, JPG et WEBP en image.

## Ce que fait l'atelier

- **195 styles d'écriture** en 12 familles : naskh, thuluth, diwani, ruqʿa, kufi, maghribi, nastaʿlīq, soudani, décoratif, couleur, moderne. Toutes les polices sont sous licence libre.
- **86 modèles de tableaux** en 10 thèmes : shamsa, levha, musanna, mihrab, sceaux, compositions (pyramide, œuf, goutte, médaillon en anneaux, mosaïque, tughra, médaillon ailé, hilye, lettres semées), prénoms, fêtes, mariage, motifs géométriques, découpe…
- **Variations** : six mises en page de votre phrase tirées au sort (écriture, ambiance, forme), appliquées en un clic.
- **Tashkīl** :
  - un seul bouton qui retire le tashkīl, le remet, ou l'ajoute aux textes de la bibliothèque et des modèles, dont l'atelier connaît la vocalisation ;
  - éditeur lettre par lettre, harakat en couleur ;
  - vocalisation automatique de n'importe quelle phrase dans la version Claude de l'atelier.
- **Mise en forme** :
  - 26 formes : arc, cercle, sceau, cœur, vague, spirale, loupe, tughra… ;
  - compositions par lignes : remplir une forme (pyramide, ovale, œuf, goutte, mihrab…), anneaux concentriques, mosaïque de tuiles colorées, tughra, médaillon ailé, panneau hilye ;
  - répétitions en miroir, en rosace et en kaléidoscope ;
  - une couleur par ligne, contre-formes colorées, lettres semées autour du texte ;
  - une légende en lettres latines sous le dessin ou au-dessus (prénom, traduction), en quatre polices ;
  - dans un format fixe, la taille s'ajuste toute seule quand on change de forme ;
  - effets : relief 3D, néon, liseré, lettres creuses ;
  - 16 cadres (dont filet pointillé), 9 motifs de fond (dont points du calame et écriture répétée), dégradés et fonds partagés.
- **Téléchargements** :
  - SVG, PDF, EPS, DXF (découpe laser ou vinyle) ;
  - PNG jusqu'à ×8 ;
  - planche PDF de comparaison et lot .zip de plusieurs styles.
- **Apprendre à écrire** :
  - le tableau des 19 familles de lettres dans sept écritures ;
  - l’étude d’une lettre : ses formes (isolée, initiale, médiane, finale), sa mesure en points du calame, le cercle d’Ibn Muqla, et un tracé à la souris ou au doigt, noté ;
  - les grandes écritures, les genres de composition (musanna, shamsa, goutte, tughra, hilye…) et leurs gabarits géométriques ;
  - une feuille d’exercice A4 en PDF, réglée sur la largeur du calame.
- **Interface** :
  - sur ordinateur et tablette en paysage, une barre d'outils verticale (Texte, Styles, Modèles, Forme, Couleurs, Effets, Cadre, Fond, Format), un seul panneau ouvert à la fois et l'aperçu toujours visible ;
  - sur téléphone et tablette en portrait, l'aperçu en haut, les réglages dessous et les outils dans une barre en bas ; l'aperçu se réduit quand on descend dans les réglages ;
  - téléphone en paysage : l'aperçu et les réglages côte à côte ;
  - un bouton « Télécharger » toujours à portée de main.
- **Aperçu** :
  - zoom à la molette, au pincement ou aux boutons, vignette de navigation quand on zoome ;
  - repères (axes, tiers, marges de sécurité, boîte du texte) et cotes en taille réelle ;
  - ce qui dépasse d'un format fixe reste visible en dézoomant, sous un voile.
- **Organisation** :
  - « Mes créations » ;
  - code de création pour passer d'un appareil à l'autre ;
  - lien de partage : il ouvre la création dans l'atelier en ligne, sur n'importe quel appareil ; partage natif sur téléphone ;
  - annuler / rétablir ;
  - plein écran avec maquettes ;
  - le numéro de version sous le nom de l'atelier : un clic montre les nouveautés de chaque version, une pastille signale une version que l'on n'a pas encore vue.

## Lancer l'atelier sur son ordinateur

Il faut [Node.js](https://nodejs.org) 18 ou plus récent.

```
npm install
npm start
```

Puis ouvrir http://localhost:8766 dans le navigateur. Sous Windows, un double-clic sur `lancer-atelier.cmd` fait les deux : il lance le serveur et ouvre le navigateur (fermer sa fenêtre arrête l'atelier).

Un double-clic sur `site/index.html` ne suffit pas : l'atelier charge ses polices et son moteur de texte, il lui faut un serveur, même local.

## Contenu du dépôt

| Élément | Rôle |
| --- | --- |
| `src/` | Les sources. Le moteur (`engine.js` texte, `shape.js` formes, `fx.js` effets, `ornament.js` cadres et motifs, `export.js` fichiers, `mockup.js` maquettes), puis l'interface (`app.html` et les 14 parties de `app/`). |
| `lancer-atelier.cmd` | Windows : lance le serveur local et ouvre l'atelier dans le navigateur. |
| `site/` | Le site prêt à publier : `index.html`, généré par `npm run build`, les polices et leurs licences, HarfBuzz (`harfbuzz.wasm`, avec un repli en JavaScript `hb-fallback.js`) et Clipper (`clipper.js`). |
| `build.js` | Assemble `src/` en `site/index.html`. Produit aussi `artifact/index.html`, la version à publier dans Claude. |
| `copyrights.json` | Les auteurs des polices, affichés dans « Polices et licences ». |
| `versions.json` | Les versions de l'atelier, la plus récente en premier, avec leurs nouveautés. Le numéro affiché sous le nom de l'atelier vient d'ici. |
| `tests/` | Les tests du moteur et de l'atelier. |
| `tools/serve.js` | Le petit serveur local. |
| `tools/versions.js` | La règle des numéros de version et l'outil qui crée une nouvelle version. |
| `CLAUDE.md` | Les consignes de travail suivies par Claude pour chaque mise à jour. |
| `.github/workflows/pages.yml` | La publication sur GitHub Pages. |

## Modifier l'atelier

1. Modifier les fichiers de `src/`. Ne pas modifier `site/index.html` à la main : il est régénéré.
2. Donner un numéro à la mise à jour (voir « Numéros de version »).
3. Lancer `npm run build`.
4. Vérifier avec `npm start`, puis avec `npm test`.

## Numéros de version

Le numéro avance de **0,01** pour une petite mise à jour, de **0,1** pour une mise à jour moyenne et de **1** pour une grande : après 7.42, une petite mise à jour donne 7.43, une moyenne 7.52, une grande 8.42.

```
npm run nouvelle-version -- minime "Ce qui change, en une phrase."
npm run nouvelle-version -- moyenne "Première nouveauté." "Deuxième nouveauté."
```

L'outil calcule le numéro, ajoute la version datée du jour en tête de `versions.json` et met `package.json` au même numéro. `npm run build` refuse un numéro qui ne suit pas la règle.

- **minime** : une correction, un réglage, un texte, une petite fonction.
- **moyenne** : une nouvelle fonction ou une nouvelle série de modèles, de formes ou d'effets.
- **grande** : une refonte de l'interface ou plusieurs nouveautés importantes à la fois.

## Tests

`npm test` lance les tests du moteur, puis ceux de l'atelier dans le navigateur. Le serveur local démarre tout seul.

- Il faut Google Chrome installé. Sinon, indiquer un Chrome ou un Chromium dans la variable `CHROME_PATH`.
- Les captures et les fichiers produits vont dans `out/`.
- `npm run test:tout` ajoute la comparaison des rendus SVG, Canvas, PDF et EPS. Elle demande Linux avec poppler-utils, ghostscript, et Python avec Pillow et numpy.

## Mettre le site en ligne

### Sur GitHub Pages

Le dépôt est public et la publication est active : chaque modification de `site/` sur `main` republie le site automatiquement, par l'action « Publier le site ».

Pour la réactiver ailleurs : *Settings → Pages → Source* : choisir **GitHub Actions**, puis *Actions → Publier le site → Run workflow*. Un dépôt privé demande un compte payant et la variable `PAGES_ENABLED` = `true` (*Settings → Secrets and variables → Actions → Variables*) ; le site publié reste alors visible par tous.

Adresse du site : https://midoubiba2024.github.io/atelier-khattat/

### Dans Claude

La version actuelle est un artefact Claude privé : https://claude.ai/artifact/TBG6v5iUzAMH6rLZfFhuFg

Pour le mettre à jour :

1. Lancer `npm run build`.
2. Publier `artifact/index.html` avec les fichiers de `site/`, sauf `index.html`.
3. Déclarer les capacités `downloads` et `sample` (avec images).

## Ce qui change selon l'endroit

- **Dans Claude**, la vocalisation automatique et « Imiter un tableau » font appel à Claude. Les téléchargements passent par la confirmation de Claude.
- **Dans l'application Claude sur ordinateur**, l'enregistrement direct n'est pas possible. La fenêtre « Votre fichier est prêt » propose alors d'ouvrir l'atelier dans le navigateur, avec le code de la création, ou de copier l'image ou le SVG.
- **Sur un site classique** (GitHub Pages, serveur local), les téléchargements sont directs. Les deux fonctions qui font appel à Claude sont masquées : « Imiter un tableau » reprend seulement les couleurs de l'image.

## Licences

- Code de l'atelier : tous droits réservés.
- Polices : licences libres (SIL Open Font License 1.1, Apache 2.0, Bitstream Vera, domaine public). Le texte de chaque licence est dans `site/fonts/licenses/`, et les auteurs dans `copyrights.json`. Certaines polices ont un nom réservé (Reserved Font Name) : elles sont livrées sans modification.
- HarfBuzz : licence MIT (« Old MIT »).
- Clipper (Angus Johnson) : Boost Software License 1.0.
