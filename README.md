# Atelier Khattat

Une phrase en arabe, près de 200 styles calligraphiques, 86 modèles de tableaux, le tashkīl, et des fichiers nets à toutes les tailles : SVG, PDF, EPS et DXF en vectoriel, PNG, JPG et WEBP en image.

## Ce que fait l'atelier

- **195 styles d'écriture** en 12 familles : naskh, thuluth, diwani, ruqʿa, kufi, maghribi, nastaʿlīq, soudani, décoratif, couleur, moderne. Toutes les polices sont sous licence libre.
- **86 modèles de tableaux** en 10 thèmes : shamsa, levha, musanna, mihrab, sceaux, compositions (pyramide, œuf, goutte, médaillon en anneaux, mosaïque, tughra, médaillon ailé, hilye, lettres semées), prénoms, fêtes, mariage, motifs géométriques, découpe…
- **Tashkīl** : éditeur lettre par lettre, retrait du tashkīl, harakat en couleur, et vocalisation automatique dans Claude.
- **Mise en forme** :
  - 23 formes : arc, cercle, sceau, cœur, vague, spirale, loupe… ;
  - compositions par lignes : remplir une forme (pyramide, ovale, œuf, goutte, mihrab…), anneaux concentriques, mosaïque de tuiles colorées, tughra, médaillon ailé, panneau hilye ;
  - répétitions en miroir, en rosace et en kaléidoscope ;
  - une couleur par ligne, contre-formes colorées, lettres semées autour du texte ;
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
  - sur ordinateur, une barre d'outils verticale (Texte, Styles, Modèles, Forme, Couleurs, Effets, Cadre, Fond, Format), un seul panneau ouvert à la fois et l'aperçu toujours visible ;
  - sur téléphone, l'aperçu reste en haut de l'écran et les outils passent dans une barre en bas ;
  - un bouton « Télécharger » toujours à portée de main.
- **Organisation** :
  - « Mes créations » ;
  - code de création pour passer d'un appareil à l'autre ;
  - annuler / rétablir ;
  - plein écran avec maquettes.

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
| `tests/` | Les tests du moteur et de l'atelier. |
| `tools/serve.js` | Le petit serveur local. |
| `.github/workflows/pages.yml` | La publication sur GitHub Pages. |

## Modifier l'atelier

1. Modifier les fichiers de `src/`. Ne pas modifier `site/index.html` à la main : il est régénéré.
2. Lancer `npm run build`.
3. Vérifier avec `npm start`, puis avec `npm test`.

## Tests

`npm test` lance les tests du moteur, puis ceux de l'atelier dans le navigateur. Le serveur local démarre tout seul.

- Il faut Google Chrome installé. Sinon, indiquer un Chrome ou un Chromium dans la variable `CHROME_PATH`.
- Les captures et les fichiers produits vont dans `out/`.
- `npm run test:tout` ajoute la comparaison des rendus SVG, Canvas, PDF et EPS. Elle demande Linux avec poppler-utils, ghostscript, et Python avec Pillow et numpy.

## Mettre le site en ligne

### Sur GitHub Pages

Le dépôt est privé. Sur un compte GitHub gratuit, GitHub Pages n'est pas disponible pour un dépôt privé. Sur un compte payant, le site publié reste visible par tous, même si le dépôt est privé. La publication est prête et s'active ainsi :

1. Rendre le dépôt public : *Settings → General → Change repository visibility*. Avec GitHub Pro, on peut aussi garder le dépôt privé et créer la variable `PAGES_ENABLED` = `true` (*Settings → Secrets and variables → Actions → Variables*).
2. *Settings → Pages → Source* : choisir **GitHub Actions**.
3. *Actions → Publier le site → Run workflow*. Ensuite, chaque modification de `site/` sur `main` republie le site automatiquement.

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
