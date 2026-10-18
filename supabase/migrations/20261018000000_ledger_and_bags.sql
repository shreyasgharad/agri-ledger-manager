-- Farmer ledger, bag/cash advances, one-step billing, role helpers.
-- Additive and safe to re-run. Works in "open mode" until app_flags.roles_enforced = 'on'
-- (see 20261018000100_roles_and_rls.sql).

-- ---------------------------------------------------------------------------
-- 1. Flags and role helpers
-- ---------------------------------------------------------------------------
create table if not exists public.app_flags (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_flags enable row level security;
drop policy if exists flags_read on public.app_flags;
create policy flags_read on public.app_flags for select to anon, authenticated using (true);
grant select on public.app_flags to anon, authenticated;
grant all on public.app_flags to service_role;

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then 'anon'
         else coalesce((select p.role from public.profiles p where p.user_id = auth.uid()), 'pending') end
$$;

create or replace function public.roles_enforced() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'on' from public.app_flags where key = 'roles_enforced'), false)
$$;

create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = public as $$
  select (not public.roles_enforced()) or public.app_role() in ('admin', 'staff')
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select (not public.roles_enforced()) or public.app_role() = 'admin'
$$;

grant execute on function public.app_role(), public.roles_enforced(), public.can_write(), public.is_admin()
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bag prices (editable in Settings) and more crops
-- ---------------------------------------------------------------------------
alter table public.bag_types add column if not exists price numeric(10,2) not null default 0;
update public.bag_types set price = 25 where name = 'Jute' and price = 0;
update public.bag_types set price = 15 where name = 'Plastic' and price = 0;

insert into public.crops (name, name_local) values
  ('Rice', 'तांदूळ'), ('Chana', 'चणा'), ('Daal', 'डाळ')
