-- Part 07e (run in order)
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
