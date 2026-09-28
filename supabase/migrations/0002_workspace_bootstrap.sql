create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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

revoke all on function private.handle_new_user() from public;
revoke all on function private.handle_new_user() from anon;
revoke all on function private.handle_new_user() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

create or replace function public.create_workspace(p_name text, p_type text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_workspace_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Workspace name is too short';
  end if;

  if p_type not in ('creator','professional','agency') then
    raise exception 'Invalid workspace type';
  end if;

  insert into public.workspaces (name, type, owner_user_id)
  values (trim(p_name), p_type, (select auth.uid()))
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, (select auth.uid()), 'owner');

  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace(text, text) from public;
revoke all on function public.create_workspace(text, text) from anon;
grant execute on function public.create_workspace(text, text) to authenticated;
