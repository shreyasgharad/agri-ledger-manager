-- AgriAggregator: broker domain schema (lots, weighing, auction, advances, bills, payments)
-- Single-user mode: open RLS scoped to the default org. To enable login later, replace
-- current_org_id() with: select org_id from public.profiles where user_id = auth.uid();
-- (all policies below use current_org_id(), so no table change is needed).

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. Masters: villages, farmers upgrade, crops, bag types
-- ---------------------------------------------------------------------------
create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  name text not null,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, name)
);

alter table public.farmers
  add column if not exists code text,
  add column if not exists village_id uuid references public.villages(id),
  add column if not exists notes text,
  add column if not exists is_active boolean not null default true;

create sequence if not exists public.farmer_code_seq start 1;

create or replace function public.assign_farmer_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'F-' || lpad(nextval('public.farmer_code_seq')::text, 4, '0');
  end if;
  return new;
end $$;

update public.farmers set code = 'F-' || lpad(nextval('public.farmer_code_seq')::text, 4, '0')
  where code is null or code = '';

drop trigger if exists assign_farmer_code on public.farmers;
create trigger assign_farmer_code before insert on public.farmers
  for each row execute function public.assign_farmer_code();

create unique index if not exists farmers_org_code_uidx on public.farmers (org_id, code);
create index if not exists farmers_name_trgm_idx on public.farmers using gin (name gin_trgm_ops);
create index if not exists farmers_phone_trgm_idx on public.farmers using gin (phone gin_trgm_ops);
create index if not exists farmers_village_idx on public.farmers (village_id);

-- single-user mode: legacy tables must also default to the one org
alter table public.farmers alter column org_id set default public.default_org_id();
alter table public.transactions alter column org_id set default public.default_org_id();
alter table public.inventory alter column org_id set default public.default_org_id();
update public.farmers set org_id = public.default_org_id() where org_id is null;
update public.transactions set org_id = public.default_org_id() where org_id is null;
update public.inventory set org_id = public.default_org_id() where org_id is null;

-- balances are computed from bills minus payments, never stored
alter table public.farmers drop column if exists balance;

create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  name text not null, name_local text, default_unit text not null default 'quintal',
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, name)
);

create table if not exists public.bag_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  name text not null, tare_kg numeric(6,3) not null default 0,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, name)
);

insert into public.crops (name, name_local) values
  ('Soybean','सोयाबीन'),('Tur','तूर'),('Gram','हरभरा'),('Wheat','गहू'),
  ('Maize','मका'),('Cotton','कापूस'),('Onion','कांदा')
on conflict (org_id, name) do nothing;
insert into public.bag_types (name) values ('Jute'),('Plastic'),('Other')
on conflict (org_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Lots and weighed bags
-- ---------------------------------------------------------------------------
create sequence if not exists public.lot_code_seq start 1;

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  code text,
  farmer_id uuid not null references public.farmers(id),
  crop_id uuid not null references public.crops(id),
  lot_date date not null default current_date,
  status text not null default 'open' check (status in ('open','auctioned','billed','cancelled')),
  notes text,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, code)
);

create or replace function public.assign_lot_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'L-' || to_char(new.lot_date, 'YYMMDD') || '-' || lpad(nextval('public.lot_code_seq')::text, 4, '0');
  end if;
  return new;
end $$;
drop trigger if exists assign_lot_code on public.lots;
create trigger assign_lot_code before insert on public.lots
  for each row execute function public.assign_lot_code();

create table if not exists public.lot_bags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  lot_id uuid not null references public.lots(id) on delete cascade,
  bag_type_id uuid references public.bag_types(id),
  weight_kg numeric(10,3) not null check (weight_kg > 0),
  seq integer not null default 1,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create or replace view public.lot_totals with (security_invoker = true) as
select l.id as lot_id,
       count(b.id) filter (where b.deleted_at is null) as bag_count,
       coalesce(sum(b.weight_kg) filter (where b.deleted_at is null), 0)::numeric(12,3) as total_kg,
       (coalesce(sum(b.weight_kg) filter (where b.deleted_at is null), 0) / 100)::numeric(12,3) as total_quintal
