-- Per-slide AI visual assets
alter table public.content_slides
  add column if not exists image_path text,
  add column if not exists image_prompt text;
