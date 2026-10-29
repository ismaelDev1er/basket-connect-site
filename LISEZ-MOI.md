# Basket Connect v2 (React + Vite + Supabase)

## 1. Mettre à jour la base (une seule fois)
Supabase > SQL Editor > coller tout le fichier `migration-v2.sql` > Run.
Puis faire la même chose avec `migration-v3.sql` (messagerie type WhatsApp et blocage).
Votre ancien site continue de marcher : rien n'est supprimé.

## IMPORTANT : ne double-cliquez pas sur index.html (page blanche). Passez par le terminal :

## 2. Lancer le site sur votre ordinateur
1. Installez Node.js (version LTS) : https://nodejs.org
2. Ouvrez un terminal dans ce dossier, puis :
   npm install
   npm run dev
3. Ouvrez l'adresse affichée (http://localhost:5173).

## 3. Mettre en ligne
npm run build  -> crée le dossier `dist`. Déposez ce dossier sur Netlify (glisser-déposer) ou Vercel.

## Valider un club ou une opportunité
Dans Supabase > SQL Editor : voir la fin de `migration-v2.sql` (et le bloc 6 de l'ancien SQL pour les clubs).

## Pas encore repris de l'ancien site
Invitations de clubs, modification de la photo de profil (la photo existante est conservée), réactions aux messages.