from public.lots l left join public.lot_bags b on b.lot_id = l.id
group by l.id;

-- ---------------------------------------------------------------------------
-- 3. Auction: bids and the confirmed sale
-- ---------------------------------------------------------------------------
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  lot_id uuid not null references public.lots(id) on delete cascade,
  buyer_id uuid not null references public.buyers(id),
  rate_per_quintal numeric(12,2) not null check (rate_per_quintal > 0),
  placed_at timestamptz not null default now(),
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  lot_id uuid not null unique references public.lots(id),
  buyer_id uuid not null references public.buyers(id),
  rate_per_quintal numeric(12,2) not null check (rate_per_quintal > 0),
  total_kg numeric(12,3) not null,
  gross_amount numeric(12,2) not null,
  sale_date date not null default current_date,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create or replace function public.confirm_sale(p_lot_id uuid, p_bid_id uuid) returns uuid
language plpgsql as $$
declare v_bid public.bids; v_kg numeric; v_sale uuid; v_status text;
begin
  select status into v_status from public.lots where id = p_lot_id and deleted_at is null;
  if v_status is null then raise exception 'Lot not found'; end if;
  if v_status <> 'open' then raise exception 'Lot is already %', v_status; end if;
  select * into v_bid from public.bids where id = p_bid_id and lot_id = p_lot_id and deleted_at is null;
  if v_bid.id is null then raise exception 'Bid does not belong to this lot'; end if;
  select total_kg into v_kg from public.lot_totals where lot_id = p_lot_id;
  if coalesce(v_kg, 0) <= 0 then raise exception 'Lot has no weighed bags'; end if;
  insert into public.sales (lot_id, buyer_id, rate_per_quintal, total_kg, gross_amount)
  values (p_lot_id, v_bid.buyer_id, v_bid.rate_per_quintal, v_kg, round(v_kg / 100 * v_bid.rate_per_quintal, 2))
  returning id into v_sale;
  update public.lots set status = 'auctioned' where id = p_lot_id;
  return v_sale;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Advances
-- ---------------------------------------------------------------------------
create table if not exists public.advances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  farmer_id uuid not null references public.farmers(id),
  type text not null check (type in ('transport','labour','other')),
  amount numeric(12,2) not null check (amount > 0),
  reason text,
  advance_date date not null default current_date,
  settled_bill_id uuid,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  check (type <> 'other' or length(trim(coalesce(reason, ''))) > 0)
);

create or replace view public.farmer_advance_balance with (security_invoker = true) as
select farmer_id, coalesce(sum(amount), 0)::numeric(12,2) as unsettled_total
from public.advances where settled_bill_id is null and deleted_at is null
group by farmer_id;

-- ---------------------------------------------------------------------------
-- 5. Bills (old text-blob bills table is kept as legacy_bills)
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='bills' and column_name='content') then
    alter table public.bills rename to legacy_bills;
    for r in select indexname from pg_indexes where schemaname='public' and tablename='legacy_bills'
             and indexname like 'bills\_%' loop
      execute format('alter index public.%I rename to %I', r.indexname, 'legacy_' || r.indexname);
    end loop;
  end if;
end $$;

create table if not exists public.bill_counters (
  org_id uuid not null default public.default_org_id(),
  party_type text not null check (party_type in ('farmer','buyer')),
  fy text not null,
  last_no integer not null default 0,
  primary key (org_id, party_type, fy)
);

-- Gap-free per org / party / financial year (Apr-Mar). Runs inside the caller's
-- transaction, so a rolled-back bill does not burn a number.
create or replace function public.next_bill_number(p_party_type text) returns text
language plpgsql security definer set search_path = public as $$
declare v_fy text; v_no integer; v_prefix text; v_org uuid := public.current_org_id();
begin
  v_fy := case when extract(month from current_date) >= 4
    then to_char(current_date, 'YY') || '-' || to_char(current_date + interval '1 year', 'YY')
    else to_char(current_date - interval '1 year', 'YY') || '-' || to_char(current_date, 'YY') end;
  insert into public.bill_counters (org_id, party_type, fy, last_no) values (v_org, p_party_type, v_fy, 1)
  on conflict (org_id, party_type, fy) do update set last_no = public.bill_counters.last_no + 1
  returning last_no into v_no;
  v_prefix := case when p_party_type = 'farmer' then 'FB' else 'BB' end;
  return v_prefix || '/' || v_fy || '/' || lpad(v_no::text, 5, '0');
