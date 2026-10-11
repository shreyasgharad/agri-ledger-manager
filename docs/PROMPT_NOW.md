# Prompt to paste into Lovable (the ONE combined prompt for the remaining database work)

State before this prompt: Lovable Cloud DB live; foundation (default_org_id, set_updated_at, open RLS) and buyers (B-0001 codes) already done. Uses 1 of your 2 remaining credits today.

---

DATABASE ONLY. Existing: buyers, default_org_id(), set_updated_at(), open RLS scoped to default org. Keep existing transactions and inventory tables working. Do not redesign UI; only change app code as needed to compile and keep Farmers working without login. Do all below in a few ordered migrations, then regenerate types.

1. FARMERS UPGRADE: add to farmers: code (F-0001 via sequence+trigger like buyers, unique per org), village_id, notes, is_active default true. Drop farmers.balance. Create villages(id, org_id, name unique per org, standard common columns). Backfill codes for existing rows.
2. MASTERS: crops(name, name_local, default_unit) seeded Soybean, Tur, Gram, Wheat, Maize, Cotton, Onion; bag_types(name, tare_kg default 0) seeded Jute, Plastic, Other.
3. LOTS: lots(code L-yyMMdd-0001, farmer_id, crop_id, lot_date default current_date, status open|auctioned|billed|cancelled, notes); lot_bags(lot_id, bag_type_id, weight_kg numeric(10,3) >0, seq); view lot_totals(lot_id, bag_count, total_kg, total_quintal).
4. AUCTION: bids(lot_id, buyer_id, rate_per_quintal numeric(12,2)>0, placed_at); sales(lot_id UNIQUE, buyer_id, rate_per_quintal, total_kg, gross_amount, sale_date); confirm_sale(lot_id, bid_id).
5. ADVANCES: advances(farmer_id, type transport|labour|other, amount>0, reason required when type=other, advance_date, settled_bill_id); view farmer_advance_balance.
6. BILLS: rename old bills to legacy_bills; create new bills(number unique per org, party_type farmer|buyer, sale_id, farmer_id, buyer_id, rate_per_quintal, total_kg, gross_amount, commission_pct, commission_amount, advances_deducted, net_amount, status draft|issued|paid|cancelled, issued_at) and bill_items(bill_id, description, qty_bags, weight_kg, rate, amount). Gap-free numbering per org per financial year (Apr-Mar) via counters table + next_bill_number(party_type) giving FB/25-26/00001 and BB/25-26/00001.
7. MATH: compute_bill(sale_id, farmer_commission_pct 1.5, buyer_commission_pct 1.5, advance_ids uuid[]) returning gross, commissions, advances deducted, farmer net = gross - farmer commission - advances, buyer payable = gross + buyer commission; reject commission outside 0..2; round half-up 2 decimals. issue_bills(sale_id, farmer_pct, buyer_pct, advance_ids) creates both bills + items in one transaction, settles chosen advances, sets lot billed. payments(bill_id, amount>0, method cash|upi|bank, paid_at, reference); views farmer_balances and buyer_balances (billed minus paid).
8. SETTINGS & AUDIT: settings (one row per org: business_name, address, phone, gstin, bill_footer, default_farmer_commission 1.5, default_buyer_commission 1.5, bill_language, bill_prefix_farmer, bill_prefix_buyer); audit_log with triggers on bills, payments, advances, sales.
9. SECURITY & SEED: same open default-org RLS policies on all new tables (no hard delete), FK indexes, realtime on lots, lot_bags, bids, sales, bills, advances, payments. Seed 5 demo farmers (with villages), 2 lots with bags.

Reply with tables/functions created, anything not done, and assumptions.
