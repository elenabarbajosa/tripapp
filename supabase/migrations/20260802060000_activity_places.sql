-- Phase 4A.1: Geoapify place metadata on itinerary activities
-- Apply after 20260802050000_trip_itinerary.sql
-- Do not edit earlier migrations.

alter table public.trip_activities
  add column if not exists geoapify_place_id text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.trip_activities
  drop constraint if exists trip_activities_geoapify_place_id_length;

alter table public.trip_activities
  add constraint trip_activities_geoapify_place_id_length
  check (
    geoapify_place_id is null
    or char_length(geoapify_place_id) <= 256
  );

alter table public.trip_activities
  drop constraint if exists trip_activities_latitude_range;

alter table public.trip_activities
  add constraint trip_activities_latitude_range
  check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.trip_activities
  drop constraint if exists trip_activities_longitude_range;

alter table public.trip_activities
  add constraint trip_activities_longitude_range
  check (longitude is null or (longitude >= -180 and longitude <= 180));

alter table public.trip_activities
  drop constraint if exists trip_activities_lat_lng_pair;

alter table public.trip_activities
  add constraint trip_activities_lat_lng_pair
  check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  );

comment on column public.trip_activities.geoapify_place_id is
  'Optional Geoapify place id from address autocomplete. Null for manual locations.';

comment on column public.trip_activities.latitude is
  'Optional WGS84 latitude from a confirmed Geoapify selection. Null for manual locations.';

comment on column public.trip_activities.longitude is
  'Optional WGS84 longitude from a confirmed Geoapify selection. Null for manual locations.';
