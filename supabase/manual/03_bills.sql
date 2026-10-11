-- Part 03 of 6. Run the parts in order in the Lovable Cloud SQL editor.
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

