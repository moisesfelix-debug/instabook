create or replace function public.create_workspace(p_name text, p_type public.workspace_type)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Workspace name is too short';
  end if;

  insert into public.workspaces (name, type, owner_user_id)
  values (trim(p_name), p_type, auth.uid())
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, auth.uid(), 'owner');

  return new_workspace_id;
end;
$$;

grant execute on function public.create_workspace(text, public.workspace_type) to authenticated;
