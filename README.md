# Basket Connect — démarrage (Phase 1 + début du MVP)
1. Crée un NOUVEAU projet Supabase de test (jamais la production).
2. SQL Editor → exécute `001_init.sql` puis `002_video_domains.sql` (dossier `supabase/migrations`).
3. Renseigne `js/config.js` (URL + anon key publique uniquement).
4. Authentication → active la confirmation d'e-mail.
5. Ouvre `index.html` (ou publie sur GitHub Pages). Tests de sécurité : voir section 14 du cahier des charges.
Fait : annuaire, inscription/connexion, page `profile.html` (profil + demande de vérification).
Prochaines étapes : espace administration (validation des demandes et du consentement parental), puis messagerie (phase 3).
