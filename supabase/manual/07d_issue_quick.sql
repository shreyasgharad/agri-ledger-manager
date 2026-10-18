-- Part 07d (run in order)
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

