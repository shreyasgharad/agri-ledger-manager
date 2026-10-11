-- Part 05 of 6. Run the parts in order in the Lovable Cloud SQL editor.
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

