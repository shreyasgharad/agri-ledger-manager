# 23 Lovable Prompts for AgriAggregator

> **Status:** superseded. Because Lovable's free plan allows only ~3 prompts a day, the database (prompts 1-11) and the core screens (13-21) were built directly in this repo instead: see `supabase/migrations/20261011000000_agri_aggregator_schema.sql` and `src/pages/`. Remaining items from this list: 12 (full visual theme/i18n), 22 (reports, CSV import/export), 23 (PWA, form validation).

Paste **one at a time, in order**. Wait for each to finish and check the preview before the next. Prompts 1–11 are database (use Lovable Cloud / Supabase migrations); 12–23 are UI/UX. Always tell Lovable: *"Do not break existing features; show me the migration before running it."*

**Global context – set once as Project Knowledge** (Lovable → Project settings → Knowledge):
> AgriAggregator is a mobile-first billing app for a crop aggregator/broker in India. Flow: farmer brings crop → bags weighed one by one → buyers bid in an auction → highest bidder wins → two bills (farmer bill, buyer bill) → payments. Broker earns 1.5–2% commission from farmer and from buyer. Farmers can take advances (transport, labour, other with reason) deducted from their bill. Currency ₹ with en-IN formatting. No login for now (single user, open access) but every table must have org_id, created_by, created_at, updated_at, deleted_at so login and multi-user can be enabled later without schema changes. Use UUID primary keys plus human-readable unique codes. Money is numeric(12,2). Use soft delete. Mobile-first, big touch targets, English with Marathi/Hindi-ready labels.

---

## A. Database

