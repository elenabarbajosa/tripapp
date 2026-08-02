-- Phase 3A: trips foundation (no invitations yet)
-- Apply via Supabase SQL Editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_member_role') then
    create type public.trip_member_role as enum ('owner', 'editor', 'viewer');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_image_url text,
  start_date date not null,
  end_date date not null,
  currency text not null default 'EUR',
  home_currency text not null default 'EUR',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_range check (end_date >= start_date),
  constraint trips_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint trips_home_currency_format check (home_currency ~ '^[A-Z]{3}$'),
  constraint trips_name_not_blank check (char_length(trim(name)) >= 1)
);

create index if not exists trips_created_by_idx on public.trips (created_by);
create index if not exists trips_start_date_idx on public.trips (start_date);

comment on table public.trips is 'Collaborative trips. Access is granted through accepted trip_members rows.';

-- ---------------------------------------------------------------------------
-- trip_destinations
-- ---------------------------------------------------------------------------
create table if not exists public.trip_destinations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  city text not null,
  country text not null,
  arrival_date date not null,
  departure_date date not null,
  latitude double precision,
  longitude double precision,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_destinations_date_range check (departure_date >= arrival_date),
  constraint trip_destinations_city_not_blank check (char_length(trim(city)) >= 1),
  constraint trip_destinations_country_not_blank check (char_length(trim(country)) >= 1)
);

create index if not exists trip_destinations_trip_id_idx
  on public.trip_destinations (trip_id, display_order);

-- ---------------------------------------------------------------------------
-- trip_days
-- ---------------------------------------------------------------------------
create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  date date not null,
  label text,
  destination_id uuid references public.trip_destinations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_days_unique_date unique (trip_id, date)
);

create index if not exists trip_days_trip_id_date_idx on public.trip_days (trip_id, date);

-- ---------------------------------------------------------------------------
-- trip_members
-- ---------------------------------------------------------------------------
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.trip_member_role not null default 'viewer',
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_members_unique_user unique (trip_id, user_id),
  constraint trip_members_status_check check (status in ('accepted', 'left'))
);

create index if not exists trip_members_user_id_idx on public.trip_members (user_id);
create index if not exists trip_members_trip_id_idx on public.trip_members (trip_id);

comment on column public.trip_members.status is
  'Phase 3A uses accepted membership only. Invitation/pending states arrive in Phase 3B.';

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse set_updated_at from profiles migration)
-- ---------------------------------------------------------------------------
drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
  before update on public.trips
  for each row
  execute function public.set_updated_at();

drop trigger if exists trip_destinations_set_updated_at on public.trip_destinations;
create trigger trip_destinations_set_updated_at
  before update on public.trip_destinations
  for each row
  execute function public.set_updated_at();

drop trigger if exists trip_days_set_updated_at on public.trip_days;
create trigger trip_days_set_updated_at
  before update on public.trip_days
  for each row
  execute function public.set_updated_at();

drop trigger if exists trip_members_set_updated_at on public.trip_members;
create trigger trip_members_set_updated_at
  before update on public.trip_members
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Authorization helpers (security definer, locked search_path)
-- ---------------------------------------------------------------------------
create or replace function public.is_accepted_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = p_trip_id
      and tm.user_id = (select auth.uid())
      and tm.status = 'accepted'
  );
$$;

comment on function public.is_accepted_trip_member(uuid) is
  'True when the current user has an accepted membership on the trip.';

create or replace function public.get_trip_role(p_trip_id uuid)
returns public.trip_member_role
language sql
stable
security definer
set search_path = public
as $$
  select tm.role
  from public.trip_members tm
  where tm.trip_id = p_trip_id
    and tm.user_id = (select auth.uid())
    and tm.status = 'accepted'
  limit 1;
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = p_trip_id
      and tm.user_id = (select auth.uid())
      and tm.status = 'accepted'
      and tm.role = 'owner'
  );
$$;

create or replace function public.can_edit_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = p_trip_id
      and tm.user_id = (select auth.uid())
      and tm.status = 'accepted'
      and tm.role in ('owner', 'editor')
  );
$$;

