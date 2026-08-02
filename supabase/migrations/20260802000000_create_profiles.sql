-- Phase 2A: profiles foundation for TripApp
-- Apply via Supabase SQL Editor or `supabase db push` after linking the project.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  preferred_currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_preferred_currency_format
    check (preferred_currency ~ '^[A-Z]{3}$')
);

comment on table public.profiles is
  'App user profiles. Primary key matches auth.users.id.';

comment on column public.profiles.preferred_currency is
  'ISO 4217 currency code (exactly three uppercase letters). Default EUR.';

create index if not exists profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create profile when a new auth user is created
-- security definer: must insert on behalf of the auth subsystem while RLS is on.
-- search_path locked to avoid search-path injection.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
begin
  derived_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Traveller'
  );

  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    derived_name,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, update on table public.profiles to authenticated;
-- No insert/delete for authenticated: profile rows are created by the trigger.

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Phase 2A: users may only read their own profile.
-- Phase 3 will add a trip-member policy so accepted members can read limited
-- fellow-traveller profile fields without opening all profiles publicly.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Users may update their own profile row only.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Intentionally no INSERT policy for authenticated/anon.
-- Profile creation goes through handle_new_user() (security definer).
-- Intentionally no DELETE policy; account deletion is handled via auth.users cascade.
