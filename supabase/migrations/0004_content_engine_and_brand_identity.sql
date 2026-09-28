alter table public.brand_guidelines
  add column if not exists content_pillars text[] not null default '{}',
  add column if not exists value_proposition text,
  add column if not exists visual_direction text;

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  type text not null check (type in ('post','carousel','reel')),
  title text not null,
  hook text,
  caption text,
  cta text,
  hashtags text[] not null default '{}',
  reel_script text,
  briefing text,
  objective text,
  status text not null default 'draft'
    check (status in ('draft','review','changes_requested','approved','scheduled','published','failed')),
  scheduled_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_slides (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  position integer not null check (position > 0),
  headline text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, position)
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  content_id uuid references public.contents(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete restrict,
  model text not null,
  prompt text not null,
  result_json jsonb,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index if not exists contents_workspace_id_idx on public.contents(workspace_id);
create index if not exists contents_brand_id_idx on public.contents(brand_id);
create index if not exists contents_status_idx on public.contents(workspace_id,status);
create index if not exists contents_scheduled_at_idx on public.contents(workspace_id,scheduled_at);
create index if not exists content_slides_content_id_idx on public.content_slides(content_id);
create index if not exists content_slides_workspace_id_idx on public.content_slides(workspace_id);
create index if not exists ai_generations_workspace_id_idx on public.ai_generations(workspace_id);
create index if not exists ai_generations_content_id_idx on public.ai_generations(content_id);

alter table public.contents enable row level security;
alter table public.content_slides enable row level security;
alter table public.ai_generations enable row level security;

grant select, insert, update, delete on public.contents to authenticated;
grant select, insert, update, delete on public.content_slides to authenticated;
grant select, insert on public.ai_generations to authenticated;

create policy contents_select_member on public.contents for select to authenticated
using (private.is_workspace_member(workspace_id));

create policy contents_insert_member on public.contents for insert to authenticated
with check (
  private.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.brands b
    where b.id = brand_id and b.workspace_id = contents.workspace_id
  )
);

create policy contents_update_member on public.contents for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (
  private.is_workspace_member(workspace_id)
  and exists (
    select 1 from public.brands b
    where b.id = brand_id and b.workspace_id = contents.workspace_id
  )
);

create policy contents_delete_manager_or_author on public.contents for delete to authenticated
using (private.can_manage_workspace(workspace_id) or created_by = (select auth.uid()));

create policy content_slides_select_member on public.content_slides for select to authenticated
using (private.is_workspace_member(workspace_id));

create policy content_slides_insert_member on public.content_slides for insert to authenticated
with check (
  private.is_workspace_member(workspace_id)
  and exists (
    select 1 from public.contents c
    where c.id = content_id and c.workspace_id = content_slides.workspace_id
  )
);

create policy content_slides_update_member on public.content_slides for update to authenticated
using (private.is_workspace_member(workspace_id))
with check (
  private.is_workspace_member(workspace_id)
  and exists (
    select 1 from public.contents c
    where c.id = content_id and c.workspace_id = content_slides.workspace_id
  )
);

create policy content_slides_delete_member on public.content_slides for delete to authenticated
using (private.is_workspace_member(workspace_id));

create policy ai_generations_select_member on public.ai_generations for select to authenticated
using (private.is_workspace_member(workspace_id));

create policy ai_generations_insert_self on public.ai_generations for insert to authenticated
with check (
  private.is_workspace_member(workspace_id)
  and user_id = (select auth.uid())
  and (
    brand_id is null
    or exists (
      select 1 from public.brands b
      where b.id = brand_id and b.workspace_id = ai_generations.workspace_id
    )
  )
);