on conflict (org_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Advances: cash loans, bags, repayments
-- ---------------------------------------------------------------------------
alter table public.advances
  add column if not exists bag_type_id uuid references public.bag_types(id),
  add column if not exists qty integer,
  add column if not exists due_date date,
  add column if not exists repaid_at timestamptz,
  add column if not exists repaid_method text;

do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.advances'::regclass and contype = 'c' loop
    execute format('alter table public.advances drop constraint %I', c);
  end loop;
end $$;

alter table public.advances
  add constraint advances_type_check check (type in ('cash', 'transport', 'labour', 'bags', 'other')),
  add constraint advances_amount_check check (amount > 0),
  add constraint advances_qty_check check (qty is null or qty > 0),
  add constraint advances_method_check check (repaid_method is null or repaid_method in ('cash', 'upi', 'bank')),
  add constraint advances_reason_check check (type <> 'other' or length(trim(coalesce(reason, ''))) > 0),
  add constraint advances_bags_check check (type <> 'bags' or (qty is not null and bag_type_id is not null));

create index if not exists advances_open_idx on public.advances (farmer_id)
  where settled_bill_id is null and repaid_at is null;

-- unsettled = not deducted on a bill and not repaid in cash
create or replace view public.farmer_advance_balance with (security_invoker = true) as
select farmer_id, coalesce(sum(amount), 0)::numeric(12,2) as unsettled_total
from public.advances
where settled_bill_id is null and repaid_at is null and deleted_at is null
group by farmer_id;

create or replace view public.farmer_overview with (security_invoker = true) as
select f.id as farmer_id,
       coalesce(a.open_advance, 0)::numeric(12,2) as open_advance,
       coalesce(b.due, 0)::numeric(12,2) as bills_due,
       coalesce(l.lots, 0)::int as lot_count,
       coalesce(b.bill_count, 0)::int as bill_count,
       greatest(a.last_adv, l.last_lot, b.last_bill) as last_activity
from public.farmers f
left join (
  select farmer_id,
         sum(amount) filter (where settled_bill_id is null and repaid_at is null) as open_advance,
         max(advance_date) as last_adv
  from public.advances where deleted_at is null group by farmer_id
) a on a.farmer_id = f.id
left join (
  select farmer_id, count(*) as lots, max(lot_date) as last_lot
  from public.lots where deleted_at is null and status <> 'cancelled' group by farmer_id
) l on l.farmer_id = f.id
left join (
  select bl.farmer_id, count(*) as bill_count,
         sum(bl.net_amount - coalesce(p.paid, 0)) as due,
         max(bl.issued_at::date) as last_bill
  from public.bills bl
  left join (select bill_id, sum(amount) as paid from public.payments where deleted_at is null group by bill_id) p
    on p.bill_id = bl.id
  where bl.party_type = 'farmer' and bl.status <> 'cancelled' and bl.deleted_at is null
  group by bl.farmer_id
) b on b.farmer_id = f.id
where f.deleted_at is null;

grant select on public.farmer_advance_balance, public.farmer_overview to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Billing functions (permission-checked)
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
    and a.settled_bill_id is null and a.repaid_at is null and a.deleted_at is null;
  v_fc := round(v_gross * p_farmer_pct / 100, 2);
  v_bc := round(v_gross * p_buyer_pct / 100, 2);
  return query select v_gross, v_fc, v_bc, v_adv, v_gross - v_fc - v_adv, v_gross + v_bc;
end $$;

create or replace function public.confirm_sale(p_lot_id uuid, p_bid_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_bid public.bids; v_kg numeric; v_sale uuid; v_status text;
begin
  if not public.can_write() then raise exception 'You do not have permission to do this'; end if;
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

create or replace function public.issue_bills(
  p_sale_id uuid,
  p_farmer_pct numeric default 1.5,
  p_buyer_pct numeric default 1.5,
  p_advance_ids uuid[] default '{}'
) returns table (farmer_bill_id uuid, buyer_bill_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  c record; s public.sales; v_lot public.lots; v_crop text; v_bags integer;
  v_fb uuid; v_bb uuid;
begin
  if not public.can_write() then raise exception 'You do not have permission to do this'; end if;
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
  where id = any(coalesce(p_advance_ids, '{}')) and farmer_id = v_lot.farmer_id
    and settled_bill_id is null and repaid_at is null and deleted_at is null;
  update public.lots set status = 'billed' where id = v_lot.id;
  return query select v_fb, v_bb;
end $$;

-- One step: weigh + sell + issue both bills (used by "Create bill")
create or replace function public.quick_bill(
  p_farmer_id uuid, p_crop_id uuid, p_buyer_id uuid,
  p_bags integer, p_total_kg numeric, p_rate numeric,
  p_farmer_pct numeric default 1.5, p_buyer_pct numeric default 1.5,
  p_advance_ids uuid[] default '{}', p_bag_type_id uuid default null
) returns table (out_lot_id uuid, out_farmer_bill uuid, out_buyer_bill uuid)
language plpgsql security definer set search_path = public as $$
declare v_lot uuid; v_bid uuid; v_sale uuid; v_each numeric; v_left numeric; i int; v_fb uuid; v_bb uuid;
begin
  if not public.can_write() then raise exception 'You do not have permission to create bills'; end if;
  if p_bags < 1 or p_bags > 500 then raise exception 'Bags must be between 1 and 500'; end if;
  if p_total_kg <= 0 or p_total_kg / p_bags < 1 then raise exception 'Weight per bag must be at least 1 kg'; end if;
  if p_rate <= 0 then raise exception 'Rate must be more than 0'; end if;

  insert into public.lots (farmer_id, crop_id) values (p_farmer_id, p_crop_id) returning id into v_lot;
  v_each := round(p_total_kg / p_bags, 3);
  v_left := p_total_kg;
  for i in 1..p_bags loop
    insert into public.lot_bags (lot_id, bag_type_id, weight_kg, seq)
    values (v_lot, p_bag_type_id, case when i = p_bags then v_left else v_each end, i);
    v_left := v_left - v_each;
  end loop;

  insert into public.bids (lot_id, buyer_id, rate_per_quintal) values (v_lot, p_buyer_id, p_rate) returning id into v_bid;
  v_sale := public.confirm_sale(v_lot, v_bid);
  select b.farmer_bill_id, b.buyer_bill_id into v_fb, v_bb
  from public.issue_bills(v_sale, p_farmer_pct, p_buyer_pct, p_advance_ids) b;
  return query select v_lot, v_fb, v_bb;
end $$;

create or replace function public.mark_advance_repaid(p_advance_id uuid, p_method text default 'cash') returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_write() then raise exception 'You do not have permission to do this'; end if;
  update public.advances set repaid_at = now(), repaid_method = p_method
  where id = p_advance_id and settled_bill_id is null and repaid_at is null and deleted_at is null;
  if not found then raise exception 'Advance not found or already settled'; end if;
end $$;

-- Admin-only profit and loss for one farmer
create or replace function public.farmer_pnl(p_farmer_id uuid)
returns table (
  farmer_commission numeric, buyer_commission numeric, total_commission numeric,
  gross_traded numeric, bills_count int, open_advances numeric, open_cash numeric, open_bags numeric,
  open_labour_transport numeric, bills_due numeric
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only the admin can see profit and loss'; end if;
  return query
  with bl as (
    select * from public.bills where farmer_id = p_farmer_id and status <> 'cancelled' and deleted_at is null
  ), adv as (
    select * from public.advances where farmer_id = p_farmer_id and settled_bill_id is null and repaid_at is null and deleted_at is null
  ), paid as (
    select bill_id, sum(amount) as amt from public.payments where deleted_at is null group by bill_id
  )
  select
    coalesce((select sum(commission_amount) from bl where party_type = 'farmer'), 0),
    coalesce((select sum(commission_amount) from bl where party_type = 'buyer'), 0),
    coalesce((select sum(commission_amount) from bl), 0),
    coalesce((select sum(gross_amount) from bl where party_type = 'farmer'), 0),
    (select count(*)::int from bl where party_type = 'farmer'),
    coalesce((select sum(amount) from adv), 0),
    coalesce((select sum(amount) from adv where type = 'cash'), 0),
    coalesce((select sum(amount) from adv where type = 'bags'), 0),
    coalesce((select sum(amount) from adv where type in ('labour', 'transport', 'other')), 0),
    coalesce((select sum(bl.net_amount - coalesce(paid.amt, 0)) from bl left join paid on paid.bill_id = bl.id where bl.party_type = 'farmer'), 0);
end $$;

grant execute on function public.compute_bill(uuid, numeric, numeric, uuid[]) to anon, authenticated;
grant execute on function public.confirm_sale(uuid, uuid) to anon, authenticated;
grant execute on function public.issue_bills(uuid, numeric, numeric, uuid[]) to anon, authenticated;
grant execute on function public.quick_bill(uuid, uuid, uuid, integer, numeric, numeric, numeric, numeric, uuid[], uuid) to anon, authenticated;
grant execute on function public.mark_advance_repaid(uuid, text) to anon, authenticated;
grant execute on function public.farmer_pnl(uuid) to anon, authenticated;
