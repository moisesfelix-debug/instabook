-- Brand and content visual assets
alter table public.brand_guidelines
  add column if not exists logo_path text;

alter table public.contents
  add column if not exists hero_image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-assets',
  'content-assets',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "workspace members insert brand assets" on storage.objects;
create policy "workspace members insert brand assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'brand-assets'
  and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "workspace members select brand assets" on storage.objects;
create policy "workspace members select brand assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'brand-assets'
  and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "workspace members delete brand assets" on storage.objects;
create policy "workspace members delete brand assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'brand-assets'
  and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "workspace members insert content assets" on storage.objects;
create policy "workspace members insert content assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'content-assets'
  and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "workspace members select content assets" on storage.objects;
create policy "workspace members select content assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'content-assets'
  and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "workspace members delete content assets" on storage.objects;
create policy "workspace members delete content assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'content-assets'
  and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
);