end $$;

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  number text not null,
  party_type text not null check (party_type in ('farmer','buyer')),
  sale_id uuid not null references public.sales(id),
  farmer_id uuid references public.farmers(id),
  buyer_id uuid references public.buyers(id),
  rate_per_quintal numeric(12,2) not null,
  total_kg numeric(12,3) not null,
  gross_amount numeric(12,2) not null,
  commission_pct numeric(4,2) not null check (commission_pct between 0 and 2),
  commission_amount numeric(12,2) not null,
  advances_deducted numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null,
  status text not null default 'issued' check (status in ('draft','issued','paid','cancelled')),
  issued_at timestamptz not null default now(),
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, number),
  unique (sale_id, party_type)
);

create table if not exists public.bill_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  bill_id uuid not null references public.bills(id) on delete cascade,
  description text not null,
  qty_bags integer,
  weight_kg numeric(12,3),
  rate numeric(12,2),
  amount numeric(12,2) not null,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

alter table public.advances
  drop constraint if exists advances_settled_bill_fk,
  add constraint advances_settled_bill_fk foreign key (settled_bill_id) references public.bills(id);

-- ---------------------------------------------------------------------------
-- 6. Billing math + issuing both bills
-- ---------------------------------------------------------------------------
create or replace function public.compute_bill(
  p_sale_id uuid,
  p_farmer_pct numeric default 1.5,
  p_buyer_pct numeric default 1.5,
  p_advance_ids uuid[] default '{}'
) returns table (
  gross_amount numeric, farmer_commission numeric, buyer_commission numeric,
  advances_deducted numeric, farmer_net numeric, buyer_payable numeric
) language plpgsql stable as $$
declare v_gross numeric; v_farmer uuid; v_fc numeric; v_bc numeric; v_adv numeric;
begin
  if p_farmer_pct < 0 or p_farmer_pct > 2 or p_buyer_pct < 0 or p_buyer_pct > 2 then
    raise exception 'Commission must be between 0 and 2 percent';
  end if;
  select s.gross_amount, l.farmer_id into v_gross, v_farmer
  from public.sales s join public.lots l on l.id = s.lot_id where s.id = p_sale_id;
  if v_gross is null then raise exception 'Sale not found'; end if;
  select coalesce(sum(a.amount), 0) into v_adv from public.advances a
  where a.id = any(coalesce(p_advance_ids, '{}')) and a.farmer_id = v_farmer
    and a.settled_bill_id is null and a.deleted_at is null;
  v_fc := round(v_gross * p_farmer_pct / 100, 2);
  v_bc := round(v_gross * p_buyer_pct / 100, 2);
  return query select v_gross, v_fc, v_bc, v_adv, v_gross - v_fc - v_adv, v_gross + v_bc;
end $$;

create or replace function public.issue_bills(
  p_sale_id uuid,
  p_farmer_pct numeric default 1.5,
  p_buyer_pct numeric default 1.5,
  p_advance_ids uuid[] default '{}'
) returns table (farmer_bill_id uuid, buyer_bill_id uuid)
language plpgsql as $$
declare
  c record; s public.sales; v_lot public.lots; v_crop text; v_bags integer;
  v_fb uuid; v_bb uuid;
