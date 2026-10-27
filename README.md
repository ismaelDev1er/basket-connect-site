# BasketBF — base de données Supabase (PostgreSQL)

Base de données du site national du basketball burkinabè (clubs, joueurs, matchs, classement, recrutement).
Elle remplace les tableaux codés en dur de `script.js`.

## Ordre d'exécution

Dans **SQL Editor → New query**, sur un projet Supabase **dédié** (jamais un projet contenant d'autres données) :

1. `migrations/0001_schema.sql` — tables, contraintes, index
2. `migrations/0002_securite_vues.sql` — RLS, privilèges, triggers, vues publiques
3. `migrations/0003_seed_demo.sql` — données de démonstration (à exécuter une seule fois)
4. `migrations/checks.sql` — contrôles, résultats attendus en commentaire

Les migrations ne sont pas conçues pour être rejouées : en cas d'erreur, recréez le projet.

## Correspondance front ↔ base

| Élément du front (`script.js`) | Source en base |
|---|---|
| Liste des clubs, nom, ville | `public_clubs` (`name`, `short_name`, `city`) |
| Badges Hommes / Dames | `public_clubs.genders` |
| Badges Minime, Junior, Espoir, Senior | `public_clubs.categories` |
| « 32 joueurs » sur la carte club | `public_clubs.players_count` (calculé, non saisi) |
| Filtre « Toutes les villes » | `cities` |
| Liste des joueurs, filtre par poste | `public_players` |
| Âge (« 21 ans ») | `public_players.age` (calculé à partir de la date de naissance) |
| Prochains matchs | `match_details` (filtrer `status = 'scheduled'`) |
| Classement 2026 | `competition_standings` (calculé à partir des matchs terminés) |
| Sélecteur de championnat | `competitions` (seules les compétitions publiées sont visibles) |
| Compteurs (24 clubs, 485 joueurs…) | `count(*)` sur les vues — à brancher, ils sont encore fixes dans le HTML |
| Match en direct (ASFB 72-68) | `matches` avec `status = 'live'` et `current_period` — non seedé |

## Corrections apportées aux données du front

- **« Kadiogo BC » et « Kadiogo Basket »** désignent le même club dans le front. La base n'en garde qu'un seul : `Kadiogo Basket`, avec une clé unique.
- **Les matchs et classements référencent des clubs par nom** : impossible à maintenir. Ils référencent désormais `clubs.id`.
- **Points du classement** : les valeurs du front correspondent à victoire = 2 points, défaite = 1 point. Cette règle est stockée dans `competitions`, pas codée dans le front.
- **Le classement n'est pas saisi à la main** : il se calcule à partir des matchs `finished`. Une égalité de score est interdite pour un match terminé (pas de nul au basket).
- **Taille** : stockée en centimètres (`height_cm`), affichée en « 1m87 » par le front.
- **Genre** : `homme` / `femme` partout, au lieu de `Homme` / `Femme` dans les joueurs et `hommes` / `dames` dans les clubs.

## Points à connaître avant la mise en ligne

- **Dates de naissance de la démo inventées** : elles servent uniquement à retrouver les âges affichés. Ne les gardez pas en production.
- **Matchs de démo déjà passés** : ils sont datés de septembre 2026, alors que nous sommes le 25 octobre 2026. Ils apparaîtront comme « à venir » tant qu'ils ne sont pas mis à jour.
- **Pas de résultats inventés** : le classement est vide tant que de vrais matchs ne sont pas saisis. Le front affiche aujourd'hui un classement en dur qui ne correspond à aucun match enregistré.
- **Villes des lieux** : `Palais des Sports` et `Maison des Jeunes` n'ont pas de ville connue. Il faut la renseigner.
- **Minimum de 18 ans** : les joueurs mineurs ne sont jamais dans `public_players` ni dans les effectifs de `public_clubs`, même s'ils sont publiés.
- **Publication des joueurs** : une fiche créée par un joueur reste invisible tant que l'administration ne la valide pas (`is_published`). Un joueur ne peut ni se publier, ni se rattacher à un club, ni modifier sa date de naissance (trigger `players_guard`).
- **Noms publics** : `public_players` expose prénom et nom. Obtenez le consentement des joueurs avant de publier leur fiche.

## Sécurité

- RLS activé sur toutes les tables.
- Visiteurs : lecture des clubs, matchs, lieux, compétitions publiées, et des deux vues publiques. Aucun accès direct à `players`.
- Écriture du contenu (clubs, matchs, scores, compétitions) : administrateurs seulement, via `is_admin()`.
- Les administrateurs sont ajoutés en SQL par le propriétaire du projet :

```sql
select id, email from auth.users;   -- repérez l'identifiant du compte
insert into public.admin_users (user_id) values ('UUID-DU-COMPTE');
```

- Chaque modification de score est tracée dans `match_score_history`.
- La clé `service_role` ne doit jamais apparaître dans le front. Le site public n'utilise que la clé `anon`.

## Brancher le front sur la base

Le front actuel utilise des tableaux JavaScript. Pour le connecter, remplacez `const clubs = [...]` par un appel à la base. Exemple pour les clubs :

```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const sb = createClient('https://VOTRE-PROJET.supabase.co', 'VOTRE_CLE_ANON');

const { data: clubs, error } = await sb
  .from('public_clubs')
  .select('id, name, short_name, city, genders, categories, players_count')
  .order('name');
```

Le front devra ensuite lire `club.short_name` au lieu de `name.substring(0,4)`, et `club.genders.includes('homme')` au lieu de `'hommes'`. Les vues `match_details` et `competition_standings` remplacent de la même manière les tableaux `matches` et `standings`.

## Décisions à valider

- **Projet séparé ou commun avec Basket Connect ?** Les deux projets ont des joueurs et des comptes. Si ce sont deux bases distinctes, il faudra synchroniser ou fusionner les fiches joueurs. Si c'est la même base, les tables `players` et `profiles` doivent être unifiées avant la mise en production.
- **Source des résultats** : qui saisit les scores (administration, clubs, fédération) ? Cela détermine les droits d'écriture à ouvrir.
- **Statistiques individuelles** (points, rebonds, passes) : non incluses dans cette version. Elles se rajouteront avec une table `match_player_stats`.
