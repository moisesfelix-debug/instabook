-- Add original visual-family system used by guided content creation.
alter table public.contents
  add column if not exists visual_family text;

update public.contents
set visual_family = case
  when visual_style = 'bold_performance' then 'pulse'
  when visual_style = 'clean_consulting' then 'atlas'
  when visual_style = 'zine_collage' then 'margem'
  when visual_style = 'sensory_product' then 'vitrine'
  else 'atlas'
end
where visual_family is null;

alter table public.contents
  alter column visual_family set default 'atlas',
  alter column visual_family set not null;

alter table public.contents
  drop constraint if exists contents_visual_family_check,
  add constraint contents_visual_family_check
  check (visual_family in ('pulse','atlas','margem','orbit','vitrine'));
