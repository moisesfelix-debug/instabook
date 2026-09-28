-- Persist the resolved visual style chosen during guided content creation
alter table public.contents
  add column if not exists visual_style text not null default 'human_editorial';

update public.contents
set visual_style = case
  when content_archetype in ('checklist','comparison') then 'bold_performance'
  when content_archetype = 'authority' then 'clean_consulting'
  when content_archetype = 'product' then 'sensory_product'
  when content_archetype = 'story' then 'human_editorial'
  else 'human_editorial'
end;

alter table public.contents
  drop constraint if exists contents_visual_style_check,
  add constraint contents_visual_style_check
  check (visual_style in ('bold_performance','clean_consulting','human_editorial','zine_collage','sensory_product'));
