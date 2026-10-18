-- Part 07b (run in order)
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
