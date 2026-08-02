-- Phase 3B: trip invitations, share links, member role/removal, ownership transfer
-- Apply after 20260802020000_destination_currency.sql via SQL Editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_invitation_status') then
    create type public.trip_invitation_status as enum (
      'pending',
      'accepted',
      'declined',
      'revoked',
      'expired'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- trip_invitations
-- ---------------------------------------------------------------------------
create table if not exists public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete restrict,
  invited_email text,
  intended_role public.trip_member_role not null default 'viewer',
  token_hash text not null,
  status public.trip_invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  declined_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_invitations_token_hash_unique unique (token_hash),
  constraint trip_invitations_intended_role_check
    check (intended_role in ('editor', 'viewer'))
);

create index if not exists trip_invitations_trip_id_idx
  on public.trip_invitations (trip_id);

create index if not exists trip_invitations_invited_email_idx
  on public.trip_invitations (invited_email)
  where invited_email is not null;

create index if not exists trip_invitations_status_expires_idx
  on public.trip_invitations (status, expires_at);

-- One active (pending) email invitation per trip + email.
create unique index if not exists trip_invitations_unique_pending_email
  on public.trip_invitations (trip_id, invited_email)
  where status = 'pending' and invited_email is not null;

comment on table public.trip_invitations is
  'Email and share-link invitations. Raw tokens are never stored; only token_hash.';

comment on column public.trip_invitations.invited_email is
  'Normalized lowercase email for email invites. Null for share-link invites.';

comment on column public.trip_invitations.token_hash is
  'SHA-256 hex digest of the raw invitation token.';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
