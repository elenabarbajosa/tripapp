-- Phase 4A: trip itinerary activities
-- Apply after 20260802040000_fix_trip_members_access.sql
-- Do not edit earlier migrations.

-- ---------------------------------------------------------------------------
-- Enum: activity category
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_activity_category') then
    create type public.trip_activity_category as enum (
      'activity',
      'sightseeing',
      'food',
      'nightlife',
      'shopping',
      'transport',
      'other'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- trip_activities
-- ---------------------------------------------------------------------------
create table if not exists public.trip_activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  trip_day_id uuid not null references public.trip_days (id) on delete cascade,
  destination_id uuid references public.trip_destinations (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  description text,
  category public.trip_activity_category not null default 'activity',
  is_all_day boolean not null default false,
  start_time time,
  end_time time,
  location_name text,
  address text,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_activities_title_not_blank check (char_length(trim(title)) >= 1),
  constraint trip_activities_title_length check (char_length(title) <= 120),
  constraint trip_activities_description_length check (
    description is null or char_length(description) <= 2000
  ),
  constraint trip_activities_location_length check (
    location_name is null or char_length(location_name) <= 160
  ),
  constraint trip_activities_address_length check (
    address is null or char_length(address) <= 240
  ),
  constraint trip_activities_notes_length check (
    notes is null or char_length(notes) <= 2000
  ),
  constraint trip_activities_time_order check (
    end_time is null or start_time is null or end_time >= start_time
  ),
  constraint trip_activities_all_day_times check (
    (is_all_day = true and start_time is null and end_time is null)
    or (is_all_day = false)
  ),
  constraint trip_activities_position_non_negative check (position >= 0)
);

create index if not exists trip_activities_trip_day_position_idx
  on public.trip_activities (trip_day_id, position, created_at);

create index if not exists trip_activities_trip_id_idx
  on public.trip_activities (trip_id);

create index if not exists trip_activities_destination_id_idx
  on public.trip_activities (destination_id)
  where destination_id is not null;

comment on table public.trip_activities is
  'Day-by-day itinerary activities. Access via accepted trip membership; writes for owner/editor.';

drop trigger if exists trip_activities_set_updated_at on public.trip_activities;
create trigger trip_activities_set_updated_at
  before update on public.trip_activities
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ownership helpers (security definer — avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.trip_day_belongs_to_trip(
  p_trip_day_id uuid,
  p_trip_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_days d
    where d.id = p_trip_day_id
      and d.trip_id = p_trip_id
  );
$$;

create or replace function public.trip_destination_belongs_to_trip(
  p_destination_id uuid,
  p_trip_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_destination_id is null
    or exists (
      select 1
      from public.trip_destinations td
      where td.id = p_destination_id
        and td.trip_id = p_trip_id
    );
$$;

revoke all on function public.trip_day_belongs_to_trip(uuid, uuid) from public;
grant execute on function public.trip_day_belongs_to_trip(uuid, uuid) to authenticated;

revoke all on function public.trip_destination_belongs_to_trip(uuid, uuid) from public;
grant execute on function public.trip_destination_belongs_to_trip(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.trip_activities enable row level security;

revoke all on table public.trip_activities from public;
grant select, insert, update, delete on table public.trip_activities to authenticated;

drop policy if exists "trip_activities_select_member" on public.trip_activities;
create policy "trip_activities_select_member"
  on public.trip_activities
  for select
  to authenticated
  using (public.is_accepted_trip_member(trip_id));

drop policy if exists "trip_activities_insert_editor" on public.trip_activities;
create policy "trip_activities_insert_editor"
  on public.trip_activities
  for insert
  to authenticated
  with check (
    public.can_edit_trip(trip_id)
    and created_by = (select auth.uid())
    and public.trip_day_belongs_to_trip(trip_day_id, trip_id)
    and public.trip_destination_belongs_to_trip(destination_id, trip_id)
  );

drop policy if exists "trip_activities_update_editor" on public.trip_activities;
create policy "trip_activities_update_editor"
  on public.trip_activities
  for update
  to authenticated
  using (public.can_edit_trip(trip_id))
  with check (
    public.can_edit_trip(trip_id)
    and public.trip_day_belongs_to_trip(trip_day_id, trip_id)
    and public.trip_destination_belongs_to_trip(destination_id, trip_id)
  );

drop policy if exists "trip_activities_delete_editor" on public.trip_activities;
create policy "trip_activities_delete_editor"
  on public.trip_activities
  for delete
  to authenticated
  using (public.can_edit_trip(trip_id));

-- ---------------------------------------------------------------------------
-- reorder_trip_activities RPC
-- ---------------------------------------------------------------------------
create or replace function public.reorder_trip_activities(
  p_trip_id uuid,
  p_trip_day_id uuid,
  p_activity_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
  v_distinct integer;
  v_matched integer;
  v_id uuid;
  v_index integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_trip_id is null or p_trip_day_id is null then
    raise exception 'Trip and day are required';
  end if;

  if not public.can_edit_trip(p_trip_id) then
    raise exception 'Only owners and editors can reorder activities';
  end if;

  if not public.trip_day_belongs_to_trip(p_trip_day_id, p_trip_id) then
    raise exception 'Trip day does not belong to this trip';
  end if;

  if p_activity_ids is null or cardinality(p_activity_ids) = 0 then
    raise exception 'Activity list is required';
  end if;

  select cardinality(p_activity_ids) into v_count;
  select count(distinct x) into v_distinct from unnest(p_activity_ids) as x;

  if v_count <> v_distinct then
    raise exception 'Duplicate activity ids are not allowed';
  end if;

  select count(*)::integer into v_matched
  from public.trip_activities a
  where a.trip_id = p_trip_id
    and a.trip_day_id = p_trip_day_id
    and a.id = any (p_activity_ids);

  if v_matched <> v_count then
    raise exception 'One or more activities do not belong to this trip day';
  end if;

  -- Ensure the list is a complete permutation of the day's activities.
  if (
    select count(*)::integer
    from public.trip_activities a
    where a.trip_id = p_trip_id
      and a.trip_day_id = p_trip_day_id
  ) <> v_count then
    raise exception 'Activity list must include every activity for this day';
  end if;

  foreach v_id in array p_activity_ids loop
    update public.trip_activities
    set position = v_index,
        updated_at = now()
    where id = v_id
      and trip_id = p_trip_id
      and trip_day_id = p_trip_day_id;
    v_index := v_index + 1;
  end loop;
end;
$$;

revoke all on function public.reorder_trip_activities(uuid, uuid, uuid[]) from public;
grant execute on function public.reorder_trip_activities(uuid, uuid, uuid[]) to authenticated;

comment on function public.reorder_trip_activities(uuid, uuid, uuid[]) is
  'Atomically reorders all activities for one trip day. Owner/editor only.';
