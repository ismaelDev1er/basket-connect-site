-- BASKET CONNECT — schéma initial pour un NOUVEAU projet Supabase de TEST.
-- IMPORTANT : ne pas exécuter sur un projet existant sans audit et sauvegarde.
-- Ce script crée des tables dédiées sous le schéma public et active RLS.
-- À valider dans un environnement de test avant toute mise en production.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null check (char_length(pseudo) between 2 and 40),
  account_type text not null default 'player' check (account_type in ('player','club','recruiter','supporter')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  public_visible boolean not null default false,
  pseudo text not null,
  city text,
  position text check (position in ('Meneur','Arrière','Ailier','Ailier fort','Pivot')),
  height_cm integer check (height_cm between 100 and 250),
  level text,
  category text check (category in ('minime','junior','espoir','senior')),
  experience text,
  biography text,
  statistics jsonb not null default '{}'::jsonb,
  achievements text,
  video_urls text[] not null default '{}',
  seeking_club boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  city text not null,
  description text,
  logo_path text,
  categories jsonb not null default '[]'::jsonb,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.recruitment_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  city text,
  position text,
  category text,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.recruitment_posts(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  motivation text,
  video_url text,
  status text not null default 'received' check (status in ('received','in_review','accepted','rejected','invited')),
  created_at timestamptz not null default now(),
  unique(post_id, player_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  media_path text,
  status text not null default 'pending' check (status in ('pending','published','hidden','reported')),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'published' check (status in ('published','hidden','reported')),
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like','support','fire','applause')),
  created_at timestamptz not null default now(),
  unique(post_id,user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  event_type text not null check (event_type in ('championship','cup','friendly','youth','women','3x3','tournament','other')),
  description text,
  venue text,
  city text,
  starts_at timestamptz not null,
  poster_path text,
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  home_club_id uuid references public.clubs(id) on delete set null,
  away_club_id uuid references public.clubs(id) on delete set null,
  starts_at timestamptz not null,
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  result_status text not null default 'scheduled' check (result_status in ('scheduled','live','finished','postponed','cancelled')),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id,user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  target_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile','post','comment','club','message')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

-- Profil public limité aux champs approuvés. Ne jamais exposer email, identité privée ou conversations.
create or replace view public.public_player_profiles
with (security_barrier = true) as
select user_id, pseudo, city, position, height_cm, level, category
from public.player_profiles
where public_visible = true;

alter table public.profiles enable row level security;
alter table public.player_profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.recruitment_posts enable row level security;
alter table public.applications enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.events enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Le propriétaire ne peut modifier que ses propres informations de profil.
create policy "profiles_read_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "player_profiles_read_own" on public.player_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "player_profiles_insert_own" on public.player_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "player_profiles_update_own" on public.player_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select on public.public_player_profiles to anon, authenticated;
-- La vue expose uniquement les colonnes publiques et filtre public_visible. Ne pas accorder SELECT direct sur la table complète aux visiteurs.

create policy "clubs_read_authenticated" on public.clubs for select to authenticated using (true);
create policy "clubs_insert_owner" on public.clubs for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "clubs_update_owner" on public.clubs for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "recruitment_read_published" on public.recruitment_posts for select to authenticated using (status = 'published' or author_id = (select auth.uid()));
create policy "recruitment_insert_author" on public.recruitment_posts for insert to authenticated with check (author_id = (select auth.uid()));
create policy "recruitment_update_author" on public.recruitment_posts for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

create policy "applications_read_parties" on public.applications for select to authenticated using (
  player_id = (select auth.uid()) or exists (
    select 1 from public.recruitment_posts rp join public.clubs c on c.id = rp.club_id
    where rp.id = post_id and c.owner_id = (select auth.uid())
  )
);
create policy "applications_insert_self" on public.applications for insert to authenticated with check (player_id = (select auth.uid()));
create policy "applications_update_club_owner" on public.applications for update to authenticated using (
  exists (select 1 from public.recruitment_posts rp join public.clubs c on c.id = rp.club_id where rp.id = post_id and c.owner_id = (select auth.uid())
));

create policy "posts_read_published_members" on public.posts for select to authenticated using (status = 'published' or author_id = (select auth.uid()));
create policy "posts_insert_self_pending" on public.posts for insert to authenticated with check (author_id = (select auth.uid()) and status = 'pending');
create policy "posts_update_own" on public.posts for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "comments_read_published" on public.comments for select to authenticated using (status = 'published' or author_id = (select auth.uid()));
create policy "comments_insert_self" on public.comments for insert to authenticated with check (author_id = (select auth.uid()));
create policy "reactions_read_members" on public.reactions for select to authenticated using (true);
create policy "reactions_insert_self" on public.reactions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reactions_delete_self" on public.reactions for delete to authenticated using (user_id = (select auth.uid()));

create policy "events_read_published_members" on public.events for select to authenticated using (status = 'published' or organizer_id = (select auth.uid()));
create policy "events_insert_organizer" on public.events for insert to authenticated with check (organizer_id = (select auth.uid()));
create policy "events_update_organizer" on public.events for update to authenticated using (organizer_id = (select auth.uid())) with check (organizer_id = (select auth.uid()));
create policy "matches_read_members" on public.matches for select to authenticated using (true);

create policy "conversation_members_read_self" on public.conversation_members for select to authenticated using (user_id = (select auth.uid()));
create policy "conversation_members_insert_self" on public.conversation_members for insert to authenticated with check (user_id = (select auth.uid()));
create policy "conversations_read_members" on public.conversations for select to authenticated using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = id and cm.user_id = (select auth.uid()))
);
create policy "messages_read_members" on public.messages for select to authenticated using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = (select auth.uid()))
);
create policy "messages_insert_members" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and exists (
    select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = (select auth.uid())
  )
);
create policy "notifications_read_recipient" on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
create policy "notifications_update_recipient" on public.notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy "reports_insert_self" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "reports_read_self" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));

-- IMPORTANT : les rôles administrateur/vérifié doivent être attribués par un processus administratif sécurisé,
-- jamais depuis les métadonnées d'inscription ou par un utilisateur côté navigateur.
