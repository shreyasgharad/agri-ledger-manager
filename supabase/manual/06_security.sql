-- Part 06 of 6. Run the parts in order in the Lovable Cloud SQL editor.
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
