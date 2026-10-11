# AgriAggregator – Product Requirements (PRD)

Status: Draft v1 · Owner: Shreyas · Phase 1 = single user, open access

## 1. Problem
A crop aggregator/broker collects produce daily from farmers across ~12–13 villages (500–700 customers). Today the work is on paper: weighing, auction, advances and bills are written by hand, which is slow, error-prone and hard to look up later. The broker needs one central, always-available record and bills that can be printed from a phone.

## 2. Goals
1. One **central database** reachable from any phone/laptop (later with login).
2. Capture the real daily flow: collect → weigh → auction → bill → advances.
3. Generate **two bills per sale**: one for the farmer, one for the buyer; print/share from the phone.
4. Automate commission (**1.5–2%** from farmer and from buyer) and advance deduction.
5. A **unique ID** for every farmer, buyer, lot, bill – the structure must not need redesign when login/multi-user arrives.
6. Mobile-first, fast, usable by non-technical staff.

Non-goals (Phase 1): payments gateway, GST filing, inventory/warehouse, farmer-facing app.

## 3. Users
| Phase | User | Notes |
|---|---|---|
| 1 | Owner (the builder) | No login, open access, own data only |
| 2 | Broker (father) + staff | Login, same data on every phone |
| 3 | Roles/hierarchy | Owner > manager > weigher/clerk; per-village access |

## 4. The daily workflow
1. **Collection** – Farmer brings crop (or it is picked up in the village). A lot is created for the farmer: crop, date.
2. **Weighing** – A weigher weighs each bag; the app records bag type (jute, plastic, etc.) and weight per bag. Totals: bags, kg/quintal.
3. **Auction** – Buyers bid for the lot. The app records bids; the highest bid wins (rate per quintal/kg). Winner pays; the broker keeps his commission.
4. **Advances** – Farmers may have taken advances (transport, labour, other with a reason). Unsettled advances are deducted from the farmer's payout.
5. **Billing** – Two bills are generated and printed: **Farmer bill** (gross − commission − advances = net payable) and **Buyer bill** (gross + commission = amount to pay).
6. **Settlement** – Payments are recorded against bills; balances for farmers and buyers are always visible.

## 5. Functional requirements
### 5.1 Masters
- Farmers: unique code `F-0001`, name, phone, village, address, notes.
- Buyers: unique code `B-0001`, name, phone, firm, address.
- Villages, crops, bag types (editable).
### 5.2 Lots & weighing
- Create lot (farmer, crop, date); add bags one by one (numeric keypad); edit/remove a bag; live totals.
### 5.3 Auction
- Add bids per lot; auto-highlight highest; confirm winner and rate; lock the lot.
### 5.4 Advances
- Add advance (type: transport | labour | other, amount, reason, date) against a farmer; per-farmer advance ledger; auto-pick unsettled advances into the next farmer bill (user can untick).
### 5.5 Bills
- Sequential per financial year, gap-free: e.g. `FB/25-26/00012` (farmer), `BB/25-26/00012` (buyer).
- Stores a **snapshot** of rate, commission %, weights so later edits never change a printed bill.
- Formulas:
  - gross = total weight × rate
  - farmer commission = gross × c_f % ; buyer commission = gross × c_b %
  - farmer net = gross − farmer commission − advances deducted
  - buyer payable = gross + buyer commission
  - Default c = 1.5%, selectable up to 2% per party/lot.
- Print on A4 and 58/80 mm thermal; PDF download; WhatsApp share link; English + Marathi/Hindi labels.
### 5.6 Payments & ledger
- Record payments (cash/UPI/bank) against a bill; party balance = bills − payments (computed, never typed).
### 5.7 Dashboard & reports
- Today: lots, bags, quintals, commission earned, pending advances.
- Reports: day-wise, village-wise, farmer-wise, buyer-wise; CSV export.
### 5.8 Settings
- Business name/address/GSTIN, bill footer, default commission, language, bill-number prefix.

## 6. Non-functional requirements
- **Mobile-first**, touch targets ≥ 44 px, works on low-end Android, PWA-installable.
- **Multi-device sync** through Supabase (Postgres + Realtime).
- **Robust data**: money as `numeric(12,2)`, soft delete, audit log, all calculations server-side + unit-tested.
- **Future-proof**: every row has `org_id`, `created_by`; RLS policies swap from "open" to `auth.uid()` without schema changes.
- **Performance**: lists paginated/indexed for 700+ farmers and years of bills.
- **Printing** must work from a phone browser without extra apps.

## 7. Success metrics
- A lot goes from weighing to printed bills in < 2 minutes.
- Zero calculation mismatches vs. manual check on 50 sample bills.
- All 500–700 farmers migrated with unique codes.

## 8. Roadmap
| Phase | Scope |
|---|---|
| 1 (now) | New schema, farmers/buyers, lots/weighing, auction, advances, 2 bills, print, dashboard – open access |
| 2 | Login (phone OTP/email), RLS on, staff accounts, offline queue |
| 3 | Roles & hierarchy, village-wise permissions, audit views, WhatsApp auto-send |
| 4 | Farmer portal, analytics, multi-branch |

## 9. Open questions
1. Does the buyer commission differ per buyer? (assumed same 1.5–2% range)
2. Units: kg internally, quintal on bills? (assumed yes)
3. Are bag weights deducted for tare? (assumed net weight entered)
4. Required bill language(s) and GST details?
