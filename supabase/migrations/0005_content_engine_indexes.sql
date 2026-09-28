create index if not exists contents_created_by_idx on public.contents(created_by);
create index if not exists ai_generations_brand_id_idx on public.ai_generations(brand_id);
create index if not exists ai_generations_user_id_idx on public.ai_generations(user_id);