drop trigger if exists trip_invitations_set_updated_at on public.trip_invitations;
create trigger trip_invitations_set_updated_at
  before update on public.trip_invitations
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.normalize_invitation_email(p_email text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select nullif(lower(trim(p_email)), '');
$$;

comment on function public.normalize_invitation_email(text) is
  'Lowercase + trim invitation emails; blank becomes null.';

create or replace function public.hash_invitation_token(p_raw_token text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select encode(digest(convert_to(p_raw_token, 'UTF8'), 'sha256'), 'hex');
$$;

comment on function public.hash_invitation_token(text) is
  'SHA-256 hex digest of a raw invitation token (pgcrypto digest).';

create or replace function public.generate_invitation_token()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select encode(gen_random_bytes(32), 'hex');
$$;

comment on function public.generate_invitation_token() is
  'Cryptographically secure raw invitation token (32 random bytes, hex-encoded).';

create or replace function public.mark_expired_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.trip_invitations
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.mark_expired_invitations() is
  'Flip pending invitations past expires_at to expired. Returns rows updated.';

revoke all on function public.normalize_invitation_email(text) from public;
revoke all on function public.hash_invitation_token(text) from public;
revoke all on function public.generate_invitation_token() from public;
revoke all on function public.mark_expired_invitations() from public;

grant execute on function public.normalize_invitation_email(text) to authenticated;
grant execute on function public.hash_invitation_token(text) to authenticated;
grant execute on function public.generate_invitation_token() to authenticated;
grant execute on function public.mark_expired_invitations() to authenticated;

-- ---------------------------------------------------------------------------
-- Internal: current user email (normalized)
-- ---------------------------------------------------------------------------
create or replace function public.current_invitation_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public.normalize_invitation_email(
    coalesce(
      (select p.email from public.profiles p where p.id = (select auth.uid())),
      (select auth.jwt() ->> 'email')
    )
  );
$$;

revoke all on function public.current_invitation_email() from public;

-- ---------------------------------------------------------------------------
-- Internal: destination summary for safe invitation previews
-- ---------------------------------------------------------------------------
create or replace function public.trip_destination_summary(p_trip_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select string_agg(td.city || ', ' || td.country, ' · ' order by td.display_order, td.arrival_date)
  from public.trip_destinations td
  where td.trip_id = p_trip_id;
$$;

revoke all on function public.trip_destination_summary(uuid) from public;

-- ---------------------------------------------------------------------------
-- Internal: upsert accepted membership (handles prior "left" rows)
-- ---------------------------------------------------------------------------
create or replace function public.ensure_accepted_trip_member(
  p_trip_id uuid,
  p_user_id uuid,
  p_role public.trip_member_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role = 'owner' then
    raise exception 'Cannot add membership with owner role via invitation';
  end if;

  insert into public.trip_members (trip_id, user_id, role, status)
  values (p_trip_id, p_user_id, p_role, 'accepted')
  on conflict (trip_id, user_id) do update
    set
      status = 'accepted',
      role = case
        when public.trip_members.role = 'owner' then public.trip_members.role
        else excluded.role
      end,
      updated_at = now()
    where public.trip_members.status is distinct from 'accepted'
       or (
         public.trip_members.role <> 'owner'
         and public.trip_members.role is distinct from excluded.role
       );
end;
$$;

revoke all on function public.ensure_accepted_trip_member(uuid, uuid, public.trip_member_role) from public;

-- ---------------------------------------------------------------------------
-- create_trip_invitation
-- ---------------------------------------------------------------------------
create or replace function public.create_trip_invitation(
  p_trip_id uuid,
  p_email text,
  p_role public.trip_member_role default 'viewer',
  p_expires_in_hours integer default 168
)
returns table (
  invitation_id uuid,
  raw_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_token text;
  v_hash text;
  v_expires_at timestamptz;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Only the trip owner can create invitations';
  end if;

  if p_role is null or p_role not in ('editor', 'viewer') then
    raise exception 'Invitation role must be editor or viewer';
  end if;

  if p_expires_in_hours is null or p_expires_in_hours < 1 then
    raise exception 'Expiration must be at least 1 hour';
  end if;

  v_email := public.normalize_invitation_email(p_email);
  if v_email is null or position('@' in v_email) < 2 then
    raise exception 'A valid invitation email is required';
  end if;

  perform public.mark_expired_invitations();

  if exists (
    select 1
    from public.trip_members tm
    join public.profiles p on p.id = tm.user_id
    where tm.trip_id = p_trip_id
      and tm.status = 'accepted'
      and public.normalize_invitation_email(p.email) = v_email
  ) then
    raise exception 'That person is already a member of this trip';
  end if;

  if exists (
    select 1
    from public.trip_invitations ti
    where ti.trip_id = p_trip_id
      and ti.status = 'pending'
      and ti.invited_email = v_email
      and ti.expires_at >= now()
  ) then
    raise exception 'An active invitation already exists for that email';
  end if;

  v_token := public.generate_invitation_token();
  v_hash := public.hash_invitation_token(v_token);
  v_expires_at := now() + make_interval(hours => p_expires_in_hours);

  insert into public.trip_invitations (
    trip_id,
    invited_by,
    invited_email,
    intended_role,
    token_hash,
    status,
    expires_at
  )
  values (
    p_trip_id,
    v_user_id,
    v_email,
    p_role,
    v_hash,
    'pending',
    v_expires_at
  )
  returning id into v_id;

  invitation_id := v_id;
  raw_token := v_token;
  expires_at := v_expires_at;
  return next;
end;
$$;

revoke all on function public.create_trip_invitation(uuid, text, public.trip_member_role, integer) from public;
grant execute on function public.create_trip_invitation(uuid, text, public.trip_member_role, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- create_trip_share_link
-- ---------------------------------------------------------------------------
create or replace function public.create_trip_share_link(
  p_trip_id uuid,
  p_role public.trip_member_role default 'viewer',
  p_expires_in_hours integer default 168
)
returns table (
  invitation_id uuid,
  raw_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_token text;
  v_hash text;
  v_expires_at timestamptz;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Only the trip owner can create share links';
  end if;

  if p_role is null or p_role not in ('editor', 'viewer') then
    raise exception 'Share link role must be editor or viewer';
  end if;

  if p_expires_in_hours is null or p_expires_in_hours < 1 then
    raise exception 'Expiration must be at least 1 hour';
  end if;

  perform public.mark_expired_invitations();

  v_token := public.generate_invitation_token();
  v_hash := public.hash_invitation_token(v_token);
  v_expires_at := now() + make_interval(hours => p_expires_in_hours);

  insert into public.trip_invitations (
    trip_id,
    invited_by,
    invited_email,
    intended_role,
    token_hash,
    status,
    expires_at
  )
  values (
    p_trip_id,
    v_user_id,
    null,
    p_role,
    v_hash,
    'pending',
    v_expires_at
  )
  returning id into v_id;

  invitation_id := v_id;
  raw_token := v_token;
  expires_at := v_expires_at;
  return next;
end;
$$;

revoke all on function public.create_trip_share_link(uuid, public.trip_member_role, integer) from public;
grant execute on function public.create_trip_share_link(uuid, public.trip_member_role, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- get_trip_invitation_preview
-- ---------------------------------------------------------------------------
create or replace function public.get_trip_invitation_preview(p_raw_token text)
returns table (
  invitation_id uuid,
  trip_id uuid,
  trip_name text,
  destination_summary text,
  inviter_display_name text,
  intended_role public.trip_member_role,
  status public.trip_invitation_status,
  expires_at timestamptz,
  is_expired boolean,
  is_usable boolean,
  already_member boolean,
  requires_email_match boolean,
  email_matches boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_inv public.trip_invitations%rowtype;
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_email_ok boolean;
  v_expired boolean;
  v_member boolean := false;
begin
  if p_raw_token is null or length(trim(p_raw_token)) = 0 then
    raise exception 'Invitation token is required';
  end if;

  perform public.mark_expired_invitations();

  v_hash := public.hash_invitation_token(trim(p_raw_token));

  select * into v_inv
  from public.trip_invitations ti
  where ti.token_hash = v_hash;

  if not found then
    raise exception 'Invitation not found';
  end if;

  v_user_email := public.current_invitation_email();
  v_expired := v_inv.expires_at < now() or v_inv.status = 'expired';

  if v_inv.invited_email is null then
    v_email_ok := true;
  elsif v_user_id is null then
    v_email_ok := false;
  else
    v_email_ok := v_user_email is not null
      and v_user_email = v_inv.invited_email;
  end if;

  if v_user_id is not null then
    select exists (
      select 1
      from public.trip_members tm
      where tm.trip_id = v_inv.trip_id
        and tm.user_id = v_user_id
        and tm.status = 'accepted'
    ) into v_member;
  end if;

  invitation_id := v_inv.id;
  trip_id := v_inv.trip_id;
  trip_name := (select t.name from public.trips t where t.id = v_inv.trip_id);
  destination_summary := public.trip_destination_summary(v_inv.trip_id);
  inviter_display_name := (
    select coalesce(nullif(trim(p.display_name), ''), 'Traveller')
    from public.profiles p
    where p.id = v_inv.invited_by
  );
  intended_role := v_inv.intended_role;
  status := case
    when v_inv.status = 'pending' and v_expired then 'expired'::public.trip_invitation_status
    else v_inv.status
  end;
  expires_at := v_inv.expires_at;
  is_expired := v_expired;
  already_member := v_member;
  requires_email_match := v_inv.invited_email is not null;
  email_matches := case
    when v_user_id is null then null
    when v_inv.invited_email is null then true
    else v_email_ok
  end;
  is_usable := v_inv.status = 'pending'
    and not v_expired
    and not v_member
    and (
      v_inv.invited_email is null
      or v_user_id is null
      or v_email_ok
    );

  return next;
end;
$$;

revoke all on function public.get_trip_invitation_preview(text) from public;
grant execute on function public.get_trip_invitation_preview(text) to authenticated;
grant execute on function public.get_trip_invitation_preview(text) to anon;

-- ---------------------------------------------------------------------------
-- accept_trip_invitation
-- ---------------------------------------------------------------------------
create or replace function public.accept_trip_invitation(p_raw_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_hash text;
  v_inv public.trip_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_raw_token is null or length(trim(p_raw_token)) = 0 then
    raise exception 'Invitation token is required';
  end if;

  perform public.mark_expired_invitations();

  v_hash := public.hash_invitation_token(trim(p_raw_token));
  v_user_email := public.current_invitation_email();

  select * into v_inv
  from public.trip_invitations ti
  where ti.token_hash = v_hash
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = v_inv.trip_id
      and tm.user_id = v_user_id
      and tm.status = 'accepted'
  ) then
    if v_inv.status = 'pending' then
      update public.trip_invitations
      set
        status = 'accepted',
        accepted_by = v_user_id,
        accepted_at = now()
      where id = v_inv.id;
    end if;
    return v_inv.trip_id;
  end if;

  if v_inv.status = 'expired' or v_inv.expires_at < now() then
    if v_inv.status = 'pending' then
      update public.trip_invitations
      set status = 'expired'
      where id = v_inv.id;
    end if;
    raise exception 'Invitation has expired';
  end if;

  if v_inv.status = 'revoked' then
    raise exception 'Invitation has been revoked';
  end if;

  if v_inv.status = 'declined' then
    raise exception 'Invitation was declined';
  end if;

  if v_inv.status = 'accepted' then
    raise exception 'Invitation has already been accepted';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'Invitation is not available';
  end if;

  if v_inv.invited_email is not null then
    if v_user_email is null or v_user_email <> v_inv.invited_email then
      raise exception 'This invitation was sent to a different email address';
    end if;
  end if;

  perform public.ensure_accepted_trip_member(
    v_inv.trip_id,
    v_user_id,
    v_inv.intended_role
  );

  update public.trip_invitations
  set
    status = 'accepted',
    accepted_by = v_user_id,
    accepted_at = now()
  where id = v_inv.id;

  return v_inv.trip_id;
end;
$$;

revoke all on function public.accept_trip_invitation(text) from public;
grant execute on function public.accept_trip_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- decline_trip_invitation
-- ---------------------------------------------------------------------------
create or replace function public.decline_trip_invitation(p_raw_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_hash text;
  v_inv public.trip_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_raw_token is null or length(trim(p_raw_token)) = 0 then
    raise exception 'Invitation token is required';
  end if;

  perform public.mark_expired_invitations();

  v_hash := public.hash_invitation_token(trim(p_raw_token));
  v_user_email := public.current_invitation_email();

  select * into v_inv
  from public.trip_invitations ti
  where ti.token_hash = v_hash
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'Only pending invitations can be declined';
  end if;

  if v_inv.expires_at < now() then
    update public.trip_invitations
    set status = 'expired'
    where id = v_inv.id;
    raise exception 'Invitation has expired';
  end if;

  if v_inv.invited_email is not null then
    if v_user_email is null or v_user_email <> v_inv.invited_email then
      raise exception 'This invitation was sent to a different email address';
    end if;
  end if;

  update public.trip_invitations
  set
    status = 'declined',
    declined_at = now()
  where id = v_inv.id;
end;
$$;

revoke all on function public.decline_trip_invitation(text) from public;
grant execute on function public.decline_trip_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- revoke_trip_invitation
-- ---------------------------------------------------------------------------
create or replace function public.revoke_trip_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_inv public.trip_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_inv
  from public.trip_invitations ti
  where ti.id = p_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if not public.is_trip_owner(v_inv.trip_id) then
    raise exception 'Only the trip owner can revoke invitations';
  end if;

  perform public.mark_expired_invitations();

  select * into v_inv
  from public.trip_invitations ti
  where ti.id = p_invitation_id
  for update;

  if v_inv.status <> 'pending' then
    raise exception 'Only pending invitations can be revoked';
  end if;

  update public.trip_invitations
  set
    status = 'revoked',
    revoked_at = now()
  where id = v_inv.id;
end;
$$;

revoke all on function public.revoke_trip_invitation(uuid) from public;
grant execute on function public.revoke_trip_invitation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- update_trip_member_role
-- ---------------------------------------------------------------------------
create or replace function public.update_trip_member_role(
  p_trip_id uuid,
  p_member_user_id uuid,
  p_role public.trip_member_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_current public.trip_member_role;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Only the trip owner can change member roles';
  end if;

  if p_role is null or p_role not in ('editor', 'viewer') then
    raise exception 'Role must be editor or viewer';
  end if;

  if p_member_user_id = v_user_id then
    raise exception 'Use transfer ownership to change the owner role';
  end if;

  select tm.role into v_current
  from public.trip_members tm
  where tm.trip_id = p_trip_id
    and tm.user_id = p_member_user_id
    and tm.status = 'accepted'
  for update;

  if not found then
    raise exception 'Member not found';
  end if;

  if v_current = 'owner' then
    raise exception 'Cannot change the owner role with this action';
  end if;

  update public.trip_members
  set role = p_role
  where trip_id = p_trip_id
    and user_id = p_member_user_id
    and status = 'accepted';
end;
$$;

revoke all on function public.update_trip_member_role(uuid, uuid, public.trip_member_role) from public;
grant execute on function public.update_trip_member_role(uuid, uuid, public.trip_member_role) to authenticated;

-- ---------------------------------------------------------------------------
-- remove_trip_member
-- ---------------------------------------------------------------------------
create or replace function public.remove_trip_member(
  p_trip_id uuid,
  p_member_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role public.trip_member_role;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Only the trip owner can remove members';
  end if;

  if p_member_user_id = v_user_id then
    raise exception 'Owner cannot remove themselves; transfer ownership first';
  end if;

  select tm.role into v_role
  from public.trip_members tm
  where tm.trip_id = p_trip_id
    and tm.user_id = p_member_user_id
    and tm.status = 'accepted'
  for update;

  if not found then
    raise exception 'Member not found';
  end if;

  if v_role = 'owner' then
    raise exception 'Cannot remove the trip owner';
  end if;

  update public.trip_members
  set status = 'left'
  where trip_id = p_trip_id
    and user_id = p_member_user_id
    and status = 'accepted';
end;
$$;

revoke all on function public.remove_trip_member(uuid, uuid) from public;
grant execute on function public.remove_trip_member(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- leave_trip
-- ---------------------------------------------------------------------------
create or replace function public.leave_trip(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role public.trip_member_role;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select tm.role into v_role
  from public.trip_members tm
  where tm.trip_id = p_trip_id
    and tm.user_id = v_user_id
    and tm.status = 'accepted'
  for update;

  if not found then
    raise exception 'You are not a member of this trip';
  end if;

  if v_role = 'owner' then
    raise exception 'Owner cannot leave without transferring ownership first';
  end if;

  update public.trip_members
  set status = 'left'
  where trip_id = p_trip_id
    and user_id = v_user_id
    and status = 'accepted';
end;
$$;

revoke all on function public.leave_trip(uuid) from public;
grant execute on function public.leave_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- transfer_trip_ownership
-- ---------------------------------------------------------------------------
create or replace function public.transfer_trip_ownership(
  p_trip_id uuid,
  p_new_owner_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_new_role public.trip_member_role;
  v_owner_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Only the current owner can transfer ownership';
  end if;

  if p_new_owner_user_id is null or p_new_owner_user_id = v_user_id then
    raise exception 'Choose a different accepted member as the new owner';
  end if;

  select tm.role into v_new_role
  from public.trip_members tm
  where tm.trip_id = p_trip_id
    and tm.user_id = p_new_owner_user_id
    and tm.status = 'accepted'
  for update;

  if not found then
    raise exception 'New owner must already be an accepted trip member';
  end if;

  -- Lock current owner row as well.
  perform 1
  from public.trip_members tm
  where tm.trip_id = p_trip_id
    and tm.user_id = v_user_id
    and tm.status = 'accepted'
    and tm.role = 'owner'
  for update;

  update public.trip_members
  set role = 'editor'
  where trip_id = p_trip_id
    and user_id = v_user_id
    and status = 'accepted'
    and role = 'owner';

  update public.trip_members
  set role = 'owner'
  where trip_id = p_trip_id
    and user_id = p_new_owner_user_id
    and status = 'accepted';

  select count(*)::integer into v_owner_count
  from public.trip_members tm
  where tm.trip_id = p_trip_id
    and tm.status = 'accepted'
    and tm.role = 'owner';

  if v_owner_count <> 1 then
    raise exception 'Ownership transfer failed: expected exactly one owner';
  end if;
end;
$$;

revoke all on function public.transfer_trip_ownership(uuid, uuid) from public;
grant execute on function public.transfer_trip_ownership(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- list_my_pending_invitations
-- ---------------------------------------------------------------------------
create or replace function public.list_my_pending_invitations()
returns table (
  invitation_id uuid,
  trip_id uuid,
  trip_name text,
  destination_summary text,
  inviter_display_name text,
  intended_role public.trip_member_role,
  expires_at timestamptz,
  created_at timestamptz,
  invited_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.mark_expired_invitations();

  v_email := public.current_invitation_email();
  if v_email is null then
    return;
  end if;

  return query
  select
    ti.id,
    ti.trip_id,
    t.name,
    public.trip_destination_summary(ti.trip_id),
    coalesce(nullif(trim(inviter.display_name), ''), 'Traveller'),
    ti.intended_role,
    ti.expires_at,
    ti.created_at,
    ti.invited_email
  from public.trip_invitations ti
  join public.trips t on t.id = ti.trip_id
  join public.profiles inviter on inviter.id = ti.invited_by
  where ti.status = 'pending'
    and ti.expires_at >= now()
    and ti.invited_email = v_email
    and not exists (
      select 1
      from public.trip_members tm
      where tm.trip_id = ti.trip_id
        and tm.user_id = v_user_id
        and tm.status = 'accepted'
    )
  order by ti.created_at desc;
end;
$$;

revoke all on function public.list_my_pending_invitations() from public;
grant execute on function public.list_my_pending_invitations() to authenticated;

-- ---------------------------------------------------------------------------
-- accept_trip_invitation_by_id (Home email cards)
-- ---------------------------------------------------------------------------
create or replace function public.accept_trip_invitation_by_id(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_inv public.trip_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.mark_expired_invitations();

  v_user_email := public.current_invitation_email();

  select * into v_inv
  from public.trip_invitations ti
  where ti.id = p_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  -- Email-card accept is only for invitations addressed to the current user.
  if v_inv.invited_email is null then
    raise exception 'Share-link invitations must be accepted via token';
  end if;

  if v_user_email is null or v_user_email <> v_inv.invited_email then
    raise exception 'This invitation was sent to a different email address';
  end if;

  if exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = v_inv.trip_id
      and tm.user_id = v_user_id
      and tm.status = 'accepted'
  ) then
    if v_inv.status = 'pending' then
      update public.trip_invitations
      set
        status = 'accepted',
        accepted_by = v_user_id,
        accepted_at = now()
      where id = v_inv.id;
    end if;
    return v_inv.trip_id;
  end if;

  if v_inv.status = 'expired' or v_inv.expires_at < now() then
    if v_inv.status = 'pending' then
      update public.trip_invitations
      set status = 'expired'
      where id = v_inv.id;
    end if;
    raise exception 'Invitation has expired';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'Invitation is not available';
  end if;

  perform public.ensure_accepted_trip_member(
    v_inv.trip_id,
    v_user_id,
    v_inv.intended_role
  );

  update public.trip_invitations
  set
    status = 'accepted',
    accepted_by = v_user_id,
    accepted_at = now()
  where id = v_inv.id;

  return v_inv.trip_id;
end;
$$;

revoke all on function public.accept_trip_invitation_by_id(uuid) from public;
grant execute on function public.accept_trip_invitation_by_id(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- decline_trip_invitation_by_id
-- ---------------------------------------------------------------------------
create or replace function public.decline_trip_invitation_by_id(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_inv public.trip_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.mark_expired_invitations();

  v_user_email := public.current_invitation_email();

  select * into v_inv
  from public.trip_invitations ti
  where ti.id = p_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if v_inv.invited_email is null then
    raise exception 'Share-link invitations must be declined via token';
  end if;

  if v_user_email is null or v_user_email <> v_inv.invited_email then
    raise exception 'This invitation was sent to a different email address';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'Only pending invitations can be declined';
  end if;

  if v_inv.expires_at < now() then
    update public.trip_invitations
    set status = 'expired'
    where id = v_inv.id;
    raise exception 'Invitation has expired';
  end if;

  update public.trip_invitations
  set
    status = 'declined',
    declined_at = now()
  where id = v_inv.id;
end;
$$;

revoke all on function public.decline_trip_invitation_by_id(uuid) from public;
grant execute on function public.decline_trip_invitation_by_id(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants (select only — mutations go through RPCs)
-- ---------------------------------------------------------------------------
grant select on table public.trip_invitations to authenticated;
revoke insert, update, delete on table public.trip_invitations from authenticated;
revoke all on table public.trip_invitations from anon;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.trip_invitations enable row level security;

drop policy if exists "trip_invitations_select_owner" on public.trip_invitations;
create policy "trip_invitations_select_owner"
  on public.trip_invitations
  for select
  to authenticated
  using (public.is_trip_owner(trip_id));

drop policy if exists "trip_invitations_select_invitee" on public.trip_invitations;
create policy "trip_invitations_select_invitee"
  on public.trip_invitations
  for select
  to authenticated
  using (
    status = 'pending'
    and expires_at >= now()
    and invited_email is not null
    and invited_email = public.normalize_invitation_email(
      coalesce(
        (select p.email from public.profiles p where p.id = (select auth.uid())),
        (select auth.jwt() ->> 'email')
      )
    )
  );

-- No INSERT / UPDATE / DELETE policies: clients cannot mutate rows directly.
