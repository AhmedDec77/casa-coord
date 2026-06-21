-- =====================================================================
-- CASA COORD - Schéma Supabase
-- Coordination de chantiers (CASA Zellner, ElenaFrank, ...)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILS UTILISATEURS
-- Étend auth.users avec un rôle métier et un nom affiché.
-- ---------------------------------------------------------------------
create type public.trade as enum (
  'general',     -- Danuvvio (maçon / gros œuvre / coordination chantier)
  'electricite', -- Elektro Schmidtke GmbH (Amin)
  'plomberie',   -- Pourhaustechnik (Mehran)
  'architecte',  -- Barbara Di Gregorio
  'coordinateur' -- Ahmed Touati
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  company text,
  trade public.trade not null,
  -- l'architecte et le coordinateur voient tout en plus de pouvoir tout éditer
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Tout utilisateur authentifié peut voir tous les profils (pour affichage des noms / assignation)
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Chacun ne peut modifier que son propre profil
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------
-- 2. PROJETS (CASA Zellner, ElenaFrank, ...)
-- ---------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text,
  address text,
  start_date date,
  end_date date,
  color text default '#2563eb', -- couleur d'affichage dans le calendrier/Gantt
  archived boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Tous les utilisateurs authentifiés voient tous les projets (transparence demandée)
create policy "projects_select_authenticated"
  on public.projects for select
  to authenticated
  using (true);

-- Seuls les admins (coordinateur) créent/modifient/archivent des projets
create policy "projects_insert_admin"
  on public.projects for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

create policy "projects_update_admin"
  on public.projects for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

create policy "projects_delete_admin"
  on public.projects for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

-- ---------------------------------------------------------------------
-- 3. TÂCHES (lignes du Gantt / table)
-- ---------------------------------------------------------------------
create type public.task_status as enum ('a_faire', 'en_cours', 'fait', 'bloque');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  trade public.trade not null,             -- corps de métier concerné
  status public.task_status not null default 'a_faire',
  start_date date not null,
  end_date date not null,
  progress smallint not null default 0 check (progress between 0 and 100),
  assigned_to uuid references public.profiles(id),  -- qui doit la faire
  created_by uuid references public.profiles(id),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dates_valid check (end_date >= start_date)
);

create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_assigned_to_idx on public.tasks(assigned_to);

alter table public.tasks enable row level security;

-- Tout le monde voit toutes les tâches de tous les projets (transparence demandée)
create policy "tasks_select_authenticated"
  on public.tasks for select
  to authenticated
  using (true);

-- Création : un admin peut créer n'importe quelle tâche ;
-- un non-admin ne peut créer une tâche que s'il se l'assigne à lui-même
create policy "tasks_insert_own_or_admin"
  on public.tasks for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
    or assigned_to = (select auth.uid())
  );

-- Édition : un admin peut tout éditer ; sinon seulement ses propres tâches assignées
create policy "tasks_update_own_or_admin"
  on public.tasks for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
    or assigned_to = (select auth.uid())
  )
  with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
    or assigned_to = (select auth.uid())
  );

-- Suppression : admin uniquement (évite qu'un corps de métier supprime une tâche par erreur)
create policy "tasks_delete_admin"
  on public.tasks for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. COMMENTAIRES (optionnel, simple fil par tâche)
-- ---------------------------------------------------------------------
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;

create policy "comments_select_authenticated"
  on public.task_comments for select
  to authenticated
  using (true);

create policy "comments_insert_own"
  on public.task_comments for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "comments_delete_own_or_admin"
  on public.task_comments for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

-- ---------------------------------------------------------------------
-- 5. Auto-création du profil à l'inscription
-- (le rôle/trade par défaut est mis à 'general' ; à ajuster manuellement
--  pour chaque utilisateur après création, voir seed.sql)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, trade, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'trade')::public.trade, 'general'),
    coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
