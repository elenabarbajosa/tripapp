-- Phase 4D: collaborative packing lists
-- Apply after 20260802080000_trip_expenses.sql

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_packing_category') then
    create type public.trip_packing_category as enum (
      'clothes',
      'toiletries',
      'electronics',
      'documents',
      'medication',
      'travel',
      'other'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'trip_packing_scope') then
    create type public.trip_packing_scope as enum (
      'shared',
      'personal'
    );
  end if;
end $$;

create table if not exists public.trip_packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  category public.trip_packing_category not null default 'other',
  scope public.trip_packing_scope not null default 'shared',
  assigned_to uuid references public.profiles (id) on delete set null,
  quantity integer not null default 1,
  notes text,
  is_packed boolean not null default false,
  packed_by uuid references public.profiles (id) on delete set null,
  packed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_packing_title_not_blank check (char_length(trim(title)) >= 1),
  constraint trip_packing_title_length check (char_length(title) <= 160),
  constraint trip_packing_quantity_range check (quantity >= 1 and quantity <= 99),
  constraint trip_packing_notes_length check (notes is null or char_length(notes) <= 1000),
  constraint trip_packing_position_non_negative check (position >= 0),
  constraint trip_packing_personal_requires_assignee check (
    scope = 'shared' or assigned_to is not null
  ),
  constraint trip_packing_packed_metadata check (
    (is_packed = false and packed_by is null and packed_at is null)
    or (is_packed = true and packed_by is not null and packed_at is not null)
  )
);

create index if not exists trip_packing_trip_position_idx
  on public.trip_packing_items (trip_id, position, created_at);

create index if not exists trip_packing_assigned_to_idx
  on public.trip_packing_items (assigned_to)
  where assigned_to is not null;

drop trigger if exists trip_packing_items_set_updated_at on public.trip_packing_items;
create trigger trip_packing_items_set_updated_at
  before update on public.trip_packing_items
  for each row execute function public.set_updated_at();

alter table public.trip_packing_items enable row level security;
revoke all on table public.trip_packing_items from public;
grant select, insert, update, delete on table public.trip_packing_items to authenticated;

drop policy if exists "trip_packing_select_member" on public.trip_packing_items;
create policy "trip_packing_select_member"
  on public.trip_packing_items for select to authenticated
  using (public.is_accepted_trip_member(trip_id));

drop policy if exists "trip_packing_insert" on public.trip_packing_items;
create policy "trip_packing_insert"
  on public.trip_packing_items for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_accepted_trip_member(trip_id)
    and (
      public.can_edit_trip(trip_id)
      or (
        scope = 'personal'
        and assigned_to = (select auth.uid())
      )
    )
    and (
      assigned_to is null
      or public.is_accepted_member_of_trip(trip_id, assigned_to)
    )
  );

drop policy if exists "trip_packing_update" on public.trip_packing_items;
create policy "trip_packing_update"
  on public.trip_packing_items for update to authenticated
  using (
    public.can_edit_trip(trip_id)
    or (
      scope = 'personal'
      and assigned_to = (select auth.uid())
      and created_by = (select auth.uid())
    )
  )
  with check (
    public.can_edit_trip(trip_id)
    or (
      scope = 'personal'
      and assigned_to = (select auth.uid())
      and created_by = (select auth.uid())
    )
  );

drop policy if exists "trip_packing_delete" on public.trip_packing_items;
create policy "trip_packing_delete"
  on public.trip_packing_items for delete to authenticated
  using (
    public.can_edit_trip(trip_id)
    or (
      scope = 'personal'
      and assigned_to = (select auth.uid())
      and created_by = (select auth.uid())
    )
  );

create or replace function public.toggle_trip_packing_item(p_item_id uuid)
returns public.trip_packing_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.trip_packing_items;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_item from public.trip_packing_items where id = p_item_id;
  if v_item.id is null then
    raise exception 'Packing item not found';
  end if;
  if not public.is_accepted_trip_member(v_item.trip_id) then
    raise exception 'Not a trip member';
  end if;

  if not (
    public.can_edit_trip(v_item.trip_id)
    or v_item.scope = 'shared'
    or v_item.assigned_to = v_uid
  ) then
    raise exception 'You cannot toggle this packing item';
  end if;

  if v_item.is_packed then
    update public.trip_packing_items
    set is_packed = false, packed_by = null, packed_at = null
    where id = p_item_id
    returning * into v_item;
  else
    update public.trip_packing_items
    set is_packed = true, packed_by = v_uid, packed_at = now()
    where id = p_item_id
    returning * into v_item;
  end if;

  return v_item;
end;
$$;

create or replace function public.reorder_trip_packing_items(
  p_trip_id uuid,
  p_item_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
  v_distinct int;
  v_matched int;
  v_i int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.can_edit_trip(p_trip_id) then
    raise exception 'Only owners and editors can reorder packing items';
  end if;
  if p_item_ids is null or coalesce(array_length(p_item_ids, 1), 0) < 1 then
    raise exception 'Item list is required';
  end if;
  v_count := array_length(p_item_ids, 1);
  select count(distinct x) into v_distinct from unnest(p_item_ids) as x;
  if v_distinct <> v_count then
    raise exception 'Duplicate packing item ids';
  end if;
  select count(*) into v_matched
  from public.trip_packing_items
  where trip_id = p_trip_id and id = any (p_item_ids);
  if v_matched <> v_count then
    raise exception 'One or more packing items do not belong to this trip';
  end if;

  for v_i in 1..v_count loop
    update public.trip_packing_items
    set position = v_i - 1
    where id = p_item_ids[v_i] and trip_id = p_trip_id;
  end loop;
end;
$$;

revoke all on function public.toggle_trip_packing_item(uuid) from public;
grant execute on function public.toggle_trip_packing_item(uuid) to authenticated;
revoke all on function public.reorder_trip_packing_items(uuid, uuid[]) from public;
grant execute on function public.reorder_trip_packing_items(uuid, uuid[]) to authenticated;
