-- Role-aware creative system
alter table public.contents
  add column if not exists content_archetype text not null default 'general',
  add column if not exists art_direction text not null default 'editorial';

alter table public.content_slides
  add column if not exists slide_role text not null default 'body',
  add column if not exists emphasis text not null default 'medium',
  add column if not exists visual_priority text not null default 'balanced',
  add column if not exists badge text,
  add column if not exists highlight text,
  add column if not exists secondary_headline text,
  add column if not exists secondary_body text;

alter table public.contents
  drop constraint if exists contents_content_archetype_check,
  add constraint contents_content_archetype_check
  check (content_archetype in ('general','checklist','story','comparison','product','authority'));

alter table public.contents
  drop constraint if exists contents_art_direction_check,
  add constraint contents_art_direction_check
  check (art_direction in ('editorial','split','minimal'));

alter table public.content_slides
  drop constraint if exists content_slides_slide_role_check,
  add constraint content_slides_slide_role_check
  check (slide_role in ('hook','second_hook','context','item','comparison','proof','transition','result','takeaway','cta','body'));

alter table public.content_slides
  drop constraint if exists content_slides_emphasis_check,
  add constraint content_slides_emphasis_check
  check (emphasis in ('high','medium','low'));

alter table public.content_slides
  drop constraint if exists content_slides_visual_priority_check,
  add constraint content_slides_visual_priority_check
  check (visual_priority in ('text','image','balanced'));

update public.content_slides
set slide_role = case
  when position = 1 then 'hook'
  when position = 2 then 'context'
  when position >= 7 then 'cta'
  else 'body'
end
where slide_role = 'body';
