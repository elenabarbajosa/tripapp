-- Phase 3A UX: destination currency + country codes; update create_trip RPC
-- Apply after 20260802010000_create_trips.sql

-- ---------------------------------------------------------------------------
-- trip_destinations: stable country + per-destination currency
-- ---------------------------------------------------------------------------
alter table public.trip_destinations
  add column if not exists country_code text;

alter table public.trip_destinations
  add column if not exists currency_code text;

update public.trip_destinations td
set currency_code = upper(trim(t.currency))
from public.trips t
where t.id = td.trip_id
  and (td.currency_code is null or td.currency_code = '');

update public.trip_destinations
set currency_code = 'EUR'
where currency_code is null or currency_code = '';

alter table public.trip_destinations
  alter column currency_code set default 'EUR';

alter table public.trip_destinations
  alter column currency_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_destinations_currency_code_format'
  ) then
    alter table public.trip_destinations
      add constraint trip_destinations_currency_code_format
      check (currency_code ~ '^[A-Z]{3}$');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_destinations_country_code_format'
  ) then
    alter table public.trip_destinations
      add constraint trip_destinations_country_code_format
      check (country_code is null or country_code ~ '^[A-Z]{2}$');
  end if;
end $$;

comment on column public.trip_destinations.currency_code is
  'ISO 4217 currency for this destination. Inferred from country at create time.';

comment on column public.trip_destinations.country_code is
  'ISO 3166-1 alpha-2 country code. Coordinates remain nullable for later geocoding.';

-- ---------------------------------------------------------------------------
-- Replace create_trip: derive trip currency from first destination
-- ---------------------------------------------------------------------------
drop function if exists public.create_trip(text, date, date, text, text, text, jsonb);

create or replace function public.create_trip(
  p_name text,
  p_start_date date,
  p_end_date date,
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
  v_trip_currency text;
  v_city text;
  v_country text;
  v_country_code text;
  v_currency_code text;
  v_arrival date;
  v_departure date;
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

  -- Primary trip currency = first destination currency_code
  v_trip_currency := upper(trim(coalesce(p_destinations -> 0 ->> 'currency_code', '')));
  if v_trip_currency !~ '^[A-Z]{3}$' then
    raise exception 'First destination must include a valid ISO currency code';
  end if;

  if upper(trim(p_home_currency)) !~ '^[A-Z]{3}$' then
    raise exception 'Home currency must be a valid ISO currency code';
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
    v_trip_currency,
    upper(trim(p_home_currency)),
    v_user_id
  )
  returning id into v_trip_id;

  insert into public.trip_members (trip_id, user_id, role, status)
  values (v_trip_id, v_user_id, 'owner', 'accepted');

  for v_dest in select value from jsonb_array_elements(p_destinations)
  loop
    v_order := v_order + 1;
    v_city := trim(coalesce(v_dest ->> 'city', ''));
    v_country := trim(coalesce(v_dest ->> 'country', ''));
    v_country_code := upper(trim(coalesce(v_dest ->> 'country_code', '')));
    v_currency_code := upper(trim(coalesce(v_dest ->> 'currency_code', '')));
    v_arrival := (v_dest ->> 'arrival_date')::date;
    v_departure := (v_dest ->> 'departure_date')::date;

    if char_length(v_city) < 1 then
      raise exception 'Destination city is required';
    end if;
    if char_length(v_country) < 1 then
      raise exception 'Destination country is required';
    end if;
    if v_country_code !~ '^[A-Z]{2}$' then
      raise exception 'Destination country_code must be ISO alpha-2';
    end if;
    if v_currency_code !~ '^[A-Z]{3}$' then
      raise exception 'Destination currency_code must be ISO 4217';
    end if;
    if v_departure < v_arrival then
      raise exception 'Destination departure must be on or after arrival';
    end if;
    if v_arrival < p_start_date or v_departure > p_end_date then
      raise exception 'Destination dates must fall within the trip date range';
    end if;

    insert into public.trip_destinations (
      trip_id,
      city,
      country,
      country_code,
      currency_code,
      arrival_date,
      departure_date,
      latitude,
      longitude,
      display_order
    )
    values (
      v_trip_id,
      v_city,
      v_country,
      v_country_code,
      v_currency_code,
      v_arrival,
      v_departure,
      null,
      null,
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

-- Drop previous overload (included p_currency) if still present, then grant new signature.
drop function if exists public.create_trip(text, date, date, text, text, text, jsonb);

revoke all on function public.create_trip(text, date, date, text, text, jsonb) from public;
grant execute on function public.create_trip(text, date, date, text, text, jsonb) to authenticated;
