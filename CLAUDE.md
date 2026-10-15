# Atelier Khattat : consignes de travail

Application de calligraphie arabe, en français. Le site public (GitHub Pages) est republié à chaque modification de `site/` sur `main`.

## À chaque mise à jour

1. Modifier `src/`. Ne jamais modifier à la main `site/index.html` ni `artifact/index.html` : `npm run build` les régénère.
2. Donner un numéro à la mise à jour, selon la règle de l'auteur : **+0,01** pour une petite mise à jour, **+0,1** pour une moyenne, **+1** pour une grande.
   ```
   node tools/versions.js <minime|moyenne|grande> "Nouveauté, en une phrase simple." ["Autre nouveauté." …]
   ```
   - L'outil calcule le numéro, ajoute la version datée en tête de `versions.json` et met `package.json` au même numéro. Ne pas faire le calcul à la main.
   - **minime** : une correction, un réglage, un texte, une petite fonction. **moyenne** : une nouvelle fonction ou une nouvelle série de modèles, de formes ou d'effets. **grande** : une refonte de l'interface ou plusieurs nouveautés importantes à la fois.
   - Les nouveautés s'affichent dans l'atelier (clic sur le numéro de version) : les écrire pour l'utilisateur, sans jargon technique.
   - Une seule nouvelle version par livraison : si on reprend une mise à jour pas encore publiée, compléter l'entrée en tête au lieu d'en créer une autre.
3. `npm run build` (il refuse un numéro qui ne suit pas la règle), puis `npm test`.
4. Commit sur `main` avec l'identité noreply du compte : `hamadi <175523975+Midoubiba2024@users.noreply.github.com>`, puis push.
5. Republier `artifact/index.html` dans l'artefact Claude (voir README, « Dans Claude »).

## Règles

- Le site est public : ne jamais télécharger ni copier une œuvre trouvée en ligne ou reçue en image. Les images servent à repérer des genres de composition ; l'atelier en tire des modèles originaux.
- Polices : seulement des licences libres compatibles avec un usage commercial (OFL, Apache 2.0, Bitstream Vera, domaine public).
- Les textes vocalisés (tashkīl) doivent garder exactement les lettres du texte d'origine : `tests/tashkil.node.js` le vérifie.