begin
  select * into s from public.sales where id = p_sale_id;
  if s.id is null then raise exception 'Sale not found'; end if;
  select * into v_lot from public.lots where id = s.lot_id;
  if v_lot.status = 'billed' then raise exception 'Bills already issued for this sale'; end if;
  select name into v_crop from public.crops where id = v_lot.crop_id;
  select bag_count into v_bags from public.lot_totals where lot_id = v_lot.id;
  select * into c from public.compute_bill(p_sale_id, p_farmer_pct, p_buyer_pct, p_advance_ids);

  insert into public.bills (number, party_type, sale_id, farmer_id, buyer_id, rate_per_quintal, total_kg,
    gross_amount, commission_pct, commission_amount, advances_deducted, net_amount)
  values (public.next_bill_number('farmer'), 'farmer', s.id, v_lot.farmer_id, s.buyer_id, s.rate_per_quintal,
    s.total_kg, c.gross_amount, p_farmer_pct, c.farmer_commission, c.advances_deducted, c.farmer_net)
  returning id into v_fb;

  insert into public.bills (number, party_type, sale_id, farmer_id, buyer_id, rate_per_quintal, total_kg,
    gross_amount, commission_pct, commission_amount, advances_deducted, net_amount)
  values (public.next_bill_number('buyer'), 'buyer', s.id, v_lot.farmer_id, s.buyer_id, s.rate_per_quintal,
    s.total_kg, c.gross_amount, p_buyer_pct, c.buyer_commission, 0, c.buyer_payable)
  returning id into v_bb;

  insert into public.bill_items (bill_id, description, qty_bags, weight_kg, rate, amount)
  select b, v_crop, v_bags, s.total_kg, s.rate_per_quintal, c.gross_amount from unnest(array[v_fb, v_bb]) b;

  update public.advances set settled_bill_id = v_fb
  where id = any(coalesce(p_advance_ids, '{}')) and farmer_id = v_lot.farmer_id and settled_bill_id is null;
  update public.lots set status = 'billed' where id = v_lot.id;
  return query select v_fb, v_bb;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Payments and balances (computed, never stored)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  bill_id uuid not null references public.bills(id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('cash','upi','bank')),
  paid_at timestamptz not null default now(),
  reference text,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create or replace view public.farmer_balances with (security_invoker = true) as
select b.farmer_id,
       coalesce(sum(b.net_amount), 0)::numeric(12,2) as billed,
       coalesce(sum(p.paid), 0)::numeric(12,2) as paid,
       (coalesce(sum(b.net_amount), 0) - coalesce(sum(p.paid), 0))::numeric(12,2) as due
from public.bills b
left join (select bill_id, sum(amount) paid from public.payments where deleted_at is null group by bill_id) p
  on p.bill_id = b.id
where b.party_type = 'farmer' and b.status <> 'cancelled' and b.deleted_at is null
group by b.farmer_id;

create or replace view public.buyer_balances with (security_invoker = true) as
select b.buyer_id,
       coalesce(sum(b.net_amount), 0)::numeric(12,2) as billed,
       coalesce(sum(p.paid), 0)::numeric(12,2) as paid,
       (coalesce(sum(b.net_amount), 0) - coalesce(sum(p.paid), 0))::numeric(12,2) as due
from public.bills b
left join (select bill_id, sum(amount) paid from public.payments where deleted_at is null group by bill_id) p
  on p.bill_id = b.id
where b.party_type = 'buyer' and b.status <> 'cancelled' and b.deleted_at is null
group by b.buyer_id;

-- ---------------------------------------------------------------------------
-- 8. Settings and audit log
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  org_id uuid primary key default public.default_org_id() references public.organizations(id),
  business_name text not null default 'My Agri Business',
  address text, phone text, gstin text, bill_footer text,
  default_farmer_commission numeric(4,2) not null default 1.5 check (default_farmer_commission between 0 and 2),
  default_buyer_commission numeric(4,2) not null default 1.5 check (default_buyer_commission between 0 and 2),
  bill_language text not null default 'en',
  bill_prefix_farmer text not null default 'FB',
  bill_prefix_buyer text not null default 'BB',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.settings (org_id) values (public.default_org_id()) on conflict do nothing;

create table if not exists public.audit_log (
  id bigserial primary key,
  org_id uuid not null default public.default_org_id(),
  table_name text not null, row_id text, action text not null,
  old_data jsonb, new_data jsonb, at timestamptz not null default now()
);

