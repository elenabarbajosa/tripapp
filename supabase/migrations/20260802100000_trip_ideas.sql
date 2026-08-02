-- Phase 4E: trip ideas and voting
-- Apply after 20260802090000_trip_packing.sql

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_idea_category') then
    create type public.trip_idea_category as enum (
      'sightseeing',
      'food',
      'activity',
      'nightlife',
      'shopping',
      'transport',
      'other'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'trip_idea_status') then
    create type public.trip_idea_status as enum (
      'proposed',
      'added_to_itinerary',
      'archived'
    );
  end if;
end $$;

create table if not exists public.trip_ideas (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  destination_id uuid references public.trip_destinations (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  description text,
  category public.trip_idea_category not null default 'other',
  status public.trip_idea_status not null default 'proposed',
  location_name text,
  address text,
  geoapify_place_id text,
  latitude double precision,
  longitude double precision,
  promoted_activity_id uuid references public.trip_activities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_ideas_title_not_blank check (char_length(trim(title)) >= 1),
  constraint trip_ideas_title_length check (char_length(title) <= 160),
  constraint trip_ideas_description_length check (
    description is null or char_length(description) <= 2000
  ),
  constraint trip_ideas_location_length check (
    location_name is null or char_length(location_name) <= 160
  ),
  constraint trip_ideas_address_length check (
    address is null or char_length(address) <= 240
  ),
  constraint trip_ideas_geoapify_place_id_length check (
    geoapify_place_id is null or char_length(geoapify_place_id) <= 256
  ),
  constraint trip_ideas_latitude_range check (
    latitude is null or (latitude >= -90 and latitude <= 90)
  ),
  constraint trip_ideas_longitude_range check (
    longitude is null or (longitude >= -180 and longitude <= 180)
  ),
  constraint trip_ideas_lat_lng_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  )
);

create index if not exists trip_ideas_trip_id_idx on public.trip_ideas (trip_id);
create index if not exists trip_ideas_trip_status_idx on public.trip_ideas (trip_id, status);

create table if not exists public.trip_idea_votes (
  idea_id uuid not null references public.trip_ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create index if not exists trip_idea_votes_user_id_idx on public.trip_idea_votes (user_id);

drop trigger if exists trip_ideas_set_updated_at on public.trip_ideas;
create trigger trip_ideas_set_updated_at
  before update on public.trip_ideas
  for each row execute function public.set_updated_at();

alter table public.trip_ideas enable row level security;
alter table public.trip_idea_votes enable row level security;

revoke all on table public.trip_ideas from public;
revoke all on table public.trip_idea_votes from public;
grant select, insert, update, delete on table public.trip_ideas to authenticated;
grant select, insert, delete on table public.trip_idea_votes to authenticated;

drop policy if exists "trip_ideas_select_member" on public.trip_ideas;
create policy "trip_ideas_select_member"
  on public.trip_ideas for select to authenticated
  using (public.is_accepted_trip_member(trip_id));

drop policy if exists "trip_ideas_insert_member" on public.trip_ideas;
create policy "trip_ideas_insert_member"
  on public.trip_ideas for insert to authenticated
  with check (
    public.is_accepted_trip_member(trip_id)
    and created_by = (select auth.uid())
    and public.trip_destination_belongs_to_trip(destination_id, trip_id)
  );

drop policy if exists "trip_ideas_update" on public.trip_ideas;
create policy "trip_ideas_update"
  on public.trip_ideas for update to authenticated
  using (
    public.can_edit_trip(trip_id)
    or (created_by = (select auth.uid()) and status = 'proposed')
  )
  with check (
    public.can_edit_trip(trip_id)
    or (created_by = (select auth.uid()) and status = 'proposed')
  );

drop policy if exists "trip_ideas_delete" on public.trip_ideas;
create policy "trip_ideas_delete"
  on public.trip_ideas for delete to authenticated
  using (
    public.can_edit_trip(trip_id)
    or (created_by = (select auth.uid()) and status = 'proposed')
  );

drop policy if exists "trip_idea_votes_select" on public.trip_idea_votes;
create policy "trip_idea_votes_select"
  on public.trip_idea_votes for select to authenticated
  using (
    exists (
      select 1 from public.trip_ideas i
      where i.id = idea_id and public.is_accepted_trip_member(i.trip_id)
    )
  );

drop policy if exists "trip_idea_votes_insert" on public.trip_idea_votes;
create policy "trip_idea_votes_insert"
  on public.trip_idea_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trip_ideas i
      where i.id = idea_id and public.is_accepted_trip_member(i.trip_id)
    )
  );

