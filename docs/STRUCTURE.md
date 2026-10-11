# AgriAggregator – Website & Code Structure

## 1. Current state (what exists today)
React 18 + TypeScript + Vite + Tailwind + shadcn/ui, TanStack Query, Supabase. Pages: Dashboard, Farmers, Transactions, Inventory, Billing (mock), Data (fake), Settings (fake). Auth page exists but is not routed. See "Fix list" in `LOVABLE_PROMPTS.md`.

## 2. Target route map
| Route | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Today's quantity, bags, commission, pending advances |
| `/farmers`, `/farmers/:id` | Farmers | List/search/add; detail = lots, advances, bills, balance |
| `/buyers`, `/buyers/:id` | Buyers | List/add; detail = purchases, dues |
| `/lots`, `/lots/new`, `/lots/:id` | Lots | Wizard: farmer → crop → bag weights; lot detail |
| `/lots/:id/auction` | Auction | Bids, winner, rate |
| `/advances` | Advances | Quick add, filter by farmer/type |
| `/bills`, `/bills/:id` | Bills | List, preview, print/PDF/share |
| `/payments` | Payments | Record and view payments |
| `/reports` | Reports | Day/village/farmer/buyer reports, CSV |
| `/settings` | Settings | Business info, commission, masters (villages, crops, bag types) |
| `/auth` | Login | Added in Phase 2 (hidden now) |

Mobile bottom nav: Home · Lots · Bills · Farmers · More; floating "+ New lot" button.

## 3. Folder layout
```
src/
  App.tsx, main.tsx
  components/
    layout/    AppShell, BottomNav, Header
    ui/        shadcn primitives
    farmers/ buyers/ lots/ auction/ advances/ bills/ reports/
    common/    MoneyInput, WeightKeypad, EntityPicker, EmptyState
  hooks/       useFarmers, useBuyers, useLots, useAdvances, useBills, ...
  lib/         money.ts (₹ en-IN), billing.ts (commission math, tested), i18n.ts
  integrations/supabase/   client.ts, types.ts (generated)
  pages/       one file per route
supabase/
  migrations/  ordered SQL (see LOVABLE_PROMPTS 1–11)
```

## 4. Data flow
UI → TanStack Query hook → Supabase client → Postgres (RLS) → Realtime invalidates queries. Money rules live in `compute_bill()` (DB) mirrored by `lib/billing.ts` (preview + unit tests).

## 5. Data model
```
orgs 1─* app_users
orgs 1─* villages 1─* farmers
orgs 1─* buyers
orgs 1─* crops, bag_types
farmers 1─* lots 1─* lot_bags
lots 1─* bids *─1 buyers ;  lots 1─1 sales (winner buyer, rate)
farmers 1─* advances (transport|labour|other, reason, settled_bill_id)
sales 1─* bills (type farmer|buyer) 1─* bill_items
bills 1─* payments
orgs 1─1 settings ;  * audit_log
```
Common columns on every table: `id uuid`, `org_id`, `created_by`, `created_at`, `updated_at`, `deleted_at`. Human codes (`F-0001`, `B-0001`, bill numbers) are separate unique columns.

## 6. Auth strategy
Phase 1: open RLS policies scoped to a single default org. Phase 2: replace with `org_id = (select org_id from app_users where id = auth.uid())`, add `/auth` route and `ProtectedRoute`. No table changes needed.
