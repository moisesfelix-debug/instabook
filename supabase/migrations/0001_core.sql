-- InstaBook core schema v1
create extension if not exists pgcrypto;

create type public.workspace_type as enum ('creator','professional','agency');
create type public.workspace_role as enum ('owner','admin','strategist','creator','reviewer','client');
create type public.content_type as enum ('post','carousel','reel');
create type public.content_status as enum ('draft','in_review','approved','scheduled','published','failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.workspace_type not null default 'creator',
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'creator',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  instagram_handle text,
  segment text,
  audience text,
  tone text,
  website text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_guidelines (
  brand_id uuid primary key references public.brands(id) on delete cascade,
  primary_color text,
  secondary_color text,
  fonts jsonb not null default '[]'::jsonb,
  preferred_terms jsonb not null default '[]'::jsonb,
  banned_terms jsonb not null default '[]'::jsonb,
  default_cta text,
  voice_notes text,
  examples text
);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  type public.content_type not null,
  status public.content_status not null default 'draft',
  title text,
  caption text,
  objective text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_slides (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  position integer not null check (position > 0),
  template_id uuid,
  payload jsonb not null default '{}'::jsonb,
  unique (content_id, position)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  requested_from_user_id uuid references auth.users(id) on delete set null,
  requested_by_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','approved','changes_requested')),
  note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.brands enable row level security;
alter table public.brand_guidelines enable row level security;
alter table public.contents enable row level security;
alter table public.content_slides enable row level security;
alter table public.approvals enable row level security;

create policy "profiles self read" on public.profiles
for select using (id = auth.uid());
create policy "profiles self update" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "workspace members read" on public.workspaces
for select using (public.is_workspace_member(id) or owner_user_id = auth.uid());
create policy "authenticated users create workspace" on public.workspaces
for insert to authenticated with check (owner_user_id = auth.uid());
create policy "workspace admins update" on public.workspaces
for update using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));
create policy "workspace owners delete" on public.workspaces
for delete using (owner_user_id = auth.uid());

create policy "members read peers" on public.workspace_members
for select using (public.is_workspace_member(workspace_id) or user_id = auth.uid());
create policy "workspace owner bootstrap membership" on public.workspace_members
for insert to authenticated with check (
  user_id = auth.uid() and exists (
    select 1 from public.workspaces w
    where w.id = workspace_id and w.owner_user_id = auth.uid()
  )
);
create policy "workspace admins add members" on public.workspace_members
for insert to authenticated with check (public.is_workspace_admin(workspace_id));
create policy "workspace admins update members" on public.workspace_members
for update using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy "workspace admins remove members" on public.workspace_members
for delete using (public.is_workspace_admin(workspace_id));

create policy "clients workspace read" on public.clients
for select using (public.is_workspace_member(workspace_id));
create policy "clients workspace insert" on public.clients
for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "clients workspace update" on public.clients
for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "clients workspace delete" on public.clients
for delete using (public.is_workspace_admin(workspace_id));

create policy "brands workspace read" on public.brands
for select using (public.is_workspace_member(workspace_id));
create policy "brands workspace insert" on public.brands
for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "brands workspace update" on public.brands
for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "brands workspace delete" on public.brands
for delete using (public.is_workspace_admin(workspace_id));

create policy "guidelines workspace read" on public.brand_guidelines
for select using (
  exists(select 1 from public.brands b where b.id = brand_id and public.is_workspace_member(b.workspace_id))
);
create policy "guidelines workspace write" on public.brand_guidelines
for all to authenticated
using (exists(select 1 from public.brands b where b.id = brand_id and public.is_workspace_member(b.workspace_id)))
with check (exists(select 1 from public.brands b where b.id = brand_id and public.is_workspace_member(b.workspace_id)));

create policy "contents workspace read" on public.contents
for select using (public.is_workspace_member(workspace_id));
create policy "contents workspace insert" on public.contents
for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "contents workspace update" on public.contents
for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "contents workspace delete" on public.contents
for delete using (public.is_workspace_member(workspace_id));

create policy "slides content workspace read" on public.content_slides
for select using (
  exists(select 1 from public.contents c where c.id = content_id and public.is_workspace_member(c.workspace_id))
);
create policy "slides content workspace write" on public.content_slides
for all to authenticated
using (exists(select 1 from public.contents c where c.id = content_id and public.is_workspace_member(c.workspace_id)))
with check (exists(select 1 from public.contents c where c.id = content_id and public.is_workspace_member(c.workspace_id)));

create policy "approvals content workspace read" on public.approvals
for select using (
  exists(select 1 from public.contents c where c.id = content_id and public.is_workspace_member(c.workspace_id))
);
create policy "approvals content workspace write" on public.approvals
for all to authenticated
using (exists(select 1 from public.contents c where c.id = content_id and public.is_workspace_member(c.workspace_id)))
with check (exists(select 1 from public.contents c where c.id = content_id and public.is_workspace_member(c.workspace_id)));

create index workspace_members_user_idx on public.workspace_members(user_id);
create index clients_workspace_idx on public.clients(workspace_id);
create index brands_workspace_idx on public.brands(workspace_id);
create index contents_workspace_idx on public.contents(workspace_id);
create index contents_brand_idx on public.contents(brand_id);
create index contents_scheduled_idx on public.contents(scheduled_at);