create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (org_id, table_name, row_id, action, old_data, new_data)
  values (public.current_org_id(), tg_table_name,
          coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id'), tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- ---------------------------------------------------------------------------
-- 9. updated_at triggers, audit triggers, RLS (open, default org), indexes, realtime
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['villages','crops','bag_types','lots','lot_bags','bids','sales','advances',
                            'bills','bill_items','payments','settings'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;

  foreach t in array array['bills','payments','advances','sales'] loop
    execute format('drop trigger if exists audit_row on public.%I', t);
    execute format('create trigger audit_row after insert or update or delete on public.%I for each row execute function public.audit_row()', t);
  end loop;

  -- OPEN POLICIES (single user). Swap current_org_id() for the auth-based version to lock down.
  foreach t in array array['villages','crops','bag_types','lots','lot_bags','bids','sales','advances',
                            'bills','bill_items','payments','settings','bill_counters','audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists open_select on public.%I', t);
    execute format('drop policy if exists open_insert on public.%I', t);
    execute format('drop policy if exists open_update on public.%I', t);
    execute format('create policy open_select on public.%I for select to anon, authenticated using (org_id = public.current_org_id())', t);
    execute format('create policy open_insert on public.%I for insert to anon, authenticated with check (org_id = public.current_org_id())', t);
    if t <> 'audit_log' then
      execute format('create policy open_update on public.%I for update to anon, authenticated using (org_id = public.current_org_id()) with check (org_id = public.current_org_id())', t);
    end if;
  end loop;

  -- weighed bags and bids may be hard-deleted while a lot is still open
  foreach t in array array['lot_bags','bids'] loop
    execute format('grant delete on public.%I to anon, authenticated', t);
    execute format('drop policy if exists open_delete on public.%I', t);
    execute format('create policy open_delete on public.%I for delete to anon, authenticated using (org_id = public.current_org_id())', t);
  end loop;
end $$;

grant usage, select on sequence public.farmer_code_seq, public.lot_code_seq to anon, authenticated;
grant select on public.lot_totals, public.farmer_advance_balance, public.farmer_balances, public.buyer_balances to anon, authenticated;
grant execute on function public.compute_bill(uuid, numeric, numeric, uuid[]) to anon, authenticated;
grant execute on function public.issue_bills(uuid, numeric, numeric, uuid[]) to anon, authenticated;
grant execute on function public.confirm_sale(uuid, uuid) to anon, authenticated;
grant execute on function public.next_bill_number(text) to anon, authenticated;

create index if not exists lots_farmer_idx on public.lots (farmer_id);
create index if not exists lots_date_idx on public.lots (org_id, lot_date desc);
create index if not exists lot_bags_lot_idx on public.lot_bags (lot_id);
create index if not exists bids_lot_idx on public.bids (lot_id);
create index if not exists advances_farmer_idx on public.advances (farmer_id) where settled_bill_id is null;
create index if not exists bills_sale_idx on public.bills (sale_id);
create index if not exists bills_farmer_idx on public.bills (farmer_id);
create index if not exists bills_buyer_idx on public.bills (buyer_id);
create index if not exists bill_items_bill_idx on public.bill_items (bill_id);
create index if not exists payments_bill_idx on public.payments (bill_id);

do $$
declare t text;
begin
  foreach t in array array['lots','lot_bags','bids','sales','advances','bills','payments'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;  -- already added or publication missing
    end;
  end loop;
end $$;

-- Keep bills.status in step with payments (issued <-> paid)
create or replace function public.sync_bill_paid_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_bill uuid := coalesce(new.bill_id, old.bill_id); v_net numeric; v_paid numeric;
begin
  select net_amount into v_net from public.bills where id = v_bill;
  select coalesce(sum(amount), 0) into v_paid from public.payments where bill_id = v_bill and deleted_at is null;
  update public.bills set status = case when v_paid >= v_net then 'paid' else 'issued' end
  where id = v_bill and status in ('issued', 'paid');
  return coalesce(new, old);
end $$;
drop trigger if exists sync_bill_paid_status on public.payments;
create trigger sync_bill_paid_status after insert or update on public.payments
  for each row execute function public.sync_bill_paid_status();

-- ---------------------------------------------------------------------------
-- Sanity checks (run manually):
--   gross 10000, 1.5% each, advances 500  => farmer_net 9350.00, buyer_payable 10150.00
--   gross 10000, 2% each, advances 0      => farmer_net 9800.00, buyer_payable 10200.00
--   commission 2.5 => raises 'Commission must be between 0 and 2 percent'
-- ---------------------------------------------------------------------------
