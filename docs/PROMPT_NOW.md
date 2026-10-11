# Prompt to paste into Lovable (uses 1 of 3 daily prompts)

Do first: Lovable editor -> More -> Cloud -> Supabase -> **Disconnect** "dad db" (it is inactive for 400+ days and cannot be restored), then enable **Lovable Cloud** (or connect a NEW Supabase project). Then paste everything below the line.

---

DATABASE FIRST. The old Supabase project is gone, so use the newly connected database. Do not redesign any UI in this message except what is needed so the app compiles and the farmers page works. Also fix the error "Failed to add farmer: Organization ID not found": there is NO login for now (single user, open access), so no hook may depend on auth, profiles or an organization lookup. Use default_org_id() in the database instead. Follow the project knowledge. Do everything below as a few ordered migrations, then regenerate the Supabase TypeScript types.

1. FOUNDATION: create orgs(id, name) and app_users(id, org_id, name, role, auth_user_id nullable). Insert ONE default org and a function default_org_id(). Add a set_updated_at() trigger function. Every business table below has: id uuid pk default gen_random_uuid(), org_id uuid not null default default_org_id(), created_by uuid null, created_at, updated_at (trigger), deleted_at null. If old tables farmers/transactions/inventory/bills/profiles exist, rename them to legacy_* first and keep the data.

2. MASTERS: villages(name unique per org); farmers(code like F-0001 auto via sequence+trigger, unique per org; name, phone, village_id fk, address, notes, is_active); buyers(code B-0001 same way; name, firm_name, phone, address, notes, is_active); crops(name, name_local, default_unit) seeded Soybean, Tur, Gram, Wheat, Maize, Cotton, Onion; bag_types(name, tare_kg default 0) seeded Jute, Plastic, Other. Indexes on name/phone (ILIKE friendly).

3. LOTS & WEIGHING: lots(code L-yyMMdd-0001, farmer_id, crop_id, lot_date default current_date, status enum open|auctioned|billed|cancelled, notes); lot_bags(lot_id, bag_type_id, weight_kg numeric(10,3) check >0, seq); view lot_totals(lot_id, bag_count, total_kg, total_quintal).

4. AUCTION: bids(lot_id, buyer_id, rate_per_quintal numeric(12,2) >0, placed_at); sales(lot_id UNIQUE, buyer_id, rate_per_quintal, total_kg, gross_amount, sale_date); function confirm_sale(lot_id, bid_id) that records the sale from the chosen bid and sets the lot to auctioned.

5. ADVANCES: advances(farmer_id, type enum transport|labour|other, amount>0, reason text required when type=other, advance_date, settled_bill_id nullable); view farmer_advance_balance(farmer_id, unsettled_total).

6. BILLS: bills(number unique per org, party_type farmer|buyer, sale_id, farmer_id, buyer_id, rate_per_quintal, total_kg, gross_amount, commission_pct, commission_amount, advances_deducted, net_amount, status draft|issued|paid|cancelled, issued_at); bill_items(bill_id, description, qty_bags, weight_kg, rate, amount). Gap-free numbering per org per financial year (Apr-Mar) via a counters table and next_bill_number(party_type) returning FB/25-26/00001 or BB/25-26/00001. Values are snapshotted at issue, never recomputed.

7. BILLING MATH: compute_bill(sale_id, farmer_commission_pct default 1.5, buyer_commission_pct default 1.5, advance_ids uuid[]) returning gross, farmer commission, buyer commission, advances deducted, farmer net = gross - farmer commission - advances, buyer payable = gross + buyer commission; reject commission outside 0..2; round half-up to 2 decimals. issue_bills(sale_id, farmer_pct, buyer_pct, advance_ids) creates BOTH bills + items in one transaction, marks chosen advances settled, sets the lot to billed. payments(bill_id, amount>0, method cash|upi|bank, paid_at, reference) and views farmer_balances and buyer_balances (billed minus paid).

8. SETTINGS & AUDIT: settings (one row per org: business_name, address, phone, gstin, bill_footer, default_farmer_commission 1.5, default_buyer_commission 1.5, bill_language, bill_prefix_farmer, bill_prefix_buyer); audit_log(table_name,row_id,action,old_data jsonb,new_data jsonb,at) with triggers on bills, payments, advances, sales.

9. SECURITY: enable RLS on all new tables with OPEN policies (anon+authenticated select/insert/update, no hard delete) scoped to default_org_id(), in ONE clearly commented migration so they can later be swapped for auth.uid() based policies. Add FK indexes. Enable realtime on lots, lot_bags, bids, sales, bills, advances, payments. Seed 5 demo farmers, 3 buyers, 2 lots with bags.

10. APP CODE: update useFarmers, useTransactions, useInventory, useDashboardStats and useRealtimeSubscription ONLY enough to compile and work against the new schema: farmers list and "add farmer" (name, phone, village, address) must work without login. Old transactions/inventory pages may show empty data. Make the Supabase URL/anon key come from env vars if possible.

At the end reply with: tables/views/functions created, what you could not do, and assumptions.
