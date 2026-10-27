# BasketBF

Plateforme nationale du basketball burkinabè : clubs, joueurs, matchs et classement.
Le site lit et écrit ses données dans Supabase. Il ne contient aucune donnée fictive.

## Contenu

```
index.html          site public, connexion, inscription, mot de passe oublié
profil.html         fiche du joueur connecté (+ nouveau mot de passe)
admin.html          espace administrateur
style.css           styles
script.js           affichage du site public et fenêtre de connexion
profil.js           logique de la page profil
admin.js            logique de l'espace administrateur
db.js               accès à Supabase (lecture publique, auth, profil, admin)
config.js           URL et clé publique Supabase (à renseigner)
migrations/
  0001_schema.sql         tables
  0002_securite_vues.sql  sécurité (RLS), règles, vues publiques
  checks.sql              contrôles à lancer après l'installation
```

## 1. Créer la base de données

1. Créez un projet Supabase dédié à BasketBF.
2. Ouvrez **SQL Editor** et exécutez, dans l'ordre, `migrations/0001_schema.sql`, puis `migrations/0002_securite_vues.sql`. Chaque fichier se lance dans une nouvelle requête.
3. Exécutez `migrations/checks.sql`. Sur une base neuve, tous les résultats doivent être à 0 et les deux erreurs « permission denied » sont attendues.

Les migrations ne se rejouent pas. En cas d'erreur, supprimez le projet et recommencez.

## 2. Renseigner la configuration

Dans **Project Settings → API**, copiez l'URL du projet et la clé **anon / public**, puis remplissez `config.js` :

```js
const SUPABASE_URL = "https://xxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```

Ne mettez jamais la clé `service_role` dans le site.

## 3. Configurer l'authentification

Dans **Authentication → URL Configuration** :

- **Site URL** : l'adresse de votre site, par exemple `https://VOTRE-COMPTE.github.io/basketbf/`.
- **Redirect URLs** : ajoutez `https://VOTRE-COMPTE.github.io/basketbf/profil.html`.

Ces adresses servent aux liens envoyés par email (confirmation d'inscription, réinitialisation du mot de passe). Sans elles, les liens ne fonctionnent pas.

Par défaut, Supabase demande la confirmation de l'adresse email à l'inscription. Gardez ce réglage pour la production.

## 4. Créer le premier administrateur

1. Dans **Authentication → Users**, cliquez sur **Add user** → **Create new user**. Saisissez l'email et un mot de passe, et cochez **Auto Confirm User**.
2. Dans **SQL Editor**, rattachez ce compte aux administrateurs :

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'votre@email.com';
```

3. Connectez-vous sur le site (bouton **Connexion**), puis ouvrez **Administration**.

Pour ajouter un autre administrateur, il suffit de répéter l'étape 2 avec son email.

## 5. Fonctionnement pour les utilisateurs

**Joueur**
1. Crée un compte depuis **Connexion → Créer un compte**, puis confirme son email.
2. Remplit sa fiche sur `profil.html` : identité, taille, poste, ville, consentement à la publication.
3. Sa fiche reste en attente jusqu'à validation par l'administration. Il peut voir son statut et son club.

La date de naissance et le club ne peuvent être modifiés que par l'administration. Le joueur ne peut ni se publier, ni se rattacher à un club.

**Administrateur** (`admin.html`)
- **Fiches joueurs** : rattacher le joueur à un club, publier ou dépublier la fiche. Les joueurs de moins de 18 ans restent masqués du public.
- **Clubs** : créer ou supprimer un club (genres, catégories).
- **Lieux** : ajouter ou supprimer un lieu. Renseignez la ville.
- **Compétitions** : créer une saison, fixer les points victoire et défaite, publier. Le classement se calcule seul à partir des matchs terminés.
- **Matchs et scores** : créer un match, passer son statut à **En direct** (avec la période, par exemple Q4) ou **Terminé**, saisir les scores. Un match terminé doit avoir deux scores différents. Chaque changement de score est tracé dans l'historique.

Les horaires sont saisis en **UTC**. Le Burkina Faso étant en UTC+0, l'heure affichée est l'heure locale.

## 6. Mettre en ligne sur GitHub Pages

```bash
git init
git add .
git commit -m "BasketBF"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/basketbf.git
git push -u origin main
```

Dans **Settings → Pages**, choisissez **Deploy from a branch**, branche `main`, dossier `/ (root)`. Le site est ensuite disponible à `https://VOTRE-COMPTE.github.io/basketbf/`.

## Points à vérifier avant l'ouverture au public

- **Consentement** : le prénom et le nom des joueurs publiés sont visibles de tous. Le formulaire recueille l'accord, mais conservez une trace si nécessaire.
- **Mineurs** : un joueur de moins de 18 ans n'apparaît jamais publiquement, même publié.
- **Liens du pied de page et réseaux sociaux** : les liens vers vos pages Facebook, Instagram, etc. ont été retirés car leurs adresses ne sont pas connues. Ajoutez-les dans `index.html` si vous les avez.
- **Sauvegardes** : activez les sauvegardes quotidiennes de Supabase selon votre formule.
- **Email de production** : le service d'envoi par défaut de Supabase est limité en volume. Configurez un SMTP propre avant d'accueillir beaucoup de joueurs (**Project Settings → Auth → SMTP**).
- **Statistiques individuelles** (points, rebonds, passes) : non incluses. Elles nécessiteront une table `match_player_stats`.
