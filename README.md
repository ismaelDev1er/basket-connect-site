# Basket Connect — code source initial

Cette archive contient un socle de départ web + Android, construit selon le cahier des charges Basket Connect v1.0.

## Contenu
- `index.html`, `style.css`, `app.js` : interface web responsive et interactions de base.
- `config.js` : configuration client Supabase (valeurs d'exemple à remplacer).
- `schema.sql` : première proposition de schéma PostgreSQL/RLS pour un NOUVEAU projet Supabase de test.
- `package.json`, `capacitor.config.json` : base du wrapper Android Capacitor.
- `manifest.webmanifest` : manifeste PWA.

## Étape 1 — Supabase de TEST
1. Crée un nouveau projet Supabase séparé.
2. Dans SQL Editor, examine `schema.sql` puis exécute-le uniquement dans ce nouveau projet vide de test.
3. Copie l'URL du projet et sa clé publishable/anon dans `config.js`.
4. Dans les paramètres Auth, configure la confirmation e-mail et les URL de redirection pour ton site de test.
5. Vérifie les politiques RLS avant d'utiliser des données réelles.

**Ne lance pas `schema.sql` sur un projet existant ou de production.** Le script est un socle initial, pas un audit de sécurité complet. Les modules messagerie, administration, stockage, candidatures et événements nécessitent encore leurs écrans et leurs tests d'accès.

## Étape 2 — Web
Ouvre `index.html` pour une prévisualisation locale (la connexion Supabase requiert Internet). Pour publier, dépose les fichiers à la racine d'un dépôt GitHub Pages ou dans le dossier de publication choisi.

## Étape 3 — Android
Prérequis : Node.js LTS et Android Studio avec Android SDK.
Dans le dossier du projet :
```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```
Dans Android Studio, teste sur un appareil ou émulateur, puis prépare un Android App Bundle (`.aab`) signé pour Google Play.

## Important
- Ne jamais intégrer `service_role` dans le navigateur ou l'application.
- Une clé publique Supabase n'est pas un secret : la sécurité dépend notamment des politiques RLS correctes.
- Ne jamais exposer les données privées, messages, e-mails ou documents d'identité.
- Les profils publics ne doivent contenir que les champs explicitement autorisés.
- La version fournie est un socle MVP évolutif : elle ne prétend pas encore implémenter chaque fonctionnalité du cahier des charges.
