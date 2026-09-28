-- InstaBook core schema
create schema if not exists private;

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
  type text not null check (type in ('creator','professional','agency')),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','strategist','creator','reviewer','client')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  segment text,
  audience text,
  tone text,
  website text,
  instagram_handle text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_guidelines (
  brand_id uuid primary key references public.brands(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_heading text,
  font_body text,
  preferred_words text[] not null default '{}',
  forbidden_words text[] not null default '{}',
  default_cta text,
  voice_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_user_id_idx on public.workspaces(owner_user_id);
create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index clients_workspace_id_idx on public.clients(workspace_id);
create index brands_workspace_id_idx on public.brands(workspace_id);
create index brands_client_id_idx on public.brands(client_id);
create index brand_guidelines_workspace_id_idx on public.brand_guidelines(workspace_id);

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner','admin')
  )
  or exists (
    select 1 from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.can_manage_workspace(uuid) from public;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.can_manage_workspace(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.brands enable row level security;
alter table public.brand_guidelines enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.brands to authenticated;
grant select, insert, update, delete on public.brand_guidelines to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy workspaces_select_member on public.workspaces for select to authenticated
using (private.is_workspace_member(id) or owner_user_id = (select auth.uid()));
create policy workspaces_insert_owner on public.workspaces for insert to authenticated
with check (owner_user_id = (select auth.uid()));
create policy workspaces_update_manager on public.workspaces for update to authenticated
using (private.can_manage_workspace(id)) with check (private.can_manage_workspace(id));
create policy workspaces_delete_owner on public.workspaces for delete to authenticated
using (owner_user_id = (select auth.uid()));

create policy workspace_members_select_member on public.workspace_members for select to authenticated
using (
  private.is_workspace_member(workspace_id)
  or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid()))
);
create policy workspace_members_insert_manager on public.workspace_members for insert to authenticated
with check (
  private.can_manage_workspace(workspace_id)
  or (
    user_id = (select auth.uid()) and role = 'owner'
    and exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid()))
  )
);
create policy workspace_members_update_manager on public.workspace_members for update to authenticated
using (private.can_manage_workspace(workspace_id)) with check (private.can_manage_workspace(workspace_id));
create policy workspace_members_delete_manager on public.workspace_members for delete to authenticated
using (private.can_manage_workspace(workspace_id));

create policy clients_select_member on public.clients for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy clients_insert_manager on public.clients for insert to authenticated
with check (private.can_manage_workspace(workspace_id));
create policy clients_update_manager on public.clients for update to authenticated
using (private.can_manage_workspace(workspace_id)) with check (private.can_manage_workspace(workspace_id));
create policy clients_delete_manager on public.clients for delete to authenticated
using (private.can_manage_workspace(workspace_id));

create policy brands_select_member on public.brands for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy brands_insert_manager on public.brands for insert to authenticated
with check (private.can_manage_workspace(workspace_id));
create policy brands_update_manager on public.brands for update to authenticated
using (private.can_manage_workspace(workspace_id)) with check (private.can_manage_workspace(workspace_id));
create policy brands_delete_manager on public.brands for delete to authenticated
using (private.can_manage_workspace(workspace_id));

create policy brand_guidelines_select_member on public.brand_guidelines for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy brand_guidelines_insert_manager on public.brand_guidelines for insert to authenticated
with check (private.can_manage_workspace(workspace_id));
create policy brand_guidelines_update_manager on public.brand_guidelines for update to authenticated
using (private.can_manage_workspace(workspace_id)) with check (private.can_manage_workspace(workspace_id));
create policy brand_guidelines_delete_manager on public.brand_guidelines for delete to authenticated
using (private.can_manage_workspace(workspace_id));
