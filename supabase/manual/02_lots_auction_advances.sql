-- Part 02 of 6. Run the parts in order in the Lovable Cloud SQL editor.
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