drop policy if exists "trip_idea_votes_delete" on public.trip_idea_votes;
create policy "trip_idea_votes_delete"
  on public.trip_idea_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Map idea category → activity category
create or replace function public.map_idea_category_to_activity(
  p_category public.trip_idea_category
)
returns public.trip_activity_category
language sql
immutable
as $$
  select case p_category
    when 'sightseeing' then 'sightseeing'::public.trip_activity_category
    when 'food' then 'food'::public.trip_activity_category
    when 'activity' then 'activity'::public.trip_activity_category
    when 'nightlife' then 'nightlife'::public.trip_activity_category
    when 'shopping' then 'shopping'::public.trip_activity_category
    when 'transport' then 'transport'::public.trip_activity_category
    else 'other'::public.trip_activity_category
  end;
$$;

create or replace function public.promote_trip_idea_to_activity(
  p_idea_id uuid,
  p_trip_day_id uuid,
  p_destination_id uuid default null,
  p_is_all_day boolean default true,
  p_start_time time default null,
  p_end_time time default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_idea public.trip_ideas;
  v_activity_id uuid;
  v_position int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_idea from public.trip_ideas where id = p_idea_id for update;
  if v_idea.id is null then
    raise exception 'Idea not found';
  end if;
  if not public.can_edit_trip(v_idea.trip_id) then
    raise exception 'Only owners and editors can add ideas to the itinerary';
  end if;
  if v_idea.status = 'added_to_itinerary' and v_idea.promoted_activity_id is not null then
    raise exception 'Idea has already been added to the itinerary';
  end if;
  if v_idea.status = 'archived' then
    raise exception 'Archived ideas cannot be promoted';
  end if;
  if not public.trip_day_belongs_to_trip(p_trip_day_id, v_idea.trip_id) then
    raise exception 'Trip day does not belong to this trip';
  end if;
  if not public.trip_destination_belongs_to_trip(p_destination_id, v_idea.trip_id) then
    raise exception 'Destination does not belong to this trip';
  end if;

  select coalesce(max(position), -1) + 1 into v_position
  from public.trip_activities
  where trip_day_id = p_trip_day_id;

  insert into public.trip_activities (
    trip_id, trip_day_id, destination_id, created_by, title, description, category,
    is_all_day, start_time, end_time, location_name, address, geoapify_place_id,
    latitude, longitude, notes, position
  ) values (
    v_idea.trip_id,
    p_trip_day_id,
    coalesce(p_destination_id, v_idea.destination_id),
    v_uid,
    v_idea.title,
    v_idea.description,
    public.map_idea_category_to_activity(v_idea.category),
    coalesce(p_is_all_day, true),
    case when coalesce(p_is_all_day, true) then null else p_start_time end,
    case when coalesce(p_is_all_day, true) then null else p_end_time end,
    v_idea.location_name,
    v_idea.address,
    v_idea.geoapify_place_id,
    v_idea.latitude,
    v_idea.longitude,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_position
  ) returning id into v_activity_id;

  update public.trip_ideas
  set status = 'added_to_itinerary',
      promoted_activity_id = v_activity_id
  where id = p_idea_id;

  return v_activity_id;
end;
$$;

revoke all on function public.promote_trip_idea_to_activity(uuid, uuid, uuid, boolean, time, time, text) from public;
grant execute on function public.promote_trip_idea_to_activity(uuid, uuid, uuid, boolean, time, time, text) to authenticated;