-- ---------------------------------------------------------------------------
-- Atomic trip creation RPC
-- Creates trip + owner membership + destinations + generated days.
-- ---------------------------------------------------------------------------
create or replace function public.create_trip(
  p_name text,
  p_start_date date,
  p_end_date date,
  p_currency text,
  p_home_currency text,
  p_cover_image_url text default null,
  p_destinations jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_trip_id uuid;
  v_dest jsonb;
  v_dest_id uuid;
  v_order integer := 0;
  v_day date;
  v_day_index integer := 0;
  v_dest_match_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_end_date < p_start_date then
    raise exception 'End date must be on or after start date';
  end if;

  if jsonb_typeof(p_destinations) <> 'array' or jsonb_array_length(p_destinations) < 1 then
    raise exception 'At least one destination is required';
  end if;

  insert into public.trips (
    name,
    cover_image_url,
    start_date,
    end_date,
    currency,
    home_currency,
    created_by
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_cover_image_url, '')), ''),
    p_start_date,
    p_end_date,
    upper(trim(p_currency)),
    upper(trim(p_home_currency)),
    v_user_id
  )
  returning id into v_trip_id;

  insert into public.trip_members (trip_id, user_id, role, status)
  values (v_trip_id, v_user_id, 'owner', 'accepted');

  for v_dest in select value from jsonb_array_elements(p_destinations)
  loop
    v_order := v_order + 1;
    insert into public.trip_destinations (
      trip_id,
      city,
      country,
      arrival_date,
      departure_date,
      latitude,
      longitude,
      display_order
    )
    values (
      v_trip_id,
      trim(v_dest ->> 'city'),
      trim(v_dest ->> 'country'),
      (v_dest ->> 'arrival_date')::date,
      (v_dest ->> 'departure_date')::date,
      nullif(v_dest ->> 'latitude', '')::double precision,
      nullif(v_dest ->> 'longitude', '')::double precision,
      coalesce((v_dest ->> 'display_order')::integer, v_order)
    )
    returning id into v_dest_id;
  end loop;

  v_day := p_start_date;
  while v_day <= p_end_date loop
    v_day_index := v_day_index + 1;

    select td.id
      into v_dest_match_id
    from public.trip_destinations td
    where td.trip_id = v_trip_id
      and v_day between td.arrival_date and td.departure_date
    order by td.display_order
    limit 1;

    insert into public.trip_days (trip_id, date, label, destination_id)
    values (
      v_trip_id,
      v_day,
      'Day ' || v_day_index::text,
      v_dest_match_id
    );

    v_day := v_day + 1;
  end loop;

  return v_trip_id;
end;
$$;

revoke all on function public.create_trip(text, date, date, text, text, text, jsonb) from public;
grant execute on function public.create_trip(text, date, date, text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.trip_destinations to authenticated;
grant select, insert, update, delete on table public.trip_days to authenticated;
grant select, update on table public.trip_members to authenticated;
-- Member inserts for Phase 3A go through create_trip RPC (security definer).

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.trips enable row level security;
alter table public.trip_destinations enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_members enable row level security;

-- trips
drop policy if exists "trips_select_member" on public.trips;
create policy "trips_select_member"
  on public.trips
  for select
  to authenticated
  using (public.is_accepted_trip_member(id));
-- Accepted members can read trips they belong to.

drop policy if exists "trips_insert_authenticated" on public.trips;
create policy "trips_insert_authenticated"
  on public.trips
  for insert
  to authenticated
  with check ((select auth.uid()) = created_by);
-- Direct inserts allowed for the creator; preferred path is create_trip RPC.

drop policy if exists "trips_update_owner" on public.trips;
create policy "trips_update_owner"
  on public.trips
  for update
  to authenticated
  using (public.is_trip_owner(id))
  with check (public.is_trip_owner(id));
-- Only owners update trip basics.

drop policy if exists "trips_delete_owner" on public.trips;
create policy "trips_delete_owner"
  on public.trips
  for delete
  to authenticated
  using (public.is_trip_owner(id));
-- Only owners delete trips.

-- trip_destinations
drop policy if exists "trip_destinations_select_member" on public.trip_destinations;
create policy "trip_destinations_select_member"
  on public.trip_destinations
  for select
  to authenticated
  using (public.is_accepted_trip_member(trip_id));

drop policy if exists "trip_destinations_write_editor" on public.trip_destinations;
create policy "trip_destinations_write_editor"
  on public.trip_destinations
  for all
  to authenticated
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));
-- Owners and editors manage destinations.

-- trip_days
drop policy if exists "trip_days_select_member" on public.trip_days;
create policy "trip_days_select_member"
  on public.trip_days
  for select
  to authenticated
  using (public.is_accepted_trip_member(trip_id));

drop policy if exists "trip_days_write_editor" on public.trip_days;
create policy "trip_days_write_editor"
  on public.trip_days
  for all
  to authenticated
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

-- trip_members
drop policy if exists "trip_members_select_member" on public.trip_members;
create policy "trip_members_select_member"
  on public.trip_members
  for select
  to authenticated
  using (public.is_accepted_trip_member(trip_id));
-- Members can see fellow travellers. Phase 3 will later allow limited profile joins.

drop policy if exists "trip_members_update_owner" on public.trip_members;
create policy "trip_members_update_owner"
  on public.trip_members
  for update
  to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));
-- Role changes / membership updates are owner-only (UI deferred to Phase 3B).

-- No direct INSERT/DELETE policies on trip_members in Phase 3A.
-- Creation uses create_trip RPC. Invitations and removals arrive in Phase 3B.

-- ---------------------------------------------------------------------------
-- profiles: allow accepted co-members to read fellow traveller profiles
-- (own-profile policies remain from the profiles migration)
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_trip_co_members" on public.profiles;
create policy "profiles_select_trip_co_members"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trip_members mine
      join public.trip_members theirs
        on theirs.trip_id = mine.trip_id
       and theirs.status = 'accepted'
       and theirs.user_id = profiles.id
      where mine.user_id = (select auth.uid())
        and mine.status = 'accepted'
    )
  );
-- Accepted trip members can read basic profile rows of people on the same trip.
