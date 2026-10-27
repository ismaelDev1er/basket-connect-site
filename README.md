# BasketBF

Plateforme nationale du basketball burkinabè : clubs, joueurs, matchs et classement.
Le site lit ses données dans Supabase. Il ne contient aucune donnée fictive.

## Contenu

```
index.html          page du site
style.css           styles
script.js           affichage et filtres
db.js               chargement des données depuis Supabase
config.js           URL et clé publique Supabase (à renseigner)
migrations/
  0001_schema.sql        tables
  0002_securite_vues.sql sécurité (RLS), règles, vues publiques
  checks.sql             contrôles à lancer après l'installation
```

## 1. Créer la base

1. Créez un projet Supabase **dédié** à BasketBF.
2. Ouvrez **SQL Editor** et exécutez, dans l'ordre, `migrations/0001_schema.sql`, puis `migrations/0002_securite_vues.sql`. Chaque fichier se lance dans une nouvelle requête.
3. Exécutez `migrations/checks.sql` et vérifiez les résultats attendus en commentaire.

Les migrations ne se rejouent pas. En cas d'erreur, supprimez le projet et recommencez.

## 2. Renseigner la configuration

Dans **Project Settings → API**, copiez l'URL du projet et la clé **anon / public**, puis remplissez `config.js` :

```js
const SUPABASE_URL = "https://xxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```

Ne mettez jamais la clé `service_role` dans le site.

## 3. Créer le premier administrateur

1. Dans **Authentication → Users**, cliquez sur **Add user** et créez le compte avec son email et un mot de passe.
2. Dans **SQL Editor**, rattachez-le aux administrateurs :

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'votre@email.com';
```

## 4. Ajouter les données réelles

Les données s'ajoutent sans passer par le code, dans **Table Editor** (en tant que propriétaire du projet), ou en SQL. Exemples :

```sql
-- Lieu
insert into public.venues (name, city) values ('Palais des Sports', 'Ouagadougou');

-- Club (genders : 'homme' et/ou 'femme' ; categories : Minime, Junior, Espoir, Senior)
insert into public.clubs (name, short_name, city, genders, categories)
values ('Nom officiel', 'SIGLE', 'Ville', '{homme,femme}', '{Junior,Senior}');

-- Compétition (publiée = visible sur le site)
insert into public.competitions (name, season, is_published)
values ('Championnat National 2026', 2026, true);

-- Match à venir
insert into public.matches (competition_id, home_club_id, away_club_id, venue_id, scheduled_at, status)
select c.id, h.id, a.id, v.id, '2026-11-07 18:00+00', 'scheduled'
from public.competitions c, public.clubs h, public.clubs a, public.venues v
where c.name = 'Championnat National 2026'
  and h.name = 'Club A' and a.name = 'Club B'
  and v.name = 'Palais des Sports';
```

Le classement se calcule tout seul à partir des matchs passés au statut `finished`, avec un score final non nul.

Pour un match en cours, passez `status` à `live` et renseignez `current_period` (par exemple `Q4`).

## 5. Mettre en ligne

```bash
git init
git add .
git commit -m "BasketBF"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/basketbf.git
git push -u origin main
```

Pour publier, allez dans **Settings → Pages**, choisissez **Deploy from a branch**, branche `main`, dossier `/ (root)`.

## Ce qui n'est pas encore en place

- **Connexion et inscription** : le lien « Connexion » et le bouton « Créer mon profil » ne sont pas encore reliés à une page. Les règles de sécurité pour les joueurs sont déjà prêtes.
- **Espace administrateur** : la saisie se fait pour l'instant dans Supabase.
- **Compteurs** : ils affichent le nombre réel d'entrées ; tant que la base est vide, ils indiquent 0.

## Avant la mise en ligne

- Obtenez l'accord des joueurs avant de publier leur fiche, car leur prénom et leur nom sont visibles.
- Les joueurs de moins de 18 ans ne sont jamais affichés publiquement.
- Renseignez la ville de chaque lieu.
