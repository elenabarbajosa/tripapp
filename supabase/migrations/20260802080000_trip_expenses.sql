-- Phase 4C: trip expenses, splits, and settlements
-- Apply after 20260802070000_trip_bookings.sql

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_expense_category') then
    create type public.trip_expense_category as enum (
      'accommodation',
      'transport',
      'food',
      'activities',
      'shopping',
      'other'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'trip_expense_split_method') then
    create type public.trip_expense_split_method as enum (
      'equal',
      'exact',
      'percentage'
    );
  end if;
end $$;

create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  paid_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  category public.trip_expense_category not null default 'other',
  amount_minor bigint not null,
  currency_code text not null,
  expense_date date not null,
  split_method public.trip_expense_split_method not null default 'equal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_expenses_title_not_blank check (char_length(trim(title)) >= 1),
  constraint trip_expenses_title_length check (char_length(title) <= 160),
  constraint trip_expenses_amount_positive check (amount_minor > 0),
  constraint trip_expenses_currency_code check (currency_code ~ '^[A-Z]{3}$'),
  constraint trip_expenses_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists trip_expenses_trip_id_idx on public.trip_expenses (trip_id);
create index if not exists trip_expenses_trip_date_idx on public.trip_expenses (trip_id, expense_date desc);

create table if not exists public.trip_expense_splits (
  expense_id uuid not null references public.trip_expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  share_amount_minor bigint not null,
  share_percentage numeric(8, 4),
  created_at timestamptz not null default now(),
  primary key (expense_id, user_id),
  constraint trip_expense_splits_amount_non_negative check (share_amount_minor >= 0),
  constraint trip_expense_splits_percentage_range check (
    share_percentage is null
    or (share_percentage >= 0 and share_percentage <= 100)
  )
);

create index if not exists trip_expense_splits_user_id_idx on public.trip_expense_splits (user_id);

create table if not exists public.trip_expense_settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  payer_id uuid not null references public.profiles (id) on delete restrict,
  payee_id uuid not null references public.profiles (id) on delete restrict,
  amount_minor bigint not null,
  currency_code text not null,
  settlement_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_settlements_amount_positive check (amount_minor > 0),
  constraint trip_settlements_currency_code check (currency_code ~ '^[A-Z]{3}$'),
  constraint trip_settlements_different_parties check (payer_id <> payee_id),
  constraint trip_settlements_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists trip_settlements_trip_id_idx
  on public.trip_expense_settlements (trip_id);

drop trigger if exists trip_expenses_set_updated_at on public.trip_expenses;
create trigger trip_expenses_set_updated_at
  before update on public.trip_expenses
  for each row execute function public.set_updated_at();

drop trigger if exists trip_settlements_set_updated_at on public.trip_expense_settlements;
create trigger trip_settlements_set_updated_at
  before update on public.trip_expense_settlements
  for each row execute function public.set_updated_at();

-- RLS: read for members; block direct writes (RPCs are SECURITY DEFINER)
alter table public.trip_expenses enable row level security;
alter table public.trip_expense_splits enable row level security;
alter table public.trip_expense_settlements enable row level security;

revoke all on table public.trip_expenses from public;
revoke all on table public.trip_expense_splits from public;
revoke all on table public.trip_expense_settlements from public;

grant select on table public.trip_expenses to authenticated;
grant select on table public.trip_expense_splits to authenticated;
grant select on table public.trip_expense_settlements to authenticated;

drop policy if exists "trip_expenses_select_member" on public.trip_expenses;
create policy "trip_expenses_select_member"
  on public.trip_expenses for select to authenticated
  using (public.is_accepted_trip_member(trip_id));

drop policy if exists "trip_expense_splits_select_member" on public.trip_expense_splits;
create policy "trip_expense_splits_select_member"
  on public.trip_expense_splits for select to authenticated
  using (
    exists (
      select 1 from public.trip_expenses e
      where e.id = expense_id and public.is_accepted_trip_member(e.trip_id)
    )
  );

drop policy if exists "trip_settlements_select_member" on public.trip_expense_settlements;
create policy "trip_settlements_select_member"
  on public.trip_expense_settlements for select to authenticated
  using (public.is_accepted_trip_member(trip_id));

-- Helpers
create or replace function public.is_accepted_member_of_trip(p_trip_id uuid, p_user_id uuid)
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
      and tm.user_id = p_user_id
      and tm.status = 'accepted'
  );
