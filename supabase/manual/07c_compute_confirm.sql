-- Part 07c (run in order)
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

