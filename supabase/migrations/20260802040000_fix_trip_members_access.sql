-- Phase 3B follow-up: fix trip member / profile read access without RLS recursion.
-- Apply after 20260802030000_trip_invitations.sql.
-- Do not edit earlier migrations.

-- ---------------------------------------------------------------------------
-- Security-definer helper: co-member profile visibility (avoids RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.shares_accepted_trip_with(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members mine
    join public.trip_members theirs
      on theirs.trip_id = mine.trip_id
     and theirs.status = 'accepted'
     and theirs.user_id = p_other_user_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'accepted'
  );
$$;

comment on function public.shares_accepted_trip_with(uuid) is
  'True when the current user and the target user share an accepted trip membership. SECURITY DEFINER to avoid recursive RLS when embedding profiles.';

revoke all on function public.shares_accepted_trip_with(uuid) from public;
grant execute on function public.shares_accepted_trip_with(uuid) to authenticated;

drop policy if exists "profiles_select_trip_co_members" on public.profiles;
create policy "profiles_select_trip_co_members"
  on public.profiles
  for select
  to authenticated
  using (public.shares_accepted_trip_with(id));

-- ---------------------------------------------------------------------------
-- Secure RPC: list accepted members with profiles for one trip
-- ---------------------------------------------------------------------------
create or replace function public.get_trip_members(p_trip_id uuid)
returns table (
  member_id uuid,
  trip_id uuid,
  user_id uuid,
  role public.trip_member_role,
  status text,
  display_name text,
  email text,
  avatar_url text,
  preferred_currency text,
  member_created_at timestamptz,
  member_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_trip_id is null then
    raise exception 'Trip id is required';
  end if;

  if not public.is_accepted_trip_member(p_trip_id) then
    raise exception 'Not an accepted member of this trip';
  end if;

  return query
  select
    tm.id,
    tm.trip_id,
    tm.user_id,
    tm.role,
    tm.status,
    coalesce(nullif(trim(p.display_name), ''), split_part(coalesce(p.email, ''), '@', 1), 'Traveller'),
    p.email,
    p.avatar_url,
    coalesce(p.preferred_currency, 'EUR'),
    tm.created_at,
    tm.updated_at
  from public.trip_members tm
  join public.profiles p on p.id = tm.user_id
  where tm.trip_id = p_trip_id
    and tm.status = 'accepted'
  order by
    case tm.role
      when 'owner' then 0
      when 'editor' then 1
      else 2
    end,
    lower(coalesce(p.display_name, p.email, ''));
end;
$$;

revoke all on function public.get_trip_members(uuid) from public;
grant execute on function public.get_trip_members(uuid) to authenticated;

comment on function public.get_trip_members(uuid) is
  'Returns accepted trip members with profile fields for co-members. Avoids nested PostgREST profile embeds that can recurse under RLS.';
