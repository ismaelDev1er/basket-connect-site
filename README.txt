BASKET CONNECT — VERSION SIMPLE

Fichiers :
- index.html : la page web
- style.css : le design et la mise en page
- script.js : les interactions et la connexion Supabase
- database.sql : les tables et règles SQL de la base de données

POUR METTRE LES FICHIERS SUR GITHUB
1. Décompresse l'archive.
2. Ouvre le dépôt GitHub où tu veux publier la page.
3. Clique sur Add file > Upload files.
4. Envoie directement ces quatre fichiers à la racine du dépôt (pas le dossier lui-même).
5. Clique sur Commit changes.
6. Dans GitHub, ouvre Settings > Pages et active la publication depuis la branche main et le dossier /(root), si ce n'est pas déjà fait.

POUR ACTIVER LA BASE SUPABASE
1. Dans Supabase, ouvre SQL Editor > New query.
2. Copie le contenu de database.sql, colle-le dans l'éditeur SQL et exécute-le sur un nouveau projet ou sur un projet prévu pour cette application.
3. Ouvre script.js et remplace SUPABASE_URL et SUPABASE_ANON_KEY par l'URL du projet et la clé publique anon/publishable trouvées dans Project Settings > API.
4. Ne publie jamais la clé service_role.

IMPORTANT
- Le site peut afficher sa page et ses interactions de présentation sans Supabase.
- Les comptes, profils et événements réels nécessitent une configuration Supabase correcte.
- database.sql reprend le schéma SQL fourni avec le projet. Exécute-le dans un projet adapté; ne le relance pas sans vérifier si les tables/types existent déjà.
