-- Phase 4B: trip bookings and reservations
-- Apply after 20260802060000_activity_places.sql
-- Do not edit earlier migrations.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_booking_type') then
    create type public.trip_booking_type as enum (
      'accommodation',
      'flight',
      'train',
      'bus',
      'car_rental',
      'restaurant',
      'activity',
      'other'
    );
  end if;
end $$;

create table if not exists public.trip_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  booking_type public.trip_booking_type not null,
  title text not null,
  provider_name text,
  confirmation_number text,
  booking_reference text,
  status text,
  start_date date,
  start_time time,
  end_date date,
  end_time time,
  location_name text,
  address text,
  geoapify_place_id text,
  latitude double precision,
  longitude double precision,
  departure_location text,
  arrival_location text,
  carrier_name text,
  transport_number text,
  terminal text,
  gate text,
  check_in_time time,
  check_out_time time,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_bookings_title_not_blank check (char_length(trim(title)) >= 1),
  constraint trip_bookings_title_length check (char_length(title) <= 160),
  constraint trip_bookings_provider_length check (
    provider_name is null or char_length(provider_name) <= 160
  ),
  constraint trip_bookings_confirmation_length check (
    confirmation_number is null or char_length(confirmation_number) <= 120
  ),
  constraint trip_bookings_reference_length check (
    booking_reference is null or char_length(booking_reference) <= 120
  ),
  constraint trip_bookings_status_length check (
    status is null or char_length(status) <= 80
  ),
  constraint trip_bookings_location_length check (
    location_name is null or char_length(location_name) <= 160
  ),
  constraint trip_bookings_address_length check (
    address is null or char_length(address) <= 240
  ),
  constraint trip_bookings_geoapify_place_id_length check (
    geoapify_place_id is null or char_length(geoapify_place_id) <= 256
  ),
  constraint trip_bookings_departure_length check (
    departure_location is null or char_length(departure_location) <= 160
  ),
  constraint trip_bookings_arrival_length check (
    arrival_location is null or char_length(arrival_location) <= 160
  ),
  constraint trip_bookings_carrier_length check (
    carrier_name is null or char_length(carrier_name) <= 120
  ),
  constraint trip_bookings_transport_number_length check (
    transport_number is null or char_length(transport_number) <= 80
  ),
  constraint trip_bookings_terminal_length check (
    terminal is null or char_length(terminal) <= 80
  ),
  constraint trip_bookings_gate_length check (
    gate is null or char_length(gate) <= 40
  ),
  constraint trip_bookings_notes_length check (
    notes is null or char_length(notes) <= 2000
  ),
  constraint trip_bookings_date_order check (
    end_date is null or start_date is null or end_date >= start_date
  ),
  constraint trip_bookings_time_order check (
    start_date is null
    or end_date is null
    or start_date <> end_date
    or start_time is null
    or end_time is null
    or end_time >= start_time
  ),
  constraint trip_bookings_latitude_range check (
    latitude is null or (latitude >= -90 and latitude <= 90)
  ),
  constraint trip_bookings_longitude_range check (
    longitude is null or (longitude >= -180 and longitude <= 180)
  ),
  constraint trip_bookings_lat_lng_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  )
);

create index if not exists trip_bookings_trip_id_idx
  on public.trip_bookings (trip_id);

create index if not exists trip_bookings_trip_start_idx
  on public.trip_bookings (trip_id, start_date, start_time, created_at);

comment on table public.trip_bookings is
  'Manual trip bookings/reservations. Access via accepted membership; writes for owner/editor.';

drop trigger if exists trip_bookings_set_updated_at on public.trip_bookings;
create trigger trip_bookings_set_updated_at
  before update on public.trip_bookings
  for each row
  execute function public.set_updated_at();

alter table public.trip_bookings enable row level security;

revoke all on table public.trip_bookings from public;
grant select, insert, update, delete on table public.trip_bookings to authenticated;

drop policy if exists "trip_bookings_select_member" on public.trip_bookings;
create policy "trip_bookings_select_member"
  on public.trip_bookings
  for select
  to authenticated
  using (public.is_accepted_trip_member(trip_id));

drop policy if exists "trip_bookings_insert_editor" on public.trip_bookings;
create policy "trip_bookings_insert_editor"
  on public.trip_bookings
  for insert
  to authenticated
  with check (
    public.can_edit_trip(trip_id)
    and created_by = (select auth.uid())
  );

drop policy if exists "trip_bookings_update_editor" on public.trip_bookings;
create policy "trip_bookings_update_editor"
  on public.trip_bookings
  for update
  to authenticated
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

drop policy if exists "trip_bookings_delete_editor" on public.trip_bookings;
create policy "trip_bookings_delete_editor"
  on public.trip_bookings
  for delete
  to authenticated
  using (public.can_edit_trip(trip_id));
