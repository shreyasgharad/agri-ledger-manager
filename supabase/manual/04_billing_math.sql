-- Part 04 of 6. Run the parts in order in the Lovable Cloud SQL editor.
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

