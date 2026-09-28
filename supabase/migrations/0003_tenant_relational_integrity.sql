drop policy if exists brands_insert_manager on public.brands;
drop policy if exists brands_update_manager on public.brands;
drop policy if exists brand_guidelines_insert_manager on public.brand_guidelines;
drop policy if exists brand_guidelines_update_manager on public.brand_guidelines;

create policy brands_insert_manager
on public.brands for insert
to authenticated
with check (
  private.can_manage_workspace(workspace_id)
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = client_id
        and c.workspace_id = brands.workspace_id
    )
  )
);

create policy brands_update_manager
on public.brands for update
to authenticated
using (private.can_manage_workspace(workspace_id))
with check (
  private.can_manage_workspace(workspace_id)
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = client_id
        and c.workspace_id = brands.workspace_id
    )
  )
);

create policy brand_guidelines_insert_manager
on public.brand_guidelines for insert
to authenticated
with check (
  private.can_manage_workspace(workspace_id)
  and exists (
    select 1 from public.brands b
    where b.id = brand_id
      and b.workspace_id = brand_guidelines.workspace_id
  )
);

create policy brand_guidelines_update_manager
on public.brand_guidelines for update
to authenticated
using (private.can_manage_workspace(workspace_id))
with check (
  private.can_manage_workspace(workspace_id)
  and exists (
    select 1 from public.brands b
    where b.id = brand_id
      and b.workspace_id = brand_guidelines.workspace_id
  )
);
