-- Phase 5A: destination map coordinates (Geoapify place id + geocoded cache)
-- Apply after 20260802100000_trip_ideas.sql
-- Does not alter city/country/arrival/departure or create-trip UI.

alter table public.trip_destinations
  add column if not exists geoapify_place_id text,
  add column if not exists geocoded_at timestamptz;

-- Latitude / longitude already exist from create_trips; add validation constraints safely.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trip_destinations_geoapify_place_id_length'
  ) then
    alter table public.trip_destinations
      add constraint trip_destinations_geoapify_place_id_length
      check (geoapify_place_id is null or char_length(geoapify_place_id) <= 256);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trip_destinations_latitude_range'
  ) then
    alter table public.trip_destinations
      add constraint trip_destinations_latitude_range
      check (latitude is null or (latitude >= -90 and latitude <= 90));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trip_destinations_longitude_range'
  ) then
    alter table public.trip_destinations
      add constraint trip_destinations_longitude_range
      check (longitude is null or (longitude >= -180 and longitude <= 180));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trip_destinations_lat_lng_pair'
  ) then
    alter table public.trip_destinations
      add constraint trip_destinations_lat_lng_pair
      check (
        (latitude is null and longitude is null)
        or (latitude is not null and longitude is not null)
      );
  end if;
end $$;

comment on column public.trip_destinations.geoapify_place_id is
  'Cached Geoapify place id from destination geocoding (Phase 5A).';
comment on column public.trip_destinations.geocoded_at is
  'When latitude/longitude were last resolved via geoapify-geocode-destination.';