### Prompt 1 – Foundation reset
Replace the old schema. Keep a backup copy of existing farmers/transactions/inventory in tables prefixed `legacy_`. Create `orgs` (id, name) and `app_users` (id, org_id, name, role, auth_user_id nullable). Insert one default org. Add a reusable `set_updated_at()` trigger function. Create a convention: every business table has id uuid default gen_random_uuid(), org_id (default = the default org's id via a function `default_org_id()`), created_by uuid null, created_at, updated_at, deleted_at. Drop the unused `profiles`, old `bills(content text)` and `handle_new_user` stub.

### Prompt 2 – Villages and farmers
Create `villages` (name, unique per org) and `farmers` (code text unique per org like F-0001 generated from a sequence by trigger, name, phone, village_id fk, address, notes, is_active). Add trigram/ILIKE-friendly indexes on name and phone. Migrate rows from `legacy_` farmers, creating villages from addresses where possible. Do not store balance on the farmer.

### Prompt 3 – Buyers
Create `buyers` (code B-0001 via sequence trigger, name, firm_name, phone, address, notes, is_active) with the same common columns and indexes.

### Prompt 4 – Crops and bag types
Create `crops` (name, name_local, default_unit) and `bag_types` (name, tare_kg default 0). Seed crops: Soybean, Tur, Gram, Wheat, Maize, Cotton, Onion; bag types: Jute, Plastic, Other.

### Prompt 5 – Lots and weighed bags
Create `lots` (code L-yyMMdd-0001, farmer_id, crop_id, lot_date default today, status enum open|auctioned|billed|cancelled, notes) and `lot_bags` (lot_id, bag_type_id, weight_kg numeric(10,3) > 0, seq). Create view `lot_totals` (lot_id, bag_count, total_kg, total_quintal).

### Prompt 6 – Auction and sale
Create `bids` (lot_id, buyer_id, rate_per_quintal numeric(12,2) > 0, placed_at) and `sales` (lot_id unique, buyer_id, rate_per_quintal, total_kg, gross_amount, sale_date). Add function `confirm_sale(lot_id, bid_id)` that picks the winning bid, writes the sale, and sets lot status to auctioned. Only one sale per lot.

### Prompt 7 – Advances
Create `advances` (farmer_id, type enum transport|labour|other, amount > 0, reason text, advance_date, settled_bill_id nullable). Create view `farmer_advance_balance` (farmer_id, unsettled_total). Reason is required when type = other.

### Prompt 8 – Bills and numbering
Create `bills` (number unique per org, party_type farmer|buyer, sale_id, farmer_id/buyer_id, gross_amount, commission_pct, commission_amount, advances_deducted, net_amount, rate_per_quintal, total_kg, status draft|issued|paid|cancelled, issued_at) and `bill_items` (bill_id, description, qty_bags, weight_kg, rate, amount). Create per-org-per-financial-year (Apr–Mar) gap-free counters and a function `next_bill_number(party_type)` returning FB/25-26/00001 or BB/25-26/00001. Snapshot values are copied at issue and never recomputed.

### Prompt 9 – Billing math and payments
Create SQL function `compute_bill(sale_id, farmer_commission_pct default 1.5, buyer_commission_pct default 1.5, advance_ids uuid[])` returning gross, commissions, advances deducted, farmer net, buyer payable (round half-up to 2 decimals; reject commission outside 0–2). Create `issue_bills(sale_id, ...)` that creates both bills in one transaction and marks selected advances settled. Create `payments` (bill_id, amount > 0, method cash|upi|bank, paid_at, reference) and views `party_balances` for farmers and buyers (billed − paid). Add pgTAP-style or SQL checks for 3 sample calculations.

### Prompt 10 – Security, indexes, realtime
Enable RLS on all tables with **open policies scoped to the default org** (anon + authenticated may select/insert/update; no hard delete – use deleted_at). Put the policies in one clearly commented migration so they can later be replaced with `org_id = my_org_id()` based on auth.uid(). Add FK indexes, enable realtime on lots, bids, bills, advances, payments, and seed 5 demo farmers, 3 buyers, 2 lots with bags.

### Prompt 11 – Settings and audit
Create `settings` (one row per org: business_name, address, phone, gstin, bill_footer, default_farmer_commission, default_buyer_commission, bill_language, bill_prefix_farmer, bill_prefix_buyer) and `audit_log` (table_name, row_id, action, old_data jsonb, new_data jsonb, at) with triggers on bills, payments, advances, sales. Regenerate Supabase TypeScript types and make the Supabase URL/key come from env vars instead of being hard-coded.

---

## B. UI / UX

### Prompt 12 – Design system
Restyle with a fresh green/earth palette (primary deep green, accent amber), 16px base text, minimum 44px touch targets, rounded cards, light and dark mode. Add `formatINR()` using Intl en-IN and `formatKg/Quintal()` helpers in `src/lib`. Prepare i18n (English default, Marathi and Hindi stubs) for labels.

### Prompt 13 – App shell
Remove the unused Sidebar/Layout/ProtectedRoute/Index files. Build a mobile-first shell: sticky header, bottom navigation (Home, Lots, Bills, Farmers, More) and a floating "+ New lot" button; on desktop show a collapsible side rail. Do not require login anywhere.

### Prompt 14 – Dashboard
Show today's lots, bags, quintals, commission earned, pending advances, unpaid bills, plus a 7-day bar chart and a village-wise breakdown. Fix the invalid month-end date filter (use start/end date ranges) and key charts by year-month.

### Prompt 15 – Farmers
Searchable list (name, phone, code) with village filter and infinite/paginated loading for 700+ rows; quick add sheet; edit; farmer detail page with tabs: Lots, Advances, Bills, Balance. Confirm before delete (soft delete). Call and WhatsApp buttons.

### Prompt 16 – Buyers
Same pattern as farmers: list, add/edit sheet, detail page with purchases, bills and amount due.

### Prompt 17 – New lot wizard
Step 1 pick farmer (searchable combobox, with "add new"), step 2 pick crop, step 3 weigh bags: large numeric keypad, bag type chips, "Add bag" button, list of bags with delete, sticky live totals (bags, kg, quintal). Save as an open lot; works one-handed on a phone.

### Prompt 18 – Auction screen
For a lot: add bids (buyer picker + rate), list bids sorted high→low with the top bid highlighted, "Confirm winner" button showing gross amount preview, then lock the lot and offer "Create bills".

### Prompt 19 – Advances UI
Quick-add advance (farmer picker, type chips Transport/Labour/Other, amount, reason, date). Advances page with filters by farmer/type/settled; show unsettled total on the farmer card and in the lot screen.

### Prompt 20 – Bill generation
After a sale, show a "Create bills" screen: commission % selector (1.5 / 1.75 / 2) for farmer and buyer, list of unsettled advances with checkboxes, and a live breakdown (gross, commission, advances, net). Confirm calls `issue_bills` and opens both bills.

### Prompt 21 – Print and share
Bill view with A4 layout and 58/80 mm thermal layout via print CSS; buttons: Print, Download PDF, Share on WhatsApp (wa.me text with totals). Template shows business header, bill number, date, party, bag/weight table, rate, gross, commission, advances, net, signature line, footer. Labels in English with Marathi/Hindi option. Provide two bills (farmer copy, buyer copy) from one action.

### Prompt 22 – Reports, payments, data, settings
Payments screen to record cash/UPI/bank against a bill with live balance. Reports: day-wise, village-wise, farmer-wise, buyer-wise with date range and real CSV export. Replace the fake Data Management page with real CSV import (farmers, buyers) with validation and an error report. Wire Settings to the `settings` table and masters (villages, crops, bag types).

### Prompt 23 – Cleanup, PWA, tests
Delete the Google Sheets service, `useBills` legacy hook, mock data, duplicate toast files, and all console.log calls. Use react-hook-form + zod on every form. Add PWA manifest and service worker (installable, cached shell). Fix jest config (ESM/`moduleNameMapper`, jsdom env, move test deps to devDependencies, add `test` script) and add unit tests for `lib/billing.ts` (1.5% vs 2%, advances larger than gross, rounding). Rename branding to AgriAggregator everywhere.

---

## Known issues in the current repo that these prompts fix
No `/auth` route; signup creates no org/profile; `farmers.balance` never updates; `whatsapp_logs` missing; hard-coded Supabase keys; mock Billing/Settings/Data pages; invalid `-32` date filter; unscoped query keys; broken jest config; dead code.

## Manual steps outside Lovable
1. Rename the GitHub repo to `agri-aggregator` (GitHub → Settings → Repository name), then re-link it in Lovable (Project → GitHub settings).
2. Later (Phase 2): enable Supabase Auth, replace the open RLS policies, add `/auth` and route protection.