$$;

revoke all on function public.is_accepted_member_of_trip(uuid, uuid) from public;
grant execute on function public.is_accepted_member_of_trip(uuid, uuid) to authenticated;

create or replace function public.create_trip_expense(
  p_trip_id uuid,
  p_title text,
  p_category public.trip_expense_category,
  p_amount_minor bigint,
  p_currency_code text,
  p_expense_date date,
  p_paid_by uuid,
  p_split_method public.trip_expense_split_method,
  p_participant_ids uuid[],
  p_share_amounts_minor bigint[] default null,
  p_share_percentages numeric[] default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_expense_id uuid;
  v_count int;
  v_i int;
  v_shares bigint[];
  v_sum bigint := 0;
  v_base bigint;
  v_rem bigint;
  v_pct_sum numeric := 0;
  v_floors bigint[];
  v_fracs numeric[];
  v_order int[];
  v_idx int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.can_edit_trip(p_trip_id) then
    raise exception 'Only owners and editors can manage expenses';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_currency_code is null or p_currency_code !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be ISO 4217';
  end if;
  if not public.is_accepted_member_of_trip(p_trip_id, p_paid_by) then
    raise exception 'Payer must be an accepted trip member';
  end if;
  if p_participant_ids is null or coalesce(array_length(p_participant_ids, 1), 0) < 1 then
    raise exception 'At least one participant is required';
  end if;
  v_count := array_length(p_participant_ids, 1);
  for v_i in 1..v_count loop
    if not public.is_accepted_member_of_trip(p_trip_id, p_participant_ids[v_i]) then
      raise exception 'Every participant must be an accepted trip member';
    end if;
  end loop;

  if p_split_method = 'equal' then
    v_base := p_amount_minor / v_count;
    v_rem := p_amount_minor % v_count;
    v_shares := array[]::bigint[];
    for v_i in 1..v_count loop
      v_shares := v_shares || (v_base + case when v_i <= v_rem then 1 else 0 end);
    end loop;
  elsif p_split_method = 'exact' then
    if p_share_amounts_minor is null or array_length(p_share_amounts_minor, 1) <> v_count then
      raise exception 'Exact splits require one share amount per participant';
    end if;
    v_shares := p_share_amounts_minor;
    for v_i in 1..v_count loop
      if v_shares[v_i] is null or v_shares[v_i] < 0 then
        raise exception 'Share amounts cannot be negative';
      end if;
      v_sum := v_sum + v_shares[v_i];
    end loop;
    if v_sum <> p_amount_minor then
      raise exception 'Share amounts must equal the expense total';
    end if;
  elsif p_split_method = 'percentage' then
    if p_share_percentages is null or array_length(p_share_percentages, 1) <> v_count then
      raise exception 'Percentage splits require one percentage per participant';
    end if;
    for v_i in 1..v_count loop
      v_pct_sum := v_pct_sum + coalesce(p_share_percentages[v_i], 0);
    end loop;
    if abs(v_pct_sum - 100) > 0.0001 then
      raise exception 'Percentages must total 100';
    end if;
    v_floors := array[]::bigint[];
    v_fracs := array[]::numeric[];
    v_sum := 0;
    for v_i in 1..v_count loop
      v_floors := v_floors || floor((p_amount_minor * p_share_percentages[v_i]) / 100)::bigint;
      v_fracs := v_fracs || (((p_amount_minor * p_share_percentages[v_i]) / 100) - floor((p_amount_minor * p_share_percentages[v_i]) / 100));
      v_sum := v_sum + v_floors[v_i];
    end loop;
    v_rem := p_amount_minor - v_sum;
    v_shares := v_floors;
    -- allocate remainder by largest fractional part, then index
    while v_rem > 0 loop
      v_idx := 1;
      for v_i in 2..v_count loop
        if v_fracs[v_i] > v_fracs[v_idx]
           or (v_fracs[v_i] = v_fracs[v_idx] and v_i < v_idx) then
          v_idx := v_i;
        end if;
      end loop;
      v_shares[v_idx] := v_shares[v_idx] + 1;
      v_fracs[v_idx] := -1; -- consumed
      v_rem := v_rem - 1;
    end loop;
  else
    raise exception 'Unsupported split method';
  end if;

  insert into public.trip_expenses (
    trip_id, created_by, paid_by, title, category, amount_minor,
    currency_code, expense_date, split_method, notes
  ) values (
    p_trip_id, v_uid, p_paid_by, trim(p_title), p_category, p_amount_minor,
    p_currency_code, p_expense_date, p_split_method, nullif(trim(coalesce(p_notes, '')), '')
  ) returning id into v_expense_id;

  for v_i in 1..v_count loop
    insert into public.trip_expense_splits (
      expense_id, user_id, share_amount_minor, share_percentage
    ) values (
      v_expense_id,
      p_participant_ids[v_i],
      v_shares[v_i],
      case when p_split_method = 'percentage' then p_share_percentages[v_i] else null end
    );
  end loop;

  return v_expense_id;
end;
$$;

create or replace function public.update_trip_expense(
  p_expense_id uuid,
  p_title text,
  p_category public.trip_expense_category,
  p_amount_minor bigint,
  p_currency_code text,
  p_expense_date date,
  p_paid_by uuid,
  p_split_method public.trip_expense_split_method,
  p_participant_ids uuid[],
  p_share_amounts_minor bigint[] default null,
  p_share_percentages numeric[] default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trip_id uuid;
  v_count int;
  v_i int;
  v_shares bigint[];
  v_sum bigint := 0;
  v_base bigint;
  v_rem bigint;
  v_pct_sum numeric := 0;
  v_floors bigint[];
  v_fracs numeric[];
  v_idx int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  select trip_id into v_trip_id from public.trip_expenses where id = p_expense_id;
  if v_trip_id is null then
    raise exception 'Expense not found';
  end if;
  if not public.can_edit_trip(v_trip_id) then
    raise exception 'Only owners and editors can manage expenses';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_currency_code is null or p_currency_code !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be ISO 4217';
  end if;
  if not public.is_accepted_member_of_trip(v_trip_id, p_paid_by) then
    raise exception 'Payer must be an accepted trip member';
  end if;
  if p_participant_ids is null or coalesce(array_length(p_participant_ids, 1), 0) < 1 then
    raise exception 'At least one participant is required';
  end if;
  v_count := array_length(p_participant_ids, 1);
  for v_i in 1..v_count loop
    if not public.is_accepted_member_of_trip(v_trip_id, p_participant_ids[v_i]) then
      raise exception 'Every participant must be an accepted trip member';
    end if;
  end loop;

  if p_split_method = 'equal' then
    v_base := p_amount_minor / v_count;
    v_rem := p_amount_minor % v_count;
    v_shares := array[]::bigint[];
    for v_i in 1..v_count loop
      v_shares := v_shares || (v_base + case when v_i <= v_rem then 1 else 0 end);
    end loop;
  elsif p_split_method = 'exact' then
    if p_share_amounts_minor is null or array_length(p_share_amounts_minor, 1) <> v_count then
      raise exception 'Exact splits require one share amount per participant';
    end if;
    v_shares := p_share_amounts_minor;
    for v_i in 1..v_count loop
      if v_shares[v_i] is null or v_shares[v_i] < 0 then
        raise exception 'Share amounts cannot be negative';
      end if;
      v_sum := v_sum + v_shares[v_i];
    end loop;
    if v_sum <> p_amount_minor then
      raise exception 'Share amounts must equal the expense total';
    end if;
  elsif p_split_method = 'percentage' then
    if p_share_percentages is null or array_length(p_share_percentages, 1) <> v_count then
      raise exception 'Percentage splits require one percentage per participant';
    end if;
    for v_i in 1..v_count loop
      v_pct_sum := v_pct_sum + coalesce(p_share_percentages[v_i], 0);
    end loop;
    if abs(v_pct_sum - 100) > 0.0001 then
      raise exception 'Percentages must total 100';
    end if;
    v_floors := array[]::bigint[];
    v_fracs := array[]::numeric[];
    v_sum := 0;
    for v_i in 1..v_count loop
      v_floors := v_floors || floor((p_amount_minor * p_share_percentages[v_i]) / 100)::bigint;
      v_fracs := v_fracs || (((p_amount_minor * p_share_percentages[v_i]) / 100) - floor((p_amount_minor * p_share_percentages[v_i]) / 100));
      v_sum := v_sum + v_floors[v_i];
    end loop;
    v_rem := p_amount_minor - v_sum;
    v_shares := v_floors;
    while v_rem > 0 loop
      v_idx := 1;
      for v_i in 2..v_count loop
        if v_fracs[v_i] > v_fracs[v_idx]
           or (v_fracs[v_i] = v_fracs[v_idx] and v_i < v_idx) then
          v_idx := v_i;
        end if;
      end loop;
      v_shares[v_idx] := v_shares[v_idx] + 1;
      v_fracs[v_idx] := -1;
      v_rem := v_rem - 1;
    end loop;
  else
    raise exception 'Unsupported split method';
  end if;

  update public.trip_expenses set
    title = trim(p_title),
    category = p_category,
    amount_minor = p_amount_minor,
    currency_code = p_currency_code,
    expense_date = p_expense_date,
    paid_by = p_paid_by,
    split_method = p_split_method,
    notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = p_expense_id;

  delete from public.trip_expense_splits where expense_id = p_expense_id;
  for v_i in 1..v_count loop
    insert into public.trip_expense_splits (
      expense_id, user_id, share_amount_minor, share_percentage
    ) values (
      p_expense_id,
      p_participant_ids[v_i],
      v_shares[v_i],
      case when p_split_method = 'percentage' then p_share_percentages[v_i] else null end
    );
  end loop;
end;
$$;

create or replace function public.delete_trip_expense(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select trip_id into v_trip_id from public.trip_expenses where id = p_expense_id;
  if v_trip_id is null then
    raise exception 'Expense not found';
  end if;
  if not public.can_edit_trip(v_trip_id) then
    raise exception 'Only owners and editors can manage expenses';
  end if;
  delete from public.trip_expenses where id = p_expense_id;
end;
$$;

create or replace function public.record_trip_settlement(
  p_trip_id uuid,
  p_payer_id uuid,
  p_payee_id uuid,
  p_amount_minor bigint,
  p_currency_code text,
  p_settlement_date date,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.can_edit_trip(p_trip_id) then
    raise exception 'Only owners and editors can record settlements';
  end if;
  if p_payer_id = p_payee_id then
    raise exception 'Payer and payee must be different';
  end if;
  if not public.is_accepted_member_of_trip(p_trip_id, p_payer_id)
     or not public.is_accepted_member_of_trip(p_trip_id, p_payee_id) then
    raise exception 'Payer and payee must be accepted trip members';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_currency_code is null or p_currency_code !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be ISO 4217';
  end if;

  insert into public.trip_expense_settlements (
    trip_id, created_by, payer_id, payee_id, amount_minor, currency_code, settlement_date, notes
  ) values (
    p_trip_id, v_uid, p_payer_id, p_payee_id, p_amount_minor, p_currency_code, p_settlement_date,
    nullif(trim(coalesce(p_notes, '')), '')
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.delete_trip_settlement(p_settlement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select trip_id into v_trip_id from public.trip_expense_settlements where id = p_settlement_id;
  if v_trip_id is null then
    raise exception 'Settlement not found';
  end if;
  if not public.can_edit_trip(v_trip_id) then
    raise exception 'Only owners and editors can delete settlements';
  end if;
  delete from public.trip_expense_settlements where id = p_settlement_id;
end;
$$;

revoke all on function public.create_trip_expense(uuid, text, public.trip_expense_category, bigint, text, date, uuid, public.trip_expense_split_method, uuid[], bigint[], numeric[], text) from public;
grant execute on function public.create_trip_expense(uuid, text, public.trip_expense_category, bigint, text, date, uuid, public.trip_expense_split_method, uuid[], bigint[], numeric[], text) to authenticated;

revoke all on function public.update_trip_expense(uuid, text, public.trip_expense_category, bigint, text, date, uuid, public.trip_expense_split_method, uuid[], bigint[], numeric[], text) from public;
grant execute on function public.update_trip_expense(uuid, text, public.trip_expense_category, bigint, text, date, uuid, public.trip_expense_split_method, uuid[], bigint[], numeric[], text) to authenticated;

revoke all on function public.delete_trip_expense(uuid) from public;
grant execute on function public.delete_trip_expense(uuid) to authenticated;

revoke all on function public.record_trip_settlement(uuid, uuid, uuid, bigint, text, date, text) from public;
grant execute on function public.record_trip_settlement(uuid, uuid, uuid, bigint, text, date, text) to authenticated;

revoke all on function public.delete_trip_settlement(uuid) from public;
grant execute on function public.delete_trip_settlement(uuid) to authenticated;
